import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StructuredScrapingAgent } from '../src/agent.js';
import { scrapedDataSchema } from '../src/schemas.js';

// Mock the LLM to avoid real API calls in unit tests
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    // Mock the LLM methods if needed
  })),
}));

// Mock createAgent to return a mock agent
vi.mock('langchain', () => ({
  createAgent: vi.fn().mockResolvedValue({
    invoke: vi.fn().mockResolvedValue({
      messages: [{
        content: JSON.stringify({
          title: 'Test Page',
          description: 'Test description',
          content: [{ type: 'paragraph', text: 'Test content' }],
          headings: [{ level: 1, text: 'Test Heading' }],
          links: [{ text: 'Test Link', url: 'https://example.com', isExternal: true }],
          images: [],
          metadata: {
            url: 'https://example.com',
            scrapedAt: '2023-10-05T10:00:00Z',
            wordCount: 10
          }
        })
      }]
    })
  }),
  tool: vi.fn(),
  initChatModel: vi.fn(),
}));

describe('StructuredScrapingAgent - Unit Tests', () => {
  let agent: StructuredScrapingAgent;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create agent
    agent = new StructuredScrapingAgent();
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

    it('should validate output schema', async () => {
      const url = 'https://example.com';

      const result = await agent.scrape(url);

      // Should not throw validation error
      expect(() => scrapedDataSchema.parse(result)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle agent errors gracefully', async () => {
      // Mock createAgent to throw an error
      const { createAgent } = await import('langchain');
      (createAgent as any).mockRejectedValueOnce(new Error('Agent creation failed'));

      const failingAgent = new StructuredScrapingAgent();

      await expect(failingAgent.scrape('https://example.com')).rejects.toThrow('Agent creation failed');
    });
  });

  describe('content extraction', () => {
    it('should extract different content types', async () => {
      const url = 'https://example.com';

      const result = await agent.scrape(url);

      // The mock returns paragraph content
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content[0]).toMatchObject({
        type: 'paragraph',
        text: expect.any(String),
      });
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
    it('should work with basic HTML structure', async () => {
      const url = 'https://example.com';

      const result = await agent.scrape(url);

      // Verify basic structure is present
      expect(result.metadata.url).toBe(url);
      expect(result.title).toBeDefined();
      expect(result.headings).toBeInstanceOf(Array);
      expect(result.links).toBeInstanceOf(Array);
      expect(result.images).toBeInstanceOf(Array);
    });
  });
});
