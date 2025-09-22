import { describe, it, expect, beforeAll, afterAll, test } from 'vitest';
import { StructuredScrapingAgent } from '../src/agent.js';
import { LLMFactory } from '../../../config/llm-factory.js';
import { scrapedDataSchema } from '../src/schemas.js';
import {
  TestWebServer,
  getTestServer,
  cleanupTestServer,
} from '../../../tests/test-web-server.js';
import { config } from '../../../config/environment.js';


// Only run integration tests when real APIs are enabled
const describeIntegration = config.useRealApis ? describe : describe.skip;

describeIntegration('StructuredScrapingAgent - Integration Tests', () => {
  let agent: StructuredScrapingAgent;
  let testServer: TestWebServer;

  beforeAll(async () => {
    // Start test web server
    testServer = await getTestServer();

    // Create agent with real LLM (GitHub Models)
    try {
      const llm = LLMFactory.createTestLLM();
      agent = new StructuredScrapingAgent(llm);
    } catch (error) {
      console.warn(
        'Skipping integration tests - no LLM provider configured:',
        error instanceof Error ? error.message : String(error)
      );
      return;
    }
  });

  afterAll(async () => {
    await cleanupTestServer();
  });

  describe('Real Web Scraping', () => {
    it('should scrape and analyze a blog post page', async () => {
      const url = testServer.getPageUrl('blog-post');

      const result = await agent.scrape(url, {
        timeout: 20000,
      });

      console.log(result)

      // Validate schema compliance
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);

      // Validate extracted content
      expect(result.title).toContain('Advanced Web Scraping Techniques');
      expect(result.headings).toHaveLength(6); // h1, h2, h3 elements
      expect(result.headings[0]).toMatchObject({
        level: 1,
        text: 'Advanced Web Scraping Techniques',
      });

      // Should extract different content types
      const contentTypes = result.content.map((c) => c.type);
      expect(contentTypes).toContain('paragraph');
      expect(contentTypes).toContain('list');
      expect(contentTypes).toContain('quote');
      expect(contentTypes).toContain('code');

      // Should identify external vs internal links
      expect(result.links.some((link) => link.isExternal)).toBe(true);
      expect(result.links.some((link) => !link.isExternal)).toBe(true);

      // Should extract metadata
      expect(result.metadata.url).toBe(url);
      expect(result.metadata.wordCount).toBeGreaterThan(100);
      expect(result.metadata.author).toBe('Test Author');
      expect(result.metadata.publishedAt).toContain('2024-01-15');
    });

  it('should scrape and analyze an e-commerce catalog', async () => {
      const url = testServer.getPageUrl('ecommerce');

  const result = await agent.scrape(url, { timeout: 20000 });

      // Validate schema compliance
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);

      // Should extract product information
      expect(result.title).toContain('Tech Products Catalog');
      expect(
        result.content.some(
          (c) =>
            c.text.includes('UltraBook Pro') ||
            c.text.includes('SmartPhone Alpha')
        )
      ).toBe(true);

      // Should have structured headings
      const sectionHeadings = result.headings.filter(
        (h) =>
          h.text.includes('Laptops') ||
          h.text.includes('Smartphones') ||
          h.text.includes('Accessories')
      );
      expect(sectionHeadings.length).toBeGreaterThanOrEqual(3);
    });

  it('should handle simple pages correctly', async () => {
      const url = testServer.getPageUrl('simple');

  const result = await agent.scrape(url, { timeout: 20000 });

      // Validate schema compliance
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);

      expect(result.title).toBe('Simple Test Page');
      expect(result.headings).toHaveLength(3); // h1 + 2 h2 elements
      expect(result.content.length).toBeGreaterThan(3);
    });

  it('should handle network timeouts gracefully', async () => {
      const url = testServer.getPageUrl('delay');

      await expect(agent.scrape(url, { timeout: 1000 })).rejects.toMatchObject({
        type: 'timeout',
        url,
      });
    });

  it('should categorize server errors correctly', async () => {
      const url = testServer.getPageUrl('error');

      await expect(agent.scrape(url, { timeout: 20000 })).rejects.toMatchObject({
        type: 'unknown', // 500 errors are categorized as unknown
        url,
      });
    });
  });

  describe('LLM Enhancement Integration', () => {
  it('should successfully enhance content with real LLM', async () => {
      const url = testServer.getPageUrl('blog-post');

  const result = await agent.scrape(url, { timeout: 20000 });

      // The LLM should have enhanced the metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata.language).toBeDefined();

      // Content should be properly categorized
      expect(
        result.content.every((c) =>
          ['paragraph', 'list', 'code', 'quote'].includes(c.type)
        )
      ).toBe(true);
    });

  it('should handle LLM failures gracefully', async () => {
      // Create an agent with an invalid LLM configuration to test fallback
      const invalidLLM = LLMFactory.createLLM({
        model: 'non-existent-model',
        temperature: 0.1,
      });
      const faultyAgent = new StructuredScrapingAgent(invalidLLM);

      const url = testServer.getPageUrl('simple');

      // Should still return valid data even if LLM enhancement fails
  const result = await faultyAgent.scrape(url, { timeout: 20000 });
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);
    });
  });

  describe('Rate Limiting and Performance', () => {
  it('should handle multiple concurrent requests', async () => {
      const urls = [
        testServer.getPageUrl('simple'),
        testServer.getPageUrl('blog-post'),
        testServer.getPageUrl('ecommerce'),
      ];

  const promises = urls.map((url) => agent.scrape(url, { timeout: 20000 }));
  const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(scrapedDataSchema.safeParse(result).success).toBe(true);
      });
    });

  it('should complete scraping within reasonable time limits', async () => {
      const url = testServer.getPageUrl('blog-post');
      const startTime = Date.now();

  await agent.scrape(url, { timeout: 20000 });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});
