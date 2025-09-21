# LangChainJS Agents

A comprehensive TypeScript repository scaffold for building proof-of-concept agents with LangChainJS. This repository provides a structured foundation for rapid agent development with built-in testing, CLI tools, and working examples.

## 🚀 Features

- **🏗️ Clear Structure**: Organized directories for agents, examples, documentation, and testing
- **⚡ Working Example**: Structured web scraping agent with schema-validated output
- **🧪 Comprehensive Testing**: Vitest setup with mocks, fixtures, and real-run toggle
- **🛠️ CLI Tools**: Templates and scaffolding for new agents and tests
- **🔄 CI/CD Ready**: GitHub Actions for typecheck, lint, tests, and sample runs
- **📚 Rich Documentation**: Guides, patterns, and examples for rapid development
- **🎯 TypeScript-First**: Full type safety with strict TypeScript configuration

## 📁 Project Structure

```
langchainjs-agents/
├── 📁 agents/                    # Agent implementations
│   └── <agent-name>/            # Individual agent directory
│       ├── src/                 # Agent source code
│       ├── tests/               # Agent-specific tests
│       └── README.md            # Agent documentation
├── 🌟 examples/                 # Working examples
│   └── structured-scraping/     # Web scraping with LLM enhancement
├── 📖 docs/                     # Global documentation
│   ├── getting-started.md       # Setup and usage guide
│   └── testing-guide.md         # Testing patterns and strategies
├── 🎭 mocks/                    # Test utilities and mocks
│   ├── llm-mocks.ts            # LLM and HTTP mocking
│   └── test-fixtures.ts         # Test data factories
├── 🔧 scripts/                  # Build and scaffolding tools
│   └── scaffold-agent.js        # CLI for creating new agents
├── ⚙️ config/                   # Configuration files
│   └── environment.ts           # Environment and validation
└── 📦 src/                      # Shared utilities
    ├── base-agent.ts            # Base agent class
    └── index.ts                 # Main exports
```

## 🚀 Quick Start

### 1. Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Verify setup
npm run typecheck
npm run lint
npm test
```

### 2. Try the Example

```bash
# Run the structured scraping example
npm run dev:example https://example.com

# With JSON output
npm run dev:example https://example.com -- --json
```

### 3. Create Your First Agent

```bash
# Scaffold a new agent
npm run scaffold -- --name=my-agent --type=basic

# View available agents
npm run scaffold -- --list

# Test your agent
npm test agents/my-agent
```

## 🌟 Examples

### Structured Web Scraping

The included example demonstrates a complete agent that:

- Fetches web pages with configurable options
- Extracts structured data using Cheerio
- Enhances content analysis with LLM
- Validates output with Zod schemas
- Handles errors gracefully

```typescript
import { StructuredScrapingAgent } from './examples/structured-scraping/src/agent.js';

const agent = new StructuredScrapingAgent();
const result = await agent.scrape('https://example.com');

console.log('Title:', result.title);
console.log('Word count:', result.metadata.wordCount);
console.log(
  'Headings:',
  result.headings.map((h) => h.text)
);
```

## 🧪 Testing Philosophy

The repository emphasizes comprehensive testing with:

- **Mock-first approach**: Fast, reliable tests with mocked dependencies
- **Real-run toggle**: Environment variable to test against actual APIs
- **Test fixtures**: Consistent, reusable test data
- **Error simulation**: Comprehensive error condition testing
- **Schema validation**: Ensures type safety and data integrity

```typescript
import { describe, it, expect } from 'vitest';
import { createMockLLM } from '../../../mocks/llm-mocks.js';

describe('MyAgent', () => {
  it('should process input correctly', async () => {
    const mockLLM = createMockLLM(['Expected response']);
    const agent = new MyAgent(mockLLM);

    const result = await agent.execute(input);
    expect(result).toBeDefined();
  });
});
```

## 🛠️ Agent Types

### Basic Agent

Simple template extending BaseAgent with validation and error handling.

```bash
npm run scaffold -- --name=data-processor --type=basic
```

### Scraping Agent

Web scraping template with LLM enhancement and schema validation.

```bash
npm run scaffold -- --name=web-crawler --type=scraping
```

### API Agent

API integration template with request/response handling and retry logic.

```bash
npm run scaffold -- --name=api-client --type=api
```

## 📋 Available Scripts

### Development

```bash
npm run dev              # Build in watch mode
npm run build            # Production build
npm run clean            # Clean build artifacts
```

### Testing

```bash
npm test                 # Run all tests
npm run test:unit        # Fast unit tests only
npm run test:integration # Integration tests with real APIs
npm run test:watch       # Watch mode
npm run test:ui          # Visual test UI
npm run test:run         # Single run with coverage
```

**Testing Strategy:**

- **Unit tests**: Run on every commit (fast, mocked)
- **Integration tests**: Require approval, use GitHub Models
- **Real web pages**: Built-in test server for scraping validation

### Code Quality

```bash
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code
npm run format:check     # Check formatting
npm run typecheck        # Type checking
```

### Agent Management

```bash
npm run scaffold         # Create new agent (interactive)
npm run dev:example      # Run scraping example
```

## ⚙️ Configuration

### Environment Variables

```bash
# LLM Provider (Recommended: GitHub Models)
LLM_PROVIDER=github-models
GITHUB_TOKEN=your_github_token_here

# Alternative: OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here

# Optional
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_TRACING_V2=true
USE_REAL_APIS=false      # Toggle for testing
NODE_ENV=development
```

**Why GitHub Models?**

- ✅ **Free**: No costs for Pro account holders
- ✅ **Integrated**: Automatic access in CI/CD
- ✅ **Compatible**: OpenAI-compatible API
- ✅ **No secrets**: Uses existing GitHub token

### TypeScript Configuration

The project uses strict TypeScript settings with:

- ES2022 target and modules
- Path mapping for clean imports
- Strict type checking
- Declaration generation

## 🏗️ Architecture

### BaseAgent Class

All agents extend `BaseAgent` which provides:

- Input validation framework
- Error handling and categorization
- Execution timing
- Consistent logging interface

```typescript
export class MyAgent extends BaseAgent {
  constructor() {
    super('my-agent');
  }

  async execute(input: any): Promise<any> {
    // Implementation here
  }

  protected validateInput(input: any): void {
    // Validation logic
  }
}
```

### Schema-First Development

Using Zod for runtime validation:

```typescript
import { z } from 'zod';

export const inputSchema = z.object({
  url: z.string().url(),
  options: z
    .object({
      timeout: z.number().default(30000),
    })
    .optional(),
});

export const outputSchema = z.object({
  result: z.string(),
  metadata: z.object({
    processedAt: z.string().datetime(),
  }),
});
```

## 🚦 CI/CD

GitHub Actions workflow includes:

- **Type checking** with TypeScript
- **Linting** with ESLint and Prettier
- **Testing** across Node.js versions
- **Build verification**
- **Integration tests** (when API keys available)
- **Sample agent runs** to verify functionality

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-agent`
3. **Add your agent**: Use `npm run scaffold` to create the structure
4. **Write comprehensive tests**: Follow the testing guide
5. **Update documentation**: Add examples and usage patterns
6. **Submit a pull request**: Include description of your agent's purpose

### Development Guidelines

- Follow the existing code style
- Write tests for all new functionality
- Update documentation for new features
- Use semantic commit messages
- Ensure CI passes before submitting PR

## 📚 Documentation

- [Getting Started Guide](./docs/getting-started.md) - Setup and basic usage
- [Testing Guide](./docs/testing-guide.md) - Testing patterns and strategies
- [Structured Scraping Example](./examples/structured-scraping/README.md) - Complete example walkthrough

## 🔧 Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Testing**: Vitest with coverage
- **Validation**: Zod schemas
- **HTTP**: Axios
- **Scraping**: Cheerio
- **AI**: LangChain + OpenAI
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Getting Help

- **Check the [examples](./examples/)** for working implementations
- **Review [documentation](./docs/)** for guides and patterns
- **Look at [test files](./tests/)** for usage examples
- **Use `npm run scaffold -- --list`** to see available templates
- **Open an issue** for bugs or feature requests

---

**Happy agent building! 🤖✨**
