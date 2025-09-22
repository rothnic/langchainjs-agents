import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StructuredScrapingAgent } from '../src/agent.js';
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

    // Create agent with real structured extraction
    try {
      agent = new StructuredScrapingAgent();
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

  describe('Structured Data Extraction', () => {
    it('should extract structured data from a blog post', async () => {
      const url = testServer.getPageUrl('blog-post');

      const result = await agent.scrape(url, {
        timeout: 20000,
      });

      // Validate schema compliance
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);

      // Validate basic structure
      expect(result.title).toBeDefined();
      expect(result.metadata.url).toBe(url);
      expect(result.metadata.scrapedAt).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(Array.isArray(result.headings)).toBe(true);
      expect(Array.isArray(result.content)).toBe(true);
      expect(Array.isArray(result.links)).toBe(true);
    });

    it('should extract structured data from an e-commerce page', async () => {
      const url = testServer.getPageUrl('ecommerce');

      const result = await agent.scrape(url, { timeout: 20000 });

      // Validate schema compliance
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);

      // Should have basic structure
      expect(result.title).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should extract structured data from a simple page', async () => {
      const url = testServer.getPageUrl('simple');

      const result = await agent.scrape(url, { timeout: 20000 });

      // Validate schema compliance
      expect(scrapedDataSchema.safeParse(result).success).toBe(true);

      expect(result.title).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('should handle network timeouts gracefully', async () => {
      const url = testServer.getPageUrl('delay');

      await expect(agent.scrape(url, { timeout: 1000 })).rejects.toMatchObject({
        type: 'timeout',
        url,
      });
    });

    it('should handle server errors gracefully', async () => {
      const url = testServer.getPageUrl('error');

      await expect(agent.scrape(url, { timeout: 20000 })).rejects.toMatchObject({
        type: 'unknown',
        url,
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete extraction within reasonable time', async () => {
      const url = testServer.getPageUrl('blog-post');
      const startTime = Date.now();

      await agent.scrape(url, { timeout: 20000 });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

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
  });
});
