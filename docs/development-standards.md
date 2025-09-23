# Development Standards & Best Practices

This document outlines the development standards, coding approach, and critical gotchas for working with LangChain 1.0 agents in this repository.

## Core Principles

### 1. Simplicity Over Complexity

- Use direct LangChain 1.0 APIs (`createAgent`, `tool`) with no custom abstractions
- Each example should be self-contained and copyable
- Avoid unnecessary scaffolding over core LangChain/LangGraph APIs

### 2. Schema-First Development

- Use Zod for runtime validation and type safety
- Define clear input/output schemas for all tools and agents
- Validate data at boundaries (tool inputs, agent outputs)

### 3. Self-Contained Examples

- Each agent example should work independently
- Include all necessary dependencies and configuration
- Provide clear CLI interfaces for testing

## Critical Gotchas & Solutions

### 🚨 LLM Initialization for OpenRouter

**Problem**: LangChain's `initChatModel` doesn't support OpenRouter configuration.

**Solution**: Always pass an explicit LLM instance to `createAgent`:

```typescript
// ✅ Correct: Explicit LLM instance with OpenRouter support
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL, // https://openrouter.ai/api/v1
    apiKey: process.env.OPENAI_API_KEY, // OpenRouter API key
  },
});

const agent = await createAgent({
  llm, // Pass the configured LLM
  tools: [myTool],
  systemPrompt: 'You are a helpful assistant.',
});

// ❌ Incorrect: Using model string (doesn't support OpenRouter)
const agent = await createAgent({
  model: 'gpt-4o-mini', // This won't use OpenRouter
  tools: [myTool],
});
```

### 🚨 Tool Schema Validation

**Problem**: Runtime type errors when tools receive unexpected input.

**Solution**: Use Zod schemas for all tool parameters:

```typescript
// ✅ Correct: Zod schema validation
const myTool = tool(
  async ({ input }) => {
    // Input is type-safe here
    return `Processed: ${input}`;
  },
  {
    name: 'myTool',
    description: 'Process input text',
    schema: z.object({
      input: z.string().describe('Text to process'),
    }),
  }
);

// ❌ Incorrect: No validation
const myTool = tool(
  async (params) => {
    // params could be anything - runtime errors likely
    return `Processed: ${params.input}`;
  },
  {
    name: 'myTool',
    description: 'Process input',
    // No schema - dangerous!
  }
);
```

### 🚨 Error Handling Patterns

**Problem**: Unhandled errors crash the application.

**Solution**: Use proper error categorization and unknown type handling:

```typescript
// ✅ Correct: Proper error handling
try {
  const result = await agent.invoke({ messages });
  return processResult(result);
} catch (error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      throw new TimeoutError(`Request timed out: ${error.message}`);
    }
    if (error.message.includes('network')) {
      throw new NetworkError(`Network issue: ${error.message}`);
    }
  }
  throw new UnknownError(`Unexpected error: ${String(error)}`);
}

// ❌ Incorrect: Assuming error type
try {
  const result = await agent.invoke({ messages });
} catch (error) {
  // error is 'any' - not type safe
  console.log(error.message); // Could crash if error has no message
}
```

### 🚨 Integration Test Timeouts

**Problem**: Integration tests fail due to insufficient timeout for real API calls.

**Solution**: Set appropriate timeouts for real LLM calls:

```typescript
// ✅ Correct: Sufficient timeout for integration tests
describe('Integration Tests', () => {
  it('should scrape webpage with real LLM', async () => {
    const result = await agent.scrape('https://example.com');
    expect(result.title).toBeDefined();
  }, 60000); // 60 second timeout for real API calls
});

// ❌ Incorrect: Default timeout too short
describe('Integration Tests', () => {
  it('should scrape webpage', async () => {
    const result = await agent.scrape('https://example.com');
    // Will likely timeout with default 5s timeout
  });
});
```

## Coding Standards

### File Organization

Keep files focused and under 200 lines:

```
examples/my-agent/
├── src/
│   ├── agent.ts     # Core agent logic (<200 lines)
│   ├── tools.ts     # Tool definitions
│   ├── schemas.ts   # Zod validation schemas
│   └── index.ts     # CLI interface
└── tests/
    ├── agent.test.ts           # Unit tests (mocked)
    └── agent.integration.test.ts # Real API tests
```

### Naming Conventions

- **Classes**: PascalCase (`StructuredScrapingAgent`)
- **Functions**: camelCase (`createWebScrapingTools`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_MODEL`)
- **Types**: PascalCase (`ScrapedData`, `ScrapingConfig`)

### Import Organization

```typescript
// 1. Node.js built-ins
import { readFileSync } from 'fs';

// 2. External libraries
import axios from 'axios';
import { z } from 'zod';

// 3. LangChain imports
import { ChatOpenAI } from '@langchain/openai';
import { createAgent, tool } from 'langchain';

// 4. Local imports
import { scrapedDataSchema } from './schemas.js';
import { createTools } from './tools.js';
```

## Testing Standards

### Unit Tests (Always Run)

- Mock all external dependencies
- Test individual functions and tools
- Fast execution (<30 seconds total)

### Integration Tests (Approval Required)

- Use real APIs with proper timeouts
- Test complete workflows end-to-end
- Require environment variables for API keys

### Test Structure

```typescript
describe('MyAgent', () => {
  describe('unit tests', () => {
    beforeEach(() => {
      // Setup mocks
    });

    it('should handle valid input', () => {
      // Test logic
    });
  });

  describe('integration tests', () => {
    beforeAll(() => {
      if (!process.env.USE_REAL_APIS) {
        console.log('Skipping integration tests (USE_REAL_APIS not set)');
        return;
      }
    });

    it('should work with real APIs', async () => {
      // Real API test
    }, 60000); // Explicit timeout
  });
});
```

## Documentation Standards

### README Structure

- Brief overview and quick start
- Essential examples
- Links to detailed documentation

### Code Comments

- Document complex business logic
- Explain non-obvious design decisions
- Include examples for public APIs

### Type Documentation

```typescript
/**
 * Configuration for web scraping operations
 */
export interface ScrapingConfig {
  /** Maximum time to wait for page load (milliseconds) */
  timeout?: number;
  /** CSS selectors for content extraction */
  selectors?: {
    /** Main content area selector */
    content?: string;
    /** Navigation menu selector */
    navigation?: string;
  };
}
```

## Performance Guidelines

### LLM Call Optimization

- Batch operations when possible
- Use appropriate model sizes (gpt-4o-mini for simple tasks)
- Cache results when appropriate

### Memory Management

- Clean up large objects after use
- Avoid holding references to DOM objects
- Stream large responses when possible

## Security Considerations

### Environment Variables

- Never commit API keys
- Use `.env.example` for documentation
- Validate environment configuration on startup

### Input Validation

- Validate all user inputs with Zod schemas
- Sanitize URLs and file paths
- Escape HTML content when necessary

Following these standards ensures consistent, maintainable, and reliable LangChain 1.0 agent implementations.
