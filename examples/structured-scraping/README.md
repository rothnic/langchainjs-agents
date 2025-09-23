# Structured Web Scraping Agent

A powerful LangChainJS agent that combines traditional web scraping with LLM-powered content understanding to extract structured data from web pages with schema validation.

## Features

- **Schema-validated output**: Uses Zod schemas to ensure consistent, type-safe data extraction
- **LLM-enhanced analysis**: Combines Cheerio-based scraping with OpenAI's language models for intelligent content understanding
- **Robust error handling**: Comprehensive error categorization and graceful fallbacks
- **Configurable scraping**: Custom timeouts, headers, user agents, and content selectors
- **Rich metadata extraction**: Automatically detects language, author, publication dates, and more
- **TypeScript-first**: Full type safety throughout the scraping pipeline

## Quick Start

### Basic Usage

```typescript
import { StructuredScrapingAgent } from './src/agent.js';

const agent = new StructuredScrapingAgent();

// Scrape a webpage
const result = await agent.scrape('https://example.com');

console.log('Title:', result.title);
console.log('Word count:', result.metadata.wordCount);
console.log(
  'Headings:',
  result.headings.map((h) => h.text)
);
```

### CLI Usage

```bash
# Basic scraping
npm run dev:example https://example.com

# Output as JSON
npm run dev:example https://example.com -- --json

# Using the scaffold command
npm run scaffold -- --type=scraping --name=my-scraper
```

### Custom Configuration

```typescript
const result = await agent.scrape('https://example.com', {
  timeout: 15000,
  userAgent: 'MyBot/1.0',
  headers: {
    Authorization: 'Bearer token',
    'Custom-Header': 'value',
  },
  selectors: {
    ignore: ['.advertisement', '.sidebar'],
    focus: ['.main-content', 'article'],
  },
});
```

## Output Schema

The agent returns structured data conforming to this schema:

```typescript
interface ScrapedData {
  title: string;
  description?: string;
  headings: Array<{
    level: number; // 1-6
    text: string;
  }>;
  content: Array<{
    type: 'paragraph' | 'list' | 'code' | 'quote';
    text: string;
    metadata?: Record<string, any>;
  }>;
  links: Array<{
    text: string;
    url: string;
    isExternal: boolean;
  }>;
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  metadata: {
    url: string;
    scrapedAt: string; // ISO datetime
    wordCount: number;
    language?: string;
    author?: string;
    publishedAt?: string; // ISO datetime
  };
}
```

## How It Works

1. **HTTP Fetch**: Uses Axios to fetch the webpage with configurable options
2. **Basic Extraction**: Cheerio parses HTML and extracts basic structure (headings, paragraphs, links, images)
3. **LLM Enhancement**: OpenAI analyzes content for better categorization and metadata extraction
4. **Schema Validation**: Zod ensures the output matches the expected structure
5. **Error Handling**: Comprehensive error categorization for robust operation

## Testing

The agent includes comprehensive test coverage with mocked dependencies:

```bash
# Run tests
npm test examples/structured-scraping

# Run tests with coverage
npm run test:coverage examples/structured-scraping

# Run tests in watch mode
npm run test:watch examples/structured-scraping
```

### Test Features

- **Mock adapters**: HTTP requests and LLM calls are mocked for consistent testing
- **Error simulation**: Tests various error conditions (network, timeout, parsing)
- **Schema validation**: Ensures output always conforms to expected structure
- **Real-run toggle**: Environment variable to test against real APIs when needed

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_TRACING_V2=true
USE_REAL_APIS=false  # Set to true for integration testing
```

### Custom LLM Model

```typescript
import { ChatOpenAI } from '@langchain/openai';

const customLLM = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0,
  maxTokens: 2000,
});

const agent = new StructuredScrapingAgent(customLLM);
```

## Error Handling

The agent categorizes errors for better debugging:

- **network**: Connection issues, DNS resolution failures
- **timeout**: Request timeouts
- **parsing**: HTML parsing errors
- **validation**: Schema validation failures
- **unknown**: Uncategorized errors

Each error includes:

- `type`: Error category
- `message`: Human-readable description
- `url`: The URL being scraped
- `timestamp`: When the error occurred
- `details`: Additional error context

## Best Practices

1. **Rate Limiting**: Implement delays between requests for bulk scraping
2. **Respect robots.txt**: Check site policies before scraping
3. **Error Handling**: Always wrap scraping calls in try-catch blocks
4. **Schema Evolution**: Update schemas carefully to maintain backward compatibility
5. **Testing**: Use mocks for unit tests, real APIs for integration tests

## Examples

See the `/examples/structured-scraping/src/index.ts` file for a complete CLI example with formatted output.

## Contributing

When adding new features to the scraping agent:

1. Update the schema in `schemas.ts`
2. Add corresponding extraction logic in `agent.ts`
3. Write comprehensive tests in `tests/`
4. Update this README with new features

## License

MIT License - see the main repository LICENSE file.
