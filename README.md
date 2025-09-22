# LangChain.js 1.0 Agents

A clean, simple repository for rapid development of LangChain.js 1.0 agents with practical examples and comprehensive documentation.

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/rothnic/langchainjs-agents
cd langchainjs-agents
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your OpenRouter API key

# 3. Try the working example
npm run dev:example https://example.com
```

## Core Examples

### Web Scraping Agent

Clean, self-contained example using LangChain 1.0 patterns:

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { createWebScrapingTools } from './tools.js';

// Configure LLM for OpenRouter (or other providers)
const llm = new ChatOpenAI({
  model: 'openai/gpt-4o-mini',
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL, // https://openrouter.ai/api/v1
    apiKey: process.env.OPENAI_API_KEY, // Your OpenRouter key
  },
});

// Create agent with tools
const agent = await createAgent({
  llm,
  tools: createWebScrapingTools(),
  systemPrompt:
    'You are a web scraping assistant that extracts structured data.',
});

// Use the agent
const result = await agent.invoke({
  messages: [
    {
      role: 'user',
      content: 'Scrape https://example.com and return structured data',
    },
  ],
});
```

## Key Features

- **🎯 Simple & Direct**: No abstractions over LangChain 1.0 APIs
- **📦 Self-Contained**: Each example works independently
- **🔧 OpenRouter Ready**: Cost-effective LLM access out of the box
- **✅ Type Safe**: Full TypeScript with Zod validation
- **🧪 Well Tested**: Unit tests (mocked) + integration tests (real APIs)

## Project Structure

```
langchainjs-agents/
├── examples/
│   └── structured-scraping/     # Working web scraping agent
│       ├── src/
│       │   ├── agent.ts         # Core agent logic
│       │   ├── tools.ts         # Tool definitions
│       │   ├── schemas.ts       # Zod validation
│       │   └── index.ts         # CLI interface
│       └── tests/               # Unit & integration tests
├── docs/                        # Focused documentation
│   ├── development-standards.md # Coding approach & gotchas
│   ├── openrouter-setup.md     # LLM configuration guide
│   └── testing-guide.md        # Testing patterns
└── mocks/                       # Test utilities
```

## Available Commands

```bash
# Development
npm run dev:example <url>        # Try web scraping example
npm run typecheck               # TypeScript validation
npm run lint                    # Code quality checks
npm run format                  # Apply code formatting

# Testing
npm run test:unit              # Fast tests with mocks
npm run test:integration       # Real API tests (requires setup)
npm run test                   # All tests
```

## Environment Configuration

The repository supports multiple LLM providers:

### OpenRouter (Recommended)

```bash
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-openrouter-key
DEFAULT_MODEL=openai/gpt-4o-mini
```

### GitHub Models (Free for Pro users)

```bash
OPENAI_BASE_URL=https://models.inference.ai.azure.com
GITHUB_TOKEN=your-github-token
DEFAULT_MODEL=gpt-4o-mini
```

### Direct OpenAI

```bash
OPENAI_API_KEY=sk-your-openai-key
DEFAULT_MODEL=gpt-4o-mini
```

## Critical Development Gotchas

### ⚠️ LLM Initialization for OpenRouter

Must pass explicit LLM instance to `createAgent`:

```typescript
// ✅ Correct
const llm = new ChatOpenAI({
  model: 'openai/gpt-4o-mini',
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  },
});

const agent = await createAgent({ llm, tools });

// ❌ Wrong - won't use OpenRouter
const agent = await createAgent({
  model: 'gpt-4o-mini', // String model doesn't support custom endpoints
  tools,
});
```

### ⚠️ Integration Test Timeouts

Real API calls need sufficient time:

```typescript
it('should scrape webpage', async () => {
  const result = await agent.scrape('https://example.com');
  expect(result.title).toBeDefined();
}, 60000); // 60 second timeout for real LLM calls
```

## Documentation

- **[Development Standards](./docs/development-standards.md)** - Coding approach, gotchas, and best practices
- **[OpenRouter Setup](./docs/openrouter-setup.md)** - LLM provider configuration
- **[Testing Guide](./docs/testing-guide.md)** - Unit and integration testing patterns
- **[Project Structure](./docs/project-structure.md)** - File organization principles

## Contributing

1. **Read [Development Standards](./docs/development-standards.md)** for coding guidelines
2. **Run validation before committing**:
   ```bash
   npm run typecheck && npm run lint && npm run test:unit && npm run build
   ```
3. **Keep examples simple** - No abstractions over LangChain APIs
4. **Make it self-contained** - Each example should work independently

## Examples in Action

### Web Scraping with Validation

```typescript
import { StructuredScrapingAgent } from './examples/structured-scraping/src/agent.js';

const agent = new StructuredScrapingAgent();
const data = await agent.scrape('https://blog.example.com');

console.log(`Title: ${data.title}`);
console.log(`Headings: ${data.headings.length}`);
console.log(`Word count: ${data.metadata.wordCount}`);
```

### Custom Tool Creation

```typescript
import { tool } from 'langchain';
import { z } from 'zod';

const customTool = tool(async ({ input }) => `Processed: ${input}`, {
  name: 'processTool',
  description: 'Process text input',
  schema: z.object({
    input: z.string().describe('Text to process'),
  }),
});
```

## Why This Approach?

- **No Complex Abstractions**: Direct use of LangChain 1.0 APIs
- **Self-Contained Examples**: Copy and modify for your needs
- **Clear Patterns**: Established best practices for common tasks
- **Cost Effective**: OpenRouter integration for affordable LLM access
- **Production Ready**: Type safety, error handling, comprehensive testing

Start building your LangChain.js agents with clean, simple patterns that scale!
