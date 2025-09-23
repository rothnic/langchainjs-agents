// Main entry point for the langchainjs-agents package
// Re-export key utilities for library consumers

// Export main structured scraping agent
export { StructuredScrapingAgent } from '../examples/structured-scraping/src/agent.js';

// Export tool creators
export { createWebScrapingTools } from '../examples/structured-scraping/src/tools.js';

// Export schemas for type definitions
export type {
  ScrapedData,
  ScrapingConfig,
  ScrapingError,
} from '../examples/structured-scraping/src/schemas.js';

// Export configuration utilities
export { env } from '../config/environment.js';

// This package provides working examples and utilities for building LangChain 1.0 agents
