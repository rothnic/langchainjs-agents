import { z } from 'zod';

/**
 * Schema for structured web scraping output
 */
export const scrapedDataSchema = z.object({
  title: z.string().describe('The main title of the webpage'),
  description: z
    .string()
    .optional()
    .describe('Meta description or page summary'),
  headings: z
    .array(
      z.object({
        level: z.number().min(1).max(6).describe('Heading level (1-6)'),
        text: z.string().describe('Heading text content'),
      })
    )
    .describe('All headings found on the page'),
  content: z
    .array(
      z.object({
        type: z
          .enum(['paragraph', 'list', 'code', 'quote'])
          .describe('Type of content block'),
        text: z.string().describe('The text content'),
        metadata: z
          .record(z.any())
          .optional()
          .describe('Additional metadata for the content'),
      })
    )
    .describe('Main content blocks'),
  links: z
    .array(
      z.object({
        text: z.string().describe('Link text'),
        url: z.string().url().describe('Target URL'),
        isExternal: z.boolean().describe('Whether the link is external'),
      })
    )
    .describe('All links found on the page'),
  images: z
    .array(
      z.object({
        src: z.string().url().describe('Image source URL'),
        alt: z.string().describe('Alt text'),
        caption: z.string().optional().describe('Image caption if available'),
      })
    )
    .describe('All images found on the page'),
  metadata: z
    .object({
      url: z.string().url().describe('The scraped page URL'),
      scrapedAt: z
        .string()
        .datetime()
        .describe('Timestamp when the page was scraped'),
      wordCount: z.number().describe('Approximate word count'),
      language: z
        .string()
        .optional()
        .describe('Detected language of the content'),
      author: z.string().optional().describe('Page author if available'),
      publishedAt: z
        .string()
        .optional()
        .describe('Publication date if available'),
    })
    .describe('Metadata about the scraped page'),
});

export type ScrapedData = z.infer<typeof scrapedDataSchema>;

/**
 * Schema for scraping configuration
 */
export const scrapingConfigSchema = z.object({
  url: z.string().url().describe('URL to scrape'),
  timeout: z.number().default(30000).describe('Timeout in milliseconds'),
  maxRetries: z
    .number()
    .default(3)
    .describe('Maximum number of retry attempts'),
  userAgent: z.string().optional().describe('Custom user agent'),
  headers: z.record(z.string()).optional().describe('Additional HTTP headers'),
  selectors: z
    .object({
      ignore: z
        .array(z.string())
        .optional()
        .describe('CSS selectors to ignore'),
      focus: z
        .array(z.string())
        .optional()
        .describe('CSS selectors to focus on'),
    })
    .optional()
    .describe('Custom selectors for content extraction'),
});

export type ScrapingConfig = z.infer<typeof scrapingConfigSchema>;

/**
 * Schema for scraping errors
 */
export const scrapingErrorSchema = z.object({
  type: z.enum(['network', 'parsing', 'validation', 'timeout', 'unknown']),
  message: z.string(),
  url: z.string().url(),
  timestamp: z.string().datetime(),
  details: z.record(z.any()).optional(),
});

export type ScrapingError = z.infer<typeof scrapingErrorSchema>;
