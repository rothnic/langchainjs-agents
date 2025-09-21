import axios from 'axios';
import * as cheerio from 'cheerio';
import { ChatOpenAI } from "@langchain/openai";
import { z } from 'zod';
import {
  scrapedDataSchema,
  scrapingConfigSchema,
  type ScrapedData,
  type ScrapingConfig,
  type ScrapingError,
} from './schemas.js';
import { LLMFactory } from '../../../config/llm-factory.js';

/**
 * Structured Web Scraping Agent
 *
 * This agent combines traditional web scraping with LLM-powered content understanding
 * to extract structured data from web pages with schema validation.
 */
export class StructuredScrapingAgent {
  private llm: ChatOpenAI;
  private defaultConfig: Partial<ScrapingConfig> = {
    timeout: 30000,
    maxRetries: 3,
    userAgent: 'StructuredScrapingAgent/1.0',
  };

  constructor(llmModel?: ChatOpenAI) {
    this.llm =
      llmModel ||
      LLMFactory.createLLM({
        model: 'openai/gpt-4o-mini',
        temperature: 0.1,
      });
  }

  /**
   * Scrape and structure data from a webpage
   * (LLM usage updated to use OpenAI SDK)
   */
  async scrape(
    url: string,
    customConfig?: Partial<ScrapingConfig>
  ): Promise<ScrapedData> {
    const scrapingConfig = scrapingConfigSchema.parse({
      url,
      ...this.defaultConfig,
      ...customConfig,
    });

    try {
      // Step 1: Fetch the webpage
      const rawHtml = await this.fetchPage(scrapingConfig);
      console.log('raw html: ', rawHtml.slice(0, 500)); // Log first 500 characters of HTML

      // Step 2: Extract basic structure with Cheerio
      const basicData = this.extractBasicData(rawHtml, scrapingConfig.url);

      // Step 3: Use LLM to enhance and structure the content
      const enhancedData = await this.enhanceWithLLM(basicData, rawHtml);

      // Step 4: Validate and return structured data
      return scrapedDataSchema.parse(enhancedData);
    } catch (error) {
      const scrapingError: ScrapingError = {
        type: this.categorizeError(error),
        message: error instanceof Error ? error.message : 'Unknown error',
        url: scrapingConfig.url,
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.stack : error },
      };
      throw scrapingError;
    }
  }

  /**
   * Fetch webpage content
   */
  private async fetchPage(config: ScrapingConfig): Promise<string> {
    const response = await axios.get(config.url, {
      timeout: config.timeout,
      headers: {
        'User-Agent': config.userAgent || this.defaultConfig.userAgent,
        ...config.headers,
      },
      maxRedirects: 5,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: Failed to fetch ${config.url}`);
    }

    return response.data;
  }

  /**
   * Extract basic data using Cheerio
   */
  private extractBasicData(html: string, url: string) {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, .advertisement, .sidebar').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim();
    const description = $('meta[name="description"]').attr('content') || '';

    // Extract headings
    const headings: Array<{ level: number; text: string }> = [];
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $el = $(element);
      const tagName = $el.prop('tagName');
      if (tagName) {
        const level = parseInt(tagName[1]);
        const text = $el.text().trim();
        if (text && !isNaN(level)) {
          headings.push({ level, text });
        }
      }
    });

    // Extract content blocks
    const content: Array<{ type: string; text: string; metadata?: any }> = [];
    $('p, ul, ol, blockquote, pre').each((_, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      if (text) {
        const tagName = $el.prop('tagName');
        if (tagName) {
          const type = this.mapTagToContentType(tagName.toLowerCase());
          content.push({ type, text });
        }
      }
    });

    // Extract links
    const links: Array<{ text: string; url: string; isExternal: boolean }> = [];
    $('a[href]').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();

      if (href && text) {
        const absoluteUrl = new URL(href, url).href;
        const isExternal = !absoluteUrl.startsWith(new URL(url).origin);
        links.push({ text, url: absoluteUrl, isExternal });
      }
    });

    // Extract images
    const images: Array<{ src: string; alt: string; caption?: string }> = [];
    $('img[src]').each((_, element) => {
      const $el = $(element);
      const src = $el.attr('src');
      const alt = $el.attr('alt') || '';

      if (src) {
        const absoluteSrc = new URL(src, url).href;
        const caption =
          $el.closest('figure').find('figcaption').text().trim() || undefined;
        images.push({ src: absoluteSrc, alt, caption });
      }
    });

    // Calculate word count
    const allText = $('body').text();
    const wordCount = allText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    return {
      title,
      description,
      headings,
      content,
      links,
      images,
      rawText: allText,
      wordCount,
      url, // Add the URL
    };
  }

  /**
   * Enhance data using LLM
   */
  private async enhanceWithLLM(
    basicData: any,
    rawHtml: string
  ): Promise<ScrapedData> {
    const systemPrompt = `You are a web content analysis expert. Your task is to analyze the provided web page content and enhance the structured data extraction.

Focus on:
1. Improving content categorization and metadata
2. Detecting language and author information
3. Identifying publication dates
4. Enhancing content organization
5. Providing better descriptions

Return the enhanced data in the exact format specified by the schema.`;

    const humanPrompt = `Please analyze this web page content and enhance the structured data:

Title: ${basicData.title}
Description: ${basicData.description}
Word Count: ${basicData.wordCount}

Content blocks: ${JSON.stringify(basicData.content.slice(0, 5), null, 2)}
Headings: ${JSON.stringify(basicData.headings, null, 2)}

Raw text sample: ${basicData.rawText.substring(0, 1000)}...

Please return enhanced structured data with improved metadata, better content categorization, and any additional insights you can extract.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: humanPrompt },
    ];

    try {
      console.log('LLM messages: ', messages);
      const response = await this.llm.invoke(messages);
      let enhanced: any = {};
      try {
        enhanced = response.content ? JSON.parse(response.content) : {};
      } catch (e) {
        enhanced = {};
      }
      return {
        title: enhanced.title || basicData.title,
        description: enhanced.description || basicData.description || undefined,
        headings: enhanced.headings || basicData.headings,
        content: enhanced.content || basicData.content,
        links: enhanced.links || basicData.links,
        images: enhanced.images || basicData.images,
        metadata: {
          url: basicData.url || '',
          scrapedAt: new Date().toISOString(),
          wordCount: basicData.wordCount,
          language: enhanced.metadata?.language || this.detectLanguage(basicData.rawText),
          author: enhanced.metadata?.author || this.extractAuthor(rawHtml),
          publishedAt: enhanced.metadata?.publishedAt || this.extractPublishDate(rawHtml),
        },
      };
    } catch (error) {
      // Fallback to basic data if LLM enhancement fails
      console.warn('LLM enhancement failed, using basic data:', error);
      return {
        title: basicData.title,
        description: basicData.description || undefined,
        headings: basicData.headings,
        content: basicData.content,
        links: basicData.links,
        images: basicData.images,
        metadata: {
          url: basicData.url || '',
          scrapedAt: new Date().toISOString(),
          wordCount: basicData.wordCount,
        },
      };
    }
  }

  /**
   * Map HTML tags to content types
   */
  private mapTagToContentType(
    tagName: string
  ): 'paragraph' | 'list' | 'code' | 'quote' {
    switch (tagName) {
      case 'ul':
      case 'ol':
        return 'list';
      case 'pre':
      case 'code':
        return 'code';
      case 'blockquote':
        return 'quote';
      default:
        return 'paragraph';
    }
  }

  /**
   * Simple language detection (placeholder)
   */
  private detectLanguage(text: string): string | undefined {
    // Simple heuristic - in a real implementation, use a proper language detection library
    const commonEnglishWords = [
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter((word) =>
      commonEnglishWords.includes(word)
    ).length;

    if (englishWordCount > words.length * 0.05) {
      return 'en';
    }

    return undefined;
  }

  /**
   * Extract author information
   */
  private extractAuthor(html: string): string | undefined {
    const $ = cheerio.load(html);

    // Try various author meta tags
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      'meta[name="twitter:creator"]',
      '.author',
      '.byline',
      '[rel="author"]',
    ];

    for (const selector of authorSelectors) {
      const author = $(selector).attr('content') || $(selector).text().trim();
      if (author) {
        return author;
      }
    }

    return undefined;
  }

  /**
   * Extract publication date
   */
  private extractPublishDate(html: string): string | undefined {
    const $ = cheerio.load(html);

    // Try various date meta tags
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'meta[name="publish_date"]',
      'time[pubdate]',
      'time[datetime]',
    ];

    for (const selector of dateSelectors) {
      const date = $(selector).attr('content') || $(selector).attr('datetime');
      if (date) {
        try {
          return new Date(date).toISOString();
        } catch {
          // Invalid date, continue
        }
      }
    }

    return undefined;
  }

  /**
   * Categorize errors for better error handling
   */
  private categorizeError(error: any): ScrapingError['type'] {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'network';
    }
    if (error.code === 'ETIMEDOUT') {
      return 'timeout';
    }
    if (error instanceof z.ZodError) {
      return 'validation';
    }
    if (error.message?.includes('parse') || error.message?.includes('HTML')) {
      return 'parsing';
    }
    return 'unknown';
  }
}
