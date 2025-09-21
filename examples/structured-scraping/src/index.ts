#!/usr/bin/env node

import { StructuredScrapingAgent } from './agent.js';
import { config } from '../../../config/environment.js';

/**
 * Example usage of the Structured Scraping Agent
 */
async function main() {
  const url = process.argv[2] || 'https://example.com';

  console.log('🚀 Starting Structured Web Scraping Agent...');
  console.log(`📄 Target URL: ${url}`);
  console.log(
    `🔧 Environment: ${config.isDevelopment ? 'Development' : config.isProduction ? 'Production' : 'Test'}`
  );
  console.log(`🤖 Using real APIs: ${config.useRealApis}`);
  console.log('---');

  try {
    const agent = new StructuredScrapingAgent();

    console.log('⏳ Scraping and structuring content...');
    const startTime = Date.now();

    const result = await agent.scrape(url, {
      timeout: 15000,
      userAgent: 'LangChainJS-StructuredScraper/1.0',
    });

    const duration = Date.now() - startTime;

    console.log('✅ Scraping completed successfully!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('---');

    // Display structured results
    console.log('📊 STRUCTURED RESULTS:');
    console.log('');

    console.log(`📋 Title: ${result.title}`);
    if (result.description) {
      console.log(`📝 Description: ${result.description}`);
    }
    console.log(`🔤 Word Count: ${result.metadata.wordCount}`);
    if (result.metadata.language) {
      console.log(`🌐 Language: ${result.metadata.language}`);
    }
    if (result.metadata.author) {
      console.log(`👤 Author: ${result.metadata.author}`);
    }
    console.log('');

    if (result.headings.length > 0) {
      console.log('📑 HEADINGS:');
      result.headings.forEach((heading, index) => {
        console.log(`  ${'#'.repeat(heading.level)} ${heading.text}`);
      });
      console.log('');
    }

    if (result.content.length > 0) {
      console.log('📄 CONTENT BLOCKS:');
      result.content.slice(0, 3).forEach((block, index) => {
        console.log(
          `  ${index + 1}. [${block.type.toUpperCase()}] ${block.text.substring(0, 100)}${block.text.length > 100 ? '...' : ''}`
        );
      });
      if (result.content.length > 3) {
        console.log(`  ... and ${result.content.length - 3} more blocks`);
      }
      console.log('');
    }

    if (result.links.length > 0) {
      console.log('🔗 LINKS:');
      result.links.slice(0, 5).forEach((link, index) => {
        const external = link.isExternal ? ' (external)' : '';
        console.log(`  ${index + 1}. ${link.text} → ${link.url}${external}`);
      });
      if (result.links.length > 5) {
        console.log(`  ... and ${result.links.length - 5} more links`);
      }
      console.log('');
    }

    if (result.images.length > 0) {
      console.log('🖼️  IMAGES:');
      result.images.slice(0, 3).forEach((image, index) => {
        console.log(
          `  ${index + 1}. ${image.alt || 'No alt text'} → ${image.src}`
        );
        if (image.caption) {
          console.log(`     Caption: ${image.caption}`);
        }
      });
      if (result.images.length > 3) {
        console.log(`  ... and ${result.images.length - 3} more images`);
      }
      console.log('');
    }

    console.log('📋 METADATA:');
    console.log(`  🌐 URL: ${result.metadata.url}`);
    console.log(
      `  📅 Scraped: ${new Date(result.metadata.scrapedAt).toLocaleString()}`
    );
    if (result.metadata.publishedAt) {
      console.log(
        `  📰 Published: ${new Date(result.metadata.publishedAt).toLocaleString()}`
      );
    }

    // Option to output JSON
    if (process.argv.includes('--json')) {
      console.log('');
      console.log('📄 JSON OUTPUT:');
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Scraping failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
