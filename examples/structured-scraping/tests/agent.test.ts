import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StructuredScrapingAgent } from '../src/agent.js';
import { createMockLLM } from '../../../mocks/llm-mocks.js';
import { TestDataFactory } from '../../../mocks/test-fixtures.js';
import { scrapedDataSchema } from '../src/schemas.js';
import axios from 'axios';

// Mock axios completely
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedAxios = axios as any;

describe('StructuredScrapingAgent - Unit Tests', () => {
  let agent: StructuredScrapingAgent;
  let mockLLM: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock LLM
    mockLLM = createMockLLM(['Enhanced content analysis complete']);

    // Setup axios mock to return test data
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Main Title</h1>
            <p>This is a test paragraph.</p>
            <a href="https://example.com">External Link</a>
          </body>
        </html>
      `,
    });

    // Create agent with mock LLM
    agent = new StructuredScrapingAgent(mockLLM as any);
  });

  describe('scrape', () => {
    it('should successfully scrape and structure webpage content', async () => {
      const url = 'https://example.com';

      const result = await agent.scrape(url);

      // Validate result structure
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);
      expect(result.title).toBeDefined();
      expect(result.metadata.url).toBe(url);
      expect(result.metadata.scrapedAt).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });

    it('should handle custom scraping configuration', async () => {
      const url = 'https://example.com';
      const customConfig = {
        timeout: 10000,
        userAgent: 'CustomAgent/1.0',
        headers: { 'Custom-Header': 'test' },
      };

      const result = await agent.scrape(url, customConfig);

      expect(result).toBeDefined();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          timeout: 10000,
          headers: expect.objectContaining({
            'User-Agent': 'CustomAgent/1.0',
            'Custom-Header': 'test',
          }),
        })
      );
    });

    it('should extract headings correctly', async () => {
      const url = 'https://example.com';

      const result = await agent.scrape(url);

      expect(result.headings).toBeInstanceOf(Array);
      expect(result.headings.length).toBeGreaterThan(0);
      expect(result.headings[0]).toMatchObject({
        level: expect.any(Number),
        text: expect.any(String),
      });
    });

    it('should extract links with external flag', async () => {
      const url = 'https://example.com';

      const result = await agent.scrape(url);

      expect(result.links).toBeInstanceOf(Array);
      if (result.links.length > 0) {
        expect(result.links[0]).toMatchObject({
          text: expect.any(String),
          url: expect.any(String),
          isExternal: expect.any(Boolean),
        });
      }
    });

    it('should handle network errors gracefully', async () => {
      const url = 'https://nonexistent.example.com';
      const networkError = new Error('ENOTFOUND');
      (networkError as any).code = 'ENOTFOUND';
      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(agent.scrape(url)).rejects.toMatchObject({
        type: 'network',
        url,
        message: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should handle timeout errors', async () => {
      const url = 'https://slow.example.com';
      const timeoutError = new Error('ETIMEDOUT');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockedAxios.get.mockRejectedValueOnce(timeoutError);

      await expect(agent.scrape(url)).rejects.toMatchObject({
        type: 'timeout',
        url,
      });
    });

    it('should validate output schema', async () => {
      const url = 'https://example.com';

      const result = await agent.scrape(url);

      // Should not throw validation error
      expect(() => scrapedDataSchema.parse(result)).not.toThrow();
    });

    it('should fallback gracefully when LLM enhancement fails', async () => {
      const url = 'https://example.com';

      // Mock LLM invoke to fail
      const mockInvoke = vi
        .fn()
        .mockRejectedValueOnce(new Error('LLM service unavailable'));
      agent = new StructuredScrapingAgent({ invoke: mockInvoke } as any);

      const result = await agent.scrape(url);

      // Should still return valid data even if LLM fails
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);
      expect(result.title).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should categorize different error types correctly', async () => {
      const testCases = [
        {
          error: { code: 'ENOTFOUND', message: 'Network error' },
          expectedType: 'network',
        },
        {
          error: { code: 'ECONNREFUSED', message: 'Connection refused' },
          expectedType: 'network',
        },
        {
          error: { code: 'ETIMEDOUT', message: 'Timeout' },
          expectedType: 'timeout',
        },
        { error: new Error('HTML parsing failed'), expectedType: 'parsing' },
        { error: new Error('Unknown error'), expectedType: 'unknown' },
      ];

      for (const { error, expectedType } of testCases) {
        mockedAxios.get.mockRejectedValueOnce(error);

        try {
          await agent.scrape('https://example.com');
        } catch (scrapingError: any) {
          expect(scrapingError.type).toBe(expectedType);
        }
      }
    });
  });

  describe('content extraction', () => {
    it('should extract different content types', async () => {
      // Mock HTML with various content types
      const htmlWithVariousContent = `
        <html>
          <head><title>Test Page</title></head>
          <body>
            <h1>Main Title</h1>
            <p>This is a paragraph.</p>
            <ul><li>List item 1</li><li>List item 2</li></ul>
            <blockquote>This is a quote</blockquote>
            <pre><code>const code = true;</code></pre>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: htmlWithVariousContent,
      });

      const result = await agent.scrape('https://example.com');

      const contentTypes = result.content.map((c: { type: string }) => c.type);
      expect(contentTypes).toContain('paragraph');
      expect(contentTypes).toContain('list');
      expect(contentTypes).toContain('quote');
      expect(contentTypes).toContain('code');
    });

    it('should detect language when possible', async () => {
      const result = await agent.scrape('https://example.com');

      // Language detection is optional but should be string if present
      if (result.metadata.language) {
        expect(typeof result.metadata.language).toBe('string');
      }
    });
  });

  describe('integration with test fixtures', () => {
    it('should work with test data factory', async () => {
      const testData = TestDataFactory.createScrapingResult({
        url: 'https://test.example.com',
        title: 'Test Factory Page',
      });

      // Verify test data is valid
      expect(testData.url).toBe('https://test.example.com');
      expect(testData.title).toBe('Test Factory Page');
      expect(testData.headings).toBeInstanceOf(Array);
      expect(testData.links).toBeInstanceOf(Array);
      expect(testData.images).toBeInstanceOf(Array);
    });
  });
});
