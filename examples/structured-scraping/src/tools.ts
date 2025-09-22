import axios from 'axios';
import * as cheerio from 'cheerio';
import { tool } from 'langchain';
import { z } from 'zod';
import type { ScrapingConfig } from './schemas.js';

/**
 * Tool to load a webpage and return its HTML content
 */
export const loadPageTool = tool(
  async ({ url }: { url: string }) => {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      return {
        html: response.data,
        status: response.status,
        title: cheerio.load(response.data)('title').text().trim(),
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to load page: ${error.message}`);
      }
      throw new Error(`Unexpected error loading page: ${String(error)}`);
    }
  },
  {
    name: 'loadPage',
    description: 'Load a webpage and return its HTML content',
    schema: z.object({
      url: z.string().url().describe('URL to load'),
    }),
  }
);

/**
 * Tool to get a high-level outline of the page structure
 */
export const getPageOutlineTool = tool(
  async ({ html }: { html: string }) => {
    const $ = cheerio.load(html);

    const outline = {
      title: $('title').text().trim(),
      headings: $('h1, h2, h3, h4, h5, h6')
        .map((_, el) => ({
          tag: (el as any).tagName,
          text: $(el).text().trim(),
        }))
        .get(),
      mainSections: $('main, article, .content, #content, .main')
        .map((_, el) => ({
          tag: (el as any).tagName,
          class: $(el).attr('class'),
          id: $(el).attr('id'),
          textLength: $(el).text().length,
        }))
        .get(),
      metaDescription: $('meta[name="description"]').attr('content') || null,
    };

    return outline;
  },
  {
    name: 'getPageOutline',
    description: 'Get a high-level outline of the page structure',
    schema: z.object({
      html: z.string().describe('HTML content to analyze'),
    }),
  }
);

/**
 * Tool to extract content from specific sections using CSS selectors
 */
export const extractSectionContentTool = tool(
  async ({ html, selector }: { html: string; selector: string }) => {
    const $ = cheerio.load(html);
    const elements = $(selector);

    if (elements.length === 0) {
      return {
        content: [],
        message: `No elements found for selector: ${selector}`,
      };
    }

    const content = elements
      .map((_, el) => {
        const $el = $(el);
        return {
          tag: (el as any).tagName,
          text: $el.text().trim(),
          html: $el.html(),
          textLength: $el.text().length,
        };
      })
      .get();

    return { content, count: elements.length };
  },
  {
    name: 'extractSectionContent',
    description: 'Extract content from specific sections using CSS selectors',
    schema: z.object({
      html: z.string().describe('HTML content to extract from'),
      selector: z.string().describe('CSS selector for the sections to extract'),
    }),
  }
);

/**
 * Tool to extract metadata from the page
 */
export const extractMetadataTool = tool(
  async ({ html, url }: { html: string; url: string }) => {
    const $ = cheerio.load(html);

    const metadata = {
      url,
      scrapedAt: new Date().toISOString(),
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || null,
      keywords: $('meta[name="keywords"]').attr('content') || null,
      author: $('meta[name="author"]').attr('content') || null,
      wordCount: $('body')
        .text()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
      ogTitle: $('meta[property="og:title"]').attr('content') || null,
      ogDescription:
        $('meta[property="og:description"]').attr('content') || null,
      ogImage: $('meta[property="og:image"]').attr('content') || null,
    };

    return metadata;
  },
  {
    name: 'extractMetadata',
    description: 'Extract metadata from the page',
    schema: z.object({
      html: z.string().describe('HTML content to extract metadata from'),
      url: z.string().url().describe('URL of the page'),
    }),
  }
);

/**
 * Tool to extract headings from the page
 */
export const extractHeadingsTool = tool(
  async ({ html }: { html: string }) => {
    const $ = cheerio.load(html);

    const headings = $('h1, h2, h3, h4, h5, h6')
      .map((_, el) => ({
        level: parseInt((el as any).tagName.charAt(1)),
        text: $(el).text().trim(),
      }))
      .get();

    return { headings };
  },
  {
    name: 'extractHeadings',
    description: 'Extract all headings from the page',
    schema: z.object({
      html: z.string().describe('HTML content to extract headings from'),
    }),
  }
);

/**
 * Tool to extract links from the page
 */
export const extractLinksTool = tool(
  async ({ html, baseUrl }: { html: string; baseUrl: string }) => {
    const $ = cheerio.load(html);
    const base = new URL(baseUrl);

    const links = $('a[href]')
      .map((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();

        if (!href || !text) return null;

        try {
          const url = new URL(href, baseUrl);
          return {
            text,
            url: url.href,
            isExternal: url.hostname !== base.hostname,
          };
        } catch {
          return null;
        }
      })
      .get()
      .filter(Boolean);

    return { links };
  },
  {
    name: 'extractLinks',
    description: 'Extract links from the page',
    schema: z.object({
      html: z.string().describe('HTML content to extract links from'),
      baseUrl: z
        .string()
        .url()
        .describe('Base URL for resolving relative links'),
    }),
  }
);

/**
 * Tool to extract images from the page
 */
export const extractImagesTool = tool(
  async ({ html, baseUrl }: { html: string; baseUrl: string }) => {
    const $ = cheerio.load(html);

    const images = $('img[src]')
      .map((_, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt') || '';
        const title = $(el).attr('title') || null;

        if (!src) return null;

        try {
          const url = new URL(src, baseUrl);
          return {
            src: url.href,
            alt,
            caption: title,
          };
        } catch {
          return null;
        }
      })
      .get()
      .filter(Boolean);

    return { images };
  },
  {
    name: 'extractImages',
    description: 'Extract images from the page',
    schema: z.object({
      html: z.string().describe('HTML content to extract images from'),
      baseUrl: z
        .string()
        .url()
        .describe('Base URL for resolving relative image URLs'),
    }),
  }
);

/**
 * Create all web scraping tools with the given configuration
 */
export function createWebScrapingTools(_config?: Partial<ScrapingConfig>) {
  return [
    loadPageTool,
    getPageOutlineTool,
    extractSectionContentTool,
    extractMetadataTool,
    extractHeadingsTool,
    extractLinksTool,
    extractImagesTool,
  ];
}
