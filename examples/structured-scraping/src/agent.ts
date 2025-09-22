import axios from 'axios';
import * as cheerio from 'cheerio';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { tool, initChatModel, createAgent } from 'langchain';
import {
  scrapedDataSchema,
  scrapingConfigSchema,
  type ScrapedData,
  type ScrapingConfig,
  type ScrapingError,
} from './schemas.js';
import { MODEL_PROVIDER_CONFIG } from 'langchain/dist/chat_models/universal.js';

/**
 * Web Scraping Tools for Agent-Based C      // Use the agent to scrape the page
      console.log(`📝 Sending user prompt to agent...`);
      const result = await agent.invoke({
        messages: [{
          role: 'user',
          conten    // Create the agent
      // Create tools for the agent      // Create tools for the agent
        // Create tools for the agent
    const tools = createWebScrapingTools(scrapingConfig);

    // Create the agent
    const agent = await createAgent({
      llm: this.llm,
      tools,
      prompt: `You are a web scraping agent. Your task is to extract structured data from a webpage at ${url}.

INSTRUCTIONS:
1. First, use loadPage to load the webpage
2. Use getPageOutline to understand the page structure
3. Based on the outline, identify the main content areas and headings
4. Use extractSectionContent to extract content from relevant sections (like 'main', 'article', '.content', etc.)
5. Use extractMetadata, extractHeadings, extractLinks, extractImages as needed
6. Return the complete structured data as a JSON object with this exact structure:
{
  "title": "string",
  "description": "string or null",
  "content": [{"type": "paragraph", "text": "string"}],
  "headings": [{"level": number, "text": "string"}],
  "links": [{"text": "string", "url": "string", "isExternal": boolean}],
  "images": [{"src": "string", "alt": "string", "caption": "string or null"}],
  "metadata": {
    "url": "string",
    "scrapedAt": "ISO date string",
    "wordCount": number
  }
}

Be efficient - don't extract everything, focus on the main content.`
    });

    // Run the agent
    console.log(`🤖 Running agent...`);
    const agentStartTime = Date.now();
    const result = await agent.invoke({
      messages: [{
        role: 'user',
        content: `Scrape the webpage at ${url} and extract the structured data.`
      }]
    });
    const agentTime = Date.now() - agentStartTime;
    console.log(`✅ Agent completed in ${agentTime}ms`);eateWebScrapingTools(scrapingConfig);

    // Create the agent
    const agent = await createAgent({
      llm: this.llm,
      tools,
      prompt: `You are a web scraping agent. Your task is to extract structured data from a webpage at ${url}.

INSTRUCTIONS:
1. First, use loadPage to load the webpage
2. Use getPageOutline to understand the page structure
3. Based on the outline, identify the main content areas and headings
4. Use extractSectionContent to extract content from relevant sections (like 'main', 'article', '.content', etc.)
5. Use extractMetadata, extractHeadings, extractLinks, extractImages as needed
6. Return the complete structured data as a JSON object with this exact structure:
{
  "title": "string",
  "description": "string or null",
  "content": [{"type": "paragraph", "text": "string"}],
  "headings": [{"level": number, "text": "string"}],
  "links": [{"text": "string", "url": "string", "isExternal": boolean}],
  "images": [{"src": "string", "alt": "string", "caption": "string or null"}],
  "metadata": {
    "url": "string",
    "scrapedAt": "ISO date string",
    "wordCount": number
  }
}

Be efficient - don't extract everything, focus on the main content.`
    });

    // Run the agent
    console.log(`🤖 Running agent...`);
    const agentStartTime = Date.now();
    const result = await agent.invoke({
      messages: [{
        role: 'user',
        content: `Scrape the webpage at ${url} and extract the structured data.`
      }]
    });
    const agentTime = Date.now() - agentStartTime;
    console.log(`✅ Agent completed in ${agentTime}ms`);nt
    console.log(`🤖 Running agent...`);
    const agentStartTime = Date.now();
    const result = await agent.invoke({
      messages: [{
        role: 'user',
        content: `Scrape the webpage at ${url} and extract the structured data.`
      }]
    });
    const agentTime = Date.now() - agentStartTime;
    console.log(`✅ Agent completed in ${agentTime}ms`);ls = createWebScrapingTools(scrapingConfig);

    // Create the agent
    const agent = await createAgent({
      llm: this.llm,
      tools,
      prompt: `You are a web scraping agent. Your task is to extract structured data from a webpage at ${url}.

INSTRUCTIONS:
1. First, use loadPage to load the webpage
2. Use getPageOutline to understand the page structure
3. Based on the outline, identify the main content areas and headings
4. Use extractSectionContent to extract content from relevant sections (like 'main', 'article', '.content', etc.)
5. Use extractMetadata, extractHeadings, extractLinks, extractImages as needed
6. Return the complete structured data as a JSON object with this exact structure:
{
  "title": "string",
  "description": "string or null",
  "content": [{"type": "paragraph", "text": "string"}],
  "headings": [{"level": number, "text": "string"}],
  "links": [{"text": "string", "url": "string", "isExternal": boolean}],
  "images": [{"src": "string", "alt": "string", "caption": "string or null"}],
  "metadata": {
    "url": "string",
    "scrapedAt": "ISO date string",
    "wordCount": number
  }
}

Be efficient - don't extract everything, focus on the main content.`
    });gent = await createAgent({
      llm: this.llm,
      tools,
      prompt: `You are a web scraping agent. Your task is to extract structured data from a webpage at ${url}.

INSTRUCTIONS:
1. First, use loadPage to load the webpage
2. Use getPageOutline to understand the page structure
3. Based on the outline, identify the main content areas and headings
4. Use extractSectionContent to extract content from relevant sections (like 'main', 'article', '.content', etc.)
5. Use extractMetadata, extractHeadings, extractLinks, extractImages as needed
6. Return the complete structured data as a JSON object with this exact structure:
{
  "title": "string",
  "description": "string or null",
  "content": [{"type": "paragraph", "text": "string"}],
  "headings": [{"level": number, "text": "string"}],
  "links": [{"text": "string", "url": "string", "isExternal": boolean}],
  "images": [{"src": "string", "alt": "string", "caption": "string or null"}],
  "metadata": {
    "url": "string",
    "scrapedAt": "ISO date string",
    "wordCount": number
  }
}

Be efficient - don't extract everything, focus on the main content.`
    });ape the webpage at ${url} and return structured data.

INSTRUCTIONS:
1. First, use loadPage to get the HTML content
2. Then use extractAllData to get everything efficiently in one call
3. Return the complete structured data

Use the extractAllData tool for efficiency - it extracts metadata, headings, content, links, and images all at once.`
        }],
      });on
 */
export class WebScrapingTools {
  private config: ScrapingConfig;

  constructor(config: ScrapingConfig) {
    this.config = config;
  }

  /**
   * Tool: Load a webpage and return its content
   */
  async loadPage(url: string): Promise<{ html: string; title: string; status: number }> {
    const response = await axios.get(url, {
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent || 'WebScrapingAgent/1.0',
        ...this.config.headers,
      },
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';

    return {
      html: response.data,
      title,
      status: response.status,
    };
  }

  /**
   * Tool: Get a high-level outline of the page structure
   */
  getPageOutline(html: string, url: string): {
    title: string;
    headings: Array<{ level: number; text: string; id?: string }>;
    mainContentAreas: Array<{ selector: string; description: string; estimatedWords: number }>;
    links: { internal: number; external: number };
    images: number;
    forms: number;
    totalWordCount: number;
  } {
    const $ = cheerio.load(html);

    // Get basic metadata
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';

    // Get heading structure
    const headings: Array<{ level: number; text: string; id?: string }> = [];
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $el = $(element);
      const tagName = $el.prop('tagName');
      if (tagName) {
        const level = parseInt(tagName[1]);
        const text = $el.text().trim();
        const id = $el.attr('id');
        if (text && !isNaN(level)) {
          headings.push({ level, text, id });
        }
      }
    });

    // Identify main content areas
    const contentSelectors = [
      { selector: 'main', description: 'Main content area' },
      { selector: 'article', description: 'Article content' },
      { selector: '.content', description: 'Content section' },
      { selector: '#content', description: 'Content container' },
      { selector: '.post', description: 'Blog post' },
      { selector: '.entry', description: 'Entry content' },
    ];

    const mainContentAreas: Array<{ selector: string; description: string; estimatedWords: number }> = [];

    for (const { selector, description } of contentSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        const totalWords = elements.map((_, el) => $(el).text().split(/\s+/).length).get().reduce((a, b) => a + b, 0);
        mainContentAreas.push({
          selector,
          description,
          estimatedWords: totalWords,
        });
      }
    }

    // Count links
    const allLinks = $('a[href]').length;
    const externalLinks = $('a[href]').filter((_, el) => {
      const href = $(el).attr('href');
      if (!href) return false;
      try {
        const absoluteUrl = new URL(href, url).href;
        return !absoluteUrl.startsWith(new URL(url).origin);
      } catch {
        return false;
      }
    }).length;

    // Count other elements
    const images = $('img[src]').length;
    const forms = $('form').length;

    // Total word count
    const totalWordCount = $('body').text().split(/\s+/).filter(word => word.length > 0).length;

    return {
      title,
      headings,
      mainContentAreas,
      links: { internal: allLinks - externalLinks, external: externalLinks },
      images,
      forms,
      totalWordCount,
    };
  }

  /**
   * Tool: Extract content from multiple selectors
   */
  extractContent(html: string, selectors: string[]): Array<{ content: string; selector: string }> {
    const $ = cheerio.load(html);
    const results: Array<{ content: string; selector: string }> = [];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_, element) => {
          const text = $(element).text().trim();
          if (text) {
            results.push({ content: text, selector });
          }
        });
      }
    }

    return results;
  }
  extractSectionContent(html: string, selector: string): {
    content: Array<{ type: 'text' | 'link' | 'image'; text?: string; url?: string; alt?: string }>;
    wordCount: number;
  } {
    const $ = cheerio.load(html);
    const $section = $(selector);
    const content: Array<{ type: 'text' | 'link' | 'image'; text?: string; url?: string; alt?: string }> = [];

    // Extract text content from paragraphs and headings
    $section.find('p, h1, h2, h3, h4, h5, h6, li, blockquote').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text) {
        const tagName = $el.prop('tagName')?.toLowerCase();
        let type: 'text' = 'text';
        if (tagName === 'li') type = 'text'; // Could be 'list' but keeping simple
        if (tagName === 'blockquote') type = 'text'; // Could be 'quote'
        content.push({ type, text });
      }
    });

    // Extract links
    $section.find('a[href]').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      const href = $el.attr('href');
      if (text && href) {
        content.push({ type: 'link', text, url: href });
      }
    });

    // Extract images
    $section.find('img[src]').each((_, el) => {
      const $el = $(el);
      const src = $el.attr('src');
      const alt = $el.attr('alt') || '';
      if (src) {
        content.push({ type: 'image', url: src, alt });
      }
    });

    const wordCount = content.filter(item => item.type === 'text').reduce((count, item) => count + (item.text?.split(/\s+/)?.length || 0), 0);

    return { content, wordCount };
  }

  /**
   * Tool: Get detailed information about links in a section
   */
  extractSectionLinks(html: string, selector: string, baseUrl: string): Array<{
    text: string;
    url: string;
    isExternal: boolean;
    context?: string;
  }> {
    const $ = cheerio.load(html);
    const $section = $(selector);
    const links: Array<{
      text: string;
      url: string;
      isExternal: boolean;
      context?: string;
    }> = [];

    $section.find('a[href]').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();

      if (href && text) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          const isExternal = !absoluteUrl.startsWith(new URL(baseUrl).origin);

          // Get some context around the link
          const context = $el.parent().text().trim().substring(0, 100);

          links.push({
            text,
            url: absoluteUrl,
            isExternal,
            context,
          });
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    return links;
  }

  /**
   * Tool: Find and extract links from the page
   */
  extractLinks(html: string, baseUrl: string): Array<{ text: string; url: string; isExternal: boolean }> {
    const $ = cheerio.load(html);
    const links: Array<{ text: string; url: string; isExternal: boolean }> = [];

    $('a[href]').each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();

      if (href && text) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          const isExternal = !absoluteUrl.startsWith(new URL(baseUrl).origin);
          links.push({ text, url: absoluteUrl, isExternal });
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    return links;
  }

  /**
   * Tool: Extract headings and their hierarchy
   */
  extractHeadings(html: string): Array<{ level: number; text: string; id?: string }> {
    const $ = cheerio.load(html);
    const headings: Array<{ level: number; text: string; id?: string }> = [];

    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $el = $(element);
      const tagName = $el.prop('tagName');
      if (tagName) {
        const level = parseInt(tagName[1]);
        const text = $el.text().trim();
        const id = $el.attr('id');

        if (text && !isNaN(level)) {
          headings.push({ level, text, id });
        }
      }
    });

    return headings;
  }

  /**
   * Tool: Extract images with metadata
   */
  extractImages(html: string, baseUrl: string): Array<{ src: string; alt: string; caption?: string }> {
    const $ = cheerio.load(html);
    const images: Array<{ src: string; alt: string; caption?: string }> = [];

    $('img[src]').each((_, element) => {
      const $el = $(element);
      const src = $el.attr('src');
      const alt = $el.attr('alt') || '';

      if (src) {
        try {
          const absoluteSrc = new URL(src, baseUrl).href;
          const caption = $el.closest('figure').find('figcaption').text().trim() || undefined;
          images.push({ src: absoluteSrc, alt, caption });
        } catch (error) {
          // Skip invalid image URLs
        }
      }
    });

    return images;
  }

  /**
   * Tool: Get page metadata
   */
  extractMetadata(html: string, url: string): {
    title: string;
    description?: string;
    language?: string;
    author?: string;
    publishedAt?: string;
    wordCount: number;
  } {
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content');

    const language = $('html').attr('lang') ||
                     $('meta[http-equiv="content-language"]').attr('content');

    const author = $('meta[name="author"]').attr('content') ||
                   $('meta[property="article:author"]').attr('content');

    const publishedAt = $('meta[property="article:published_time"]').attr('content') ||
                       $('time[datetime]').attr('datetime');

    // Calculate word count
    const allText = $('body').text();
    const wordCount = allText.split(/\s+/).filter(word => word.length > 0).length;

    return {
      title,
      description,
      language,
      author,
      publishedAt,
      wordCount,
    };
  }

  /**
   * Tool: Check if content is likely to be paginated or very long
   */
  analyzeContentLength(html: string): {
    isLongContent: boolean;
    estimatedWordCount: number;
    hasPagination: boolean;
    recommendedChunkSize: number;
  } {
    const $ = cheerio.load(html);
    const bodyText = $('body').text();
    const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;

    // Check for pagination indicators
    const paginationSelectors = [
      '.pagination', '.pager', '[class*="pagination"]',
      '.page-navigation', '.page-numbers',
      'a[href*="page="]', 'a[href*="?p="]'
    ];

    let hasPagination = false;
    for (const selector of paginationSelectors) {
      if ($(selector).length > 0) {
        hasPagination = true;
        break;
      }
    }

    const isLongContent = wordCount > 2000 || hasPagination;
    const recommendedChunkSize = isLongContent ? 1000 : wordCount;

    return {
      isLongContent,
      estimatedWordCount: wordCount,
      hasPagination,
      recommendedChunkSize,
    };
  }
}

/**
 * Create LangChain tools from WebScrapingTools methods
 */
function createWebScrapingTools(config: ScrapingConfig) {
  const scrapingTools = new WebScrapingTools(config);

  const loadPageTool = tool(
    async ({ url }: { url: string }) => {
      const result = await scrapingTools.loadPage(url);
      return JSON.stringify(result);
    },
    {
      name: 'loadPage',
      description: 'Load a webpage and return its HTML content, title, and status',
      schema: z.object({
        url: z.string().url().describe('The URL of the webpage to load'),
      }),
    }
  );

  const extractMetadataTool = tool(
    async ({ html, url }: { html: string; url: string }) => {
      const result = scrapingTools.extractMetadata(html, url);
      return JSON.stringify(result);
    },
    {
      name: 'extractMetadata',
      description: 'Extract metadata from HTML content including title, description, author, etc.',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
        url: z.string().url().describe('The base URL for relative links'),
      }),
    }
  );

  const extractHeadingsTool = tool(
    async ({ html }: { html: string }) => {
      const result = scrapingTools.extractHeadings(html);
      return JSON.stringify(result);
    },
    {
      name: 'extractHeadings',
      description: 'Extract all headings (h1-h6) from HTML content with their hierarchy',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
      }),
    }
  );

  const getPageOutlineTool = tool(
    async ({ html, url }: { html: string; url: string }) => {
      const result = scrapingTools.getPageOutline(html, url);
      return JSON.stringify(result);
    },
    {
      name: 'getPageOutline',
      description: 'Get a high-level outline and structure of the webpage',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
        url: z.string().url().describe('The base URL of the page'),
      }),
    }
  );

  const extractSectionContentTool = tool(
    async ({ html, selector }: { html: string; selector: string }) => {
      const result = scrapingTools.extractSectionContent(html, selector);
      return JSON.stringify(result);
    },
    {
      name: 'extractSectionContent',
      description: 'Extract content from a specific section of the HTML',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
        selector: z.string().describe('CSS selector for the section to extract'),
      }),
    }
  );

  const extractSectionLinksTool = tool(
    async ({ html, selector, baseUrl }: { html: string; selector: string; baseUrl: string }) => {
      const result = scrapingTools.extractSectionLinks(html, selector, baseUrl);
      return JSON.stringify(result);
    },
    {
      name: 'extractSectionLinks',
      description: 'Extract links from a specific section of the HTML',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
        selector: z.string().describe('CSS selector for the section to extract links from'),
        baseUrl: z.string().url().describe('The base URL for resolving relative links'),
      }),
    }
  );

  const extractLinksTool = tool(
    async ({ html, baseUrl }: { html: string; baseUrl: string }) => {
      const result = scrapingTools.extractLinks(html, baseUrl);
      return JSON.stringify(result);
    },
    {
      name: 'extractLinks',
      description: 'Extract all links from HTML content with their text and external status',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
        baseUrl: z.string().url().describe('The base URL for resolving relative links'),
      }),
    }
  );

  const extractImagesTool = tool(
    async ({ html, baseUrl }: { html: string; baseUrl: string }) => {
      const result = scrapingTools.extractImages(html, baseUrl);
      return JSON.stringify(result);
    },
    {
      name: 'extractImages',
      description: 'Extract all images from HTML content with metadata',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
        baseUrl: z.string().url().describe('The base URL for resolving relative image sources'),
      }),
    }
  );

  const analyzeContentLengthTool = tool(
    async ({ html }: { html: string }) => {
      const result = scrapingTools.analyzeContentLength(html);
      return JSON.stringify(result);
    },
    {
      name: 'analyzeContentLength',
      description: 'Analyze HTML content to determine if it is long or has pagination',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
      }),
    }
  );

  const extractAllDataTool = tool(
    async ({ html, url }: { html: string; url: string }) => {
      console.log(`🔄 Extracting all data from ${url}...`);
      const startTime = Date.now();

      const [metadata, headings, content, links, images] = await Promise.all([
        scrapingTools.extractMetadata(html, url),
        scrapingTools.extractHeadings(html),
        scrapingTools.extractContent(html, ['p', 'article', 'main', '.content', '#content']),
        scrapingTools.extractLinks(html, url),
        scrapingTools.extractImages(html, url),
      ]);

      const executionTime = Date.now() - startTime;
      console.log(`✅ All data extracted in ${executionTime}ms`);

      const result = {
        metadata,
        headings,
        content: content.map((item: { content: string; selector: string }) => ({ type: 'text', text: item.content })),
        links,
        images,
      };

      return JSON.stringify(result);
    },
    {
      name: 'extractAllData',
      description: 'Extract all structured data from HTML in one efficient operation',
      schema: z.object({
        html: z.string().describe('The HTML content to analyze'),
        url: z.string().url().describe('The base URL for resolving relative links'),
      }),
    }
  );

  return [
    loadPageTool,
    getPageOutlineTool,
    extractSectionContentTool,
    extractSectionLinksTool,
    extractMetadataTool,
    extractHeadingsTool,
    extractLinksTool,
    extractImagesTool,
    analyzeContentLengthTool,
    extractAllDataTool,
  ];
}

/**
 * Tool-Based Web Scraping Agent - LangChain 1.0 Implementation
 *
 * This agent uses tools to interact with web content iteratively, allowing it to:
 * - Navigate pages like a human would
 * - Extract content in chunks for long pages
 * - Make decisions about what content to focus on
 * - Handle dynamic content and pagination
 *
 * LangChain 1.0 Features Used:
 * - Tool-based agents for complex interactions
 * - Structured output for reliable data extraction
 * - Zod schema validation
 * - Modern error handling patterns
 */
export class StructuredScrapingAgent {
  private llm: ChatOpenAI;
  private defaultConfig: Partial<ScrapingConfig> = {
    timeout: 30000,
    maxRetries: 3,
    userAgent: 'StructuredScrapingAgent/1.0',
  };

  constructor(llmModel?: ChatOpenAI) {
    if (!llmModel) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is required');
      }
      llmModel = new ChatOpenAI({
        model: process.env.DEFAULT_MODEL || 'gpt-3.5-turbo',
        temperature: 0.1,
        apiKey,
        configuration: {
          baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com',
          defaultHeaders: { 'User-Agent': 'langchainjs-agents/tool-based' },
        },
      });
    }
    this.llm = llmModel;
  }

  /**
   * Scrape and structure data from a webpage using agent-based approach
   * Agent loads page, gets outline, then extracts content from relevant sections
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

    console.log(`🚀 Starting agent-based scraping for: ${url}`);
    const startTime = Date.now();

    // Create tools for the agent
    const tools = createWebScrapingTools(scrapingConfig);

    // Create the agent
    const agent = await createAgent({
      llm: this.llm,
      tools,
      prompt: `You are a web scraping agent. Your task is to extract structured data from a webpage at ${url}.

INSTRUCTIONS:
1. First, use loadPage to load the webpage
2. Use getPageOutline to understand the page structure
3. Based on the outline, identify the main content areas and headings
4. Use extractSectionContent to extract content from relevant sections (like 'main', 'article', '.content', etc.)
5. Use extractMetadata, extractHeadings, extractLinks, extractImages as needed
6. Return the complete structured data as a JSON object with this exact structure:
{
  "title": "string",
  "description": "string or null",
  "content": [{"type": "paragraph", "text": "string"}],
  "headings": [{"level": number, "text": "string"}],
  "links": [{"text": "string", "url": "string", "isExternal": boolean}],
  "images": [{"src": "string", "alt": "string", "caption": "string or null"}],
  "metadata": {
    "url": "string",
    "scrapedAt": "ISO date string",
    "wordCount": number
  }
}

Be efficient - don't extract everything, focus on the main content.`
    });

    // Run the agent
    console.log(`🤖 Running agent...`);
    const agentStartTime = Date.now();
    const result = await agent.invoke({
      messages: [{
        role: 'user',
        content: `Scrape the webpage at ${url} and extract the structured data.`
      }]
    });
    const agentTime = Date.now() - agentStartTime;
    console.log(`✅ Agent completed in ${agentTime}ms`);

    // Parse the result
    let parsedResult: ScrapedData;
    try {
      // Get the last message content
      const messages = result.messages || [];
      const lastMessage = messages[messages.length - 1];
      const rawOutput = lastMessage?.content || '';
      // Extract JSON from the output
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in agent output');
      }
      parsedResult = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse agent output:', result);
      throw new Error(`Agent returned invalid JSON: ${error}`);
    }

    // Validate the result
    const validation = scrapedDataSchema.safeParse(parsedResult);
    if (!validation.success) {
      console.error('Agent output validation failed:', validation.error);
      throw new Error(`Agent output does not match expected schema: ${validation.error}`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎯 Agent-based scraping completed successfully in ${totalTime}ms`);
    return parsedResult;
  }

  /**
   * Categorize errors for better error handling
   */
  private categorizeError(error: any): ScrapingError['type'] {
    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'network';
    }
    // Timeout errors (Node.js, axios)
    if (
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNABORTED' ||
      error.message?.toLowerCase().includes('timeout') ||
      error.message?.toLowerCase().includes('timed out')
    ) {
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