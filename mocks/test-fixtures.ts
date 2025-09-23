import { z } from 'zod';

/**
 * Test data factory for generating consistent test data
 */
export class TestDataFactory {
  static createWebPageContent(
    overrides?: Partial<WebPageContent>
  ): WebPageContent {
    return {
      url: 'https://example.com',
      title: 'Example Page',
      content: 'This is example content',
      metadata: {
        description: 'Example page description',
        keywords: ['example', 'test'],
        author: 'Test Author',
      },
      ...overrides,
    };
  }

  static createScrapingResult(
    overrides?: Partial<ScrapingResult>
  ): ScrapingResult {
    return {
      url: 'https://example.com',
      title: 'Example Page',
      headings: ['Welcome to Example', 'Section 1'],
      paragraphs: ['This is a test page', 'Content for section 1'],
      links: [
        { text: 'Home', url: 'https://example.com' },
        { text: 'About', url: 'https://example.com/about' },
      ],
      images: [{ alt: 'Example image', src: 'https://example.com/image.jpg' }],
      metadata: {
        scrapedAt: new Date().toISOString(),
        userAgent: 'test-agent',
      },
      ...overrides,
    };
  }

  static createApiResponse(overrides?: any): any {
    return {
      success: true,
      data: {
        id: 1,
        name: 'Test Item',
        description: 'Test description',
      },
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  }
}

// Type definitions for test data
export interface WebPageContent {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
  };
}

export interface ScrapingResult {
  url: string;
  title: string;
  headings: string[];
  paragraphs: string[];
  links: Array<{ text: string; url: string }>;
  images: Array<{ alt: string; src: string }>;
  metadata: {
    scrapedAt: string;
    userAgent: string;
  };
}

// Validation schemas for test data
export const webPageContentSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  content: z.string(),
  metadata: z.object({
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    author: z.string().optional(),
  }),
});

export const scrapingResultSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  headings: z.array(z.string()),
  paragraphs: z.array(z.string()),
  links: z.array(
    z.object({
      text: z.string(),
      url: z.string().url(),
    })
  ),
  images: z.array(
    z.object({
      alt: z.string(),
      src: z.string().url(),
    })
  ),
  metadata: z.object({
    scrapedAt: z.string(),
    userAgent: z.string(),
  }),
});
