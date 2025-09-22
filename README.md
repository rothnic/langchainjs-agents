# LangChainJS Agents

A comprehensive collection of proof-of-concept examples for building reliable, type-safe AI agents with LangChain.js 1.0's tool-based patterns and comprehensive testing infrastructure.

## 🚀 Overview

This repository provides a scaffold for developing AI agents using LangChain.js 1.0. It demonstrates modern agent patterns including:

- **Tool-Based Agents**: Agents that use specialized tools to interact with content iteratively
- **Type Safety**: Full TypeScript support with Zod schema validation
- **Comprehensive Testing**: Unit and integration tests with mocking capabilities
- **Multiple LLM Providers**: Support for OpenAI and OpenRouter
- **Production Ready**: Built-in error handling, logging, and deployment patterns

## 📁 Project Structure

```
├── src/                    # Core agent framework
│   ├── base-agent.ts      # Base agent class with common functionality
│   └── index.ts           # Main exports
├── examples/              # Agent examples and implementations
│   └── structured-scraping/  # Web scraping agent example
├── docs/                  # Documentation and guides
│   ├── getting-started.md          # Quick start guide
│   ├── langchainjs-1.0-comprehensive-guide.md
│   ├── langchainjs-1.0-migration.md
│   └── langchainjs-1.0-structured-extraction.md
├── tests/                 # Testing infrastructure
├── mocks/                 # Mock utilities for testing
├── config/                # Environment and LLM configuration
└── scripts/               # Development utilities
```

## 📚 Documentation

- **[Getting Started](docs/getting-started.md)**: Complete guide to building tool-based agents with code examples
- **[LangChain.js 1.0 Guide](docs/langchainjs-1.0-comprehensive-guide.md)**: Comprehensive examples and patterns
- **[Migration Guide](docs/langchainjs-1.0-migration.md)**: Migrating from LangChain.js 0.x
- **[Structured Extraction](docs/langchainjs-1.0-structured-extraction.md)**: Advanced data extraction patterns
- **[AGENTS.md](AGENTS.md)**: Minimal examples for building LangChain.js 1.0 agents

## 🛠️ Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
git clone <repository-url>
cd langchainjs-agents
npm install
```

### Environment Setup

Create a `.env` file with your API keys:

```bash
# For OpenRouter (recommended)
OPENAI_API_KEY=your_openrouter_api_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1

# For direct OpenAI
OPENAI_API_KEY=your_openai_api_key
```

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests (requires real APIs)
npm run test:integration
```

### Build and Development

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Lint and format code
npm run lint
npm run format
```

## 🤖 Agent Examples

### Structured Web Scraping Agent

The included example demonstrates a tool-based agent that can extract structured data from web pages. See the [Getting Started guide](docs/getting-started.md) for detailed code examples and implementation.

### Base Agent Framework

The repository includes a `BaseAgent` class providing common functionality for building custom agents. See the [Getting Started guide](docs/getting-started.md) for usage examples.

## 🧪 Testing

Comprehensive testing infrastructure with mocks and fixtures. See the [Getting Started guide](docs/getting-started.md) for testing examples and patterns.

## 🔧 Configuration

Flexible configuration for different environments and LLM providers. See the [Getting Started guide](docs/getting-started.md) for configuration examples.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.