# Getting Started with LangChainJS Agents

This guide will help you get started with building proof-of-concept agents using this repository scaffold.

## Quick Start

### 1. Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd langchainjs-agents

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
nano .env
```

### 2. Create Your First Agent

```bash
# Scaffold a new agent
npm run scaffold -- --name=my-first-agent --type=basic

# Navigate to your agent
cd agents/my-first-agent

# Edit the agent implementation
code src/agent.ts
```

### 3. Test Your Agent

```bash
# Run tests for your agent
npm test agents/my-first-agent

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### 4. Run the Example

```bash
# Try the structured scraping example
npm run dev:example https://example.com

# With JSON output
npm run dev:example https://example.com -- --json
```

## Project Structure

```
langchainjs-agents/
├── agents/                    # Individual agent implementations
│   └── <agent-name>/
│       ├── src/              # Agent source code
│       ├── tests/            # Agent tests
│       └── README.md         # Agent documentation
├── examples/                 # Working examples
│   └── structured-scraping/  # Web scraping example
├── docs/                     # Global documentation
├── mocks/                    # Test utilities and mocks
├── scripts/                  # Build and scaffolding scripts
├── config/                   # Configuration files
└── src/                      # Shared utilities
```

## Agent Types

### Basic Agent

- Simple template for custom logic
- Extends BaseAgent class
- Includes validation and error handling

### Scraping Agent

- Web scraping with LLM enhancement
- Schema-validated output
- Built-in error categorization

### API Agent

- API integration template
- Request/response handling
- Rate limiting and retry logic

## Core Concepts

### BaseAgent Class

All agents extend the `BaseAgent` class which provides:

- **Input validation**: Override `validateInput()` method
- **Error handling**: Automatic error catching and logging
- **Timing**: Execution time tracking
- **Logging**: Consistent logging interface

```typescript
import { BaseAgent } from '../../src/base-agent.js';

export class MyAgent extends BaseAgent {
  constructor() {
    super('my-agent');
  }

  async execute(input: any): Promise<any> {
    // Your implementation here
  }
}
```

### Schema Validation

Use Zod for type-safe input/output validation:

```typescript
import { z } from 'zod';

const inputSchema = z.object({
  url: z.string().url(),
  options: z.object({
    timeout: z.number().default(30000),
  }).optional(),
});

// In your agent
protected validateInput(input: any): void {
  inputSchema.parse(input); // Throws if invalid
}
```

### Testing

The scaffold includes comprehensive testing utilities:

- **Mock adapters**: LLM and HTTP mocking
- **Test fixtures**: Consistent test data
- **Real-run toggle**: Test against real APIs
- **Coverage reporting**: Built-in coverage analysis

```typescript
import { describe, it, expect } from 'vitest';
import { createMockLLM } from '../../../mocks/llm-mocks.js';

describe('MyAgent', () => {
  it('should work correctly', async () => {
    const mockLLM = createMockLLM(['mock response']);
    const agent = new MyAgent(mockLLM);

    const result = await agent.execute(input);
    expect(result).toBeDefined();
  });
});
```

## Environment Configuration

### Required Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Optional Variables

```bash
# LangSmith tracing
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_TRACING_V2=true

# Testing
USE_REAL_APIS=false  # Set to true for integration testing
NODE_ENV=development
```

## Best Practices

### 1. Schema-First Development

- Define input/output schemas before implementation
- Use Zod for runtime validation
- Export types for consumers

### 2. Comprehensive Testing

- Unit tests with mocks
- Integration tests with real APIs
- Error condition testing
- Schema validation testing

### 3. Error Handling

- Categorize errors by type
- Provide meaningful error messages
- Include context in error objects
- Implement graceful fallbacks

### 4. Documentation

- Keep README.md updated
- Document configuration options
- Include usage examples
- Explain error conditions

### 5. Type Safety

- Use TypeScript strictly
- Export all types
- Avoid `any` types
- Use branded types for IDs

## Advanced Topics

### Custom LLM Models

```typescript
import { ChatOpenAI } from '@langchain/openai';

const customLLM = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.1,
  maxTokens: 2000,
  timeout: 30000,
});

const agent = new MyAgent(customLLM);
```

### Record/Replay Testing

For testing against real APIs without making actual calls:

```typescript
// TODO: Implement record/replay functionality
// This would record real API responses for later replay in tests
```

### Agent Composition

Combine multiple agents for complex workflows:

```typescript
class CompositeAgent extends BaseAgent {
  constructor(
    private scraperAgent: StructuredScrapingAgent,
    private analyzerAgent: AnalyzerAgent
  ) {
    super('composite');
  }

  async execute(input: any) {
    const scraped = await this.scraperAgent.execute(input.url);
    const analyzed = await this.analyzerAgent.execute(scraped);
    return { scraped, analyzed };
  }
}
```

## Getting Help

- Check the [examples directory](../examples/) for working code
- Review [test files](../tests/) for usage patterns
- See individual agent READMEs for specific documentation
- Use `npm run scaffold -- --list` to see available agents

## Contributing

When adding new features:

1. Update schemas in `src/schemas.ts`
2. Add implementation in `src/agent.ts`
3. Write comprehensive tests
4. Update documentation
5. Add usage examples
