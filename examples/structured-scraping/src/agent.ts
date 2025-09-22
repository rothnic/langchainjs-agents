import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import {
  scrapedDataSchema,
  type ScrapedData,
  type ScrapingConfig,
  type ScrapingError,
} from './schemas.js';
import { createWebScrapingTools } from './tools.js';

/**
 * Structured Web Scraping Agent using LangChain 1.0
 *
 * This agent demonstrates clean, simple LangChain patterns for web scraping.
 * It uses direct createAgent API with no custom abstractions.
 */
export class StructuredScrapingAgent {
  private llm: ChatOpenAI;

  constructor(llm?: ChatOpenAI) {
    // Support OpenRouter and other providers via configuration
    this.llm =
      llm ||
      new ChatOpenAI({
        model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
        temperature: 0.1,
        configuration: {
          baseURL: process.env.OPENAI_BASE_URL,
          apiKey: process.env.OPENAI_API_KEY,
        },
      });
  }

  /**
   * Scrape a webpage and return structured data
   */
  async scrape(
    url: string,
    config?: Partial<ScrapingConfig>
  ): Promise<ScrapedData> {
    try {
      console.log(`🔍 Starting scraping process for: ${url}`);

      // Create tools for the agent
      const tools = createWebScrapingTools(config);

      // Create the agent with clear instructions
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

Focus on extracting the main content and structure. Be thorough but efficient.`,
      });

      // Use the agent to scrape the page
      console.log(`📝 Sending user prompt to agent...`);
      const result = await agent.invoke({
        messages: [
          {
            role: 'user',
            content: `Please scrape the webpage at ${url} and return the structured data as specified.`,
          },
        ],
      });

      // Extract the content from the agent's response
      const responseContent =
        result.messages[result.messages.length - 1]?.content;

      if (typeof responseContent !== 'string') {
        throw new Error('Agent did not return a text response');
      }

      // Try to extract JSON from the response
      let scrapedData: unknown;
      try {
        // Look for JSON in the response
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          scrapedData = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, try parsing the entire response
          scrapedData = JSON.parse(responseContent);
        }
      } catch (parseError) {
        console.error(
          '❌ Failed to parse JSON from agent response:',
          parseError
        );
        console.log('Raw response:', responseContent);
        throw new Error(
          `Failed to parse structured data from agent response: ${String(parseError)}`
        );
      }

      // Validate the scraped data
      console.log(`✅ Validating scraped data...`);
      const validatedData = scrapedDataSchema.parse(scrapedData);

      console.log(`🎉 Successfully scraped ${url}`);
      console.log(
        `📊 Found ${validatedData.headings.length} headings, ${validatedData.links.length} links, ${validatedData.images.length} images`
      );

      return validatedData;
    } catch (error: unknown) {
      console.error(`❌ Error scraping ${url}:`, error);
      return this.categorizeError(error, url);
    }
  }

  /**
   * Categorize and handle different types of errors
   */
  private categorizeError(error: unknown, url: string): never {
    const baseError: Omit<ScrapingError, 'type'> = {
      message: 'Unknown error occurred',
      url,
      timestamp: new Date().toISOString(),
    };

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        const timeoutError: ScrapingError = {
          ...baseError,
          type: 'timeout',
          message: `Request timeout while scraping ${url}`,
          details: { originalError: error.message },
        };
        throw timeoutError;
      }

      if (
        error.message.includes('Network Error') ||
        error.message.includes('ECONNREFUSED')
      ) {
        const networkError: ScrapingError = {
          ...baseError,
          type: 'network',
          message: `Network error while accessing ${url}`,
          details: { originalError: error.message },
        };
        throw networkError;
      }

      if (error.message.includes('parse') || error.message.includes('JSON')) {
        const parseError: ScrapingError = {
          ...baseError,
          type: 'parsing',
          message: `Failed to parse content from ${url}`,
          details: { originalError: error.message },
        };
        throw parseError;
      }

      if (
        error.message.includes('validation') ||
        error.message.includes('schema')
      ) {
        const validationError: ScrapingError = {
          ...baseError,
          type: 'validation',
          message: `Data validation failed for ${url}`,
          details: { originalError: error.message },
        };
        throw validationError;
      }
    }

    // Default to unknown error
    const unknownError: ScrapingError = {
      ...baseError,
      type: 'unknown',
      message: `Unknown error while scraping ${url}: ${String(error)}`,
      details: { originalError: String(error) },
    };
    throw unknownError;
  }
}
