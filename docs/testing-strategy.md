# Testing Strategy and Contribution Guide

This document outlines the testing approach for the LangChainJS Agents repository and provides guidelines for contributors.

## Testing Strategy Overview

We use a **two-tier testing strategy** that balances development speed with real-world validation:

### 1. Unit Tests (Fast, Always Run)

- **Purpose**: Validate core logic and edge cases with mocked dependencies
- **Frequency**: Run on every commit and PR
- **Speed**: < 30 seconds for full suite
- **Coverage**: Business logic, error handling, data transformation

### 2. Integration Tests (Slower, Approval Required)

- **Purpose**: Validate real API interactions and end-to-end workflows
- **Frequency**: Run on main branch merges or with explicit approval
- **Speed**: 2-5 minutes depending on API response times
- **Coverage**: Real LLM interactions, network requests, full agent workflows

## LLM Provider Strategy

### GitHub Models (Recommended)

We use **GitHub Models** as the primary LLM provider for testing because:

- ✅ **Free**: No ongoing costs for Pro account holders
- ✅ **Integrated**: Automatic access in GitHub Actions via `GITHUB_TOKEN`
- ✅ **Compatible**: OpenAI-compatible API, seamless with LangChain.js
- ✅ **Rate Limits**: Built-in protection against excessive usage
- ✅ **No Secrets**: No need to manage separate API keys

#### Configuration

```typescript
// Automatic selection based on environment
const llm = LLMFactory.createTestLLM(); // Uses GitHub Models by default

// Explicit GitHub Models usage
const llm = LLMFactory.createLLM({
  provider: 'github-models',
  model: 'gpt-4o-mini',
  temperature: 0.1,
});
```

#### Environment Variables

```bash
# For GitHub Models (recommended)
LLM_PROVIDER=github-models
GITHUB_TOKEN=your_github_token_here

# For OpenAI (fallback)
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
```

### Fallback to OpenAI

OpenAI is available as a fallback option for:

- Local development when GitHub token is not available
- Specific model requirements not available in GitHub Models
- Legacy compatibility

## Test Organization

### File Structure

```
project/
├── examples/structured-scraping/
│   ├── src/agent.ts
│   └── tests/
│       ├── agent.test.ts           # Unit tests (mocked)
│       └── agent.integration.test.ts # Integration tests (real APIs)
├── tests/
│   ├── fixtures/web-pages/         # Static HTML test pages
│   ├── test-web-server.ts         # Test server utility
│   └── setup.ts                   # Global test configuration
└── mocks/
    ├── llm-mocks.ts               # LLM mocking utilities
    └── test-fixtures.ts           # Test data factories
```

### Test Categories

#### Unit Tests (`*.test.ts`)

```typescript
describe('StructuredScrapingAgent - Unit Tests', () => {
  // Mock all external dependencies
  beforeEach(() => {
    vi.mock('axios');
    mockLLM = createMockLLM(['Mock response']);
  });

  it('should extract headings correctly', async () => {
    // Test with mocked HTML content
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: '<h1>Test</h1>',
    });

    const result = await agent.scrape('https://test.com');
    expect(result.headings[0].text).toBe('Test');
  });
});
```

#### Integration Tests (`*.integration.test.ts`)

```typescript
describe('StructuredScrapingAgent - Integration Tests', () => {
  let testServer: TestWebServer;

  beforeAll(async () => {
    testServer = await getTestServer();
    // Use real LLM (GitHub Models)
    agent = new StructuredScrapingAgent(LLMFactory.createTestLLM());
  });

  it('should scrape real content with LLM enhancement', async () => {
    const url = testServer.getPageUrl('blog-post');
    const result = await agent.scrape(url);

    // Validate real LLM enhanced the content
    expect(result.metadata.language).toBeDefined();
  });
});
```

## Running Tests

### Development Workflow

```bash
# Fast unit tests (always run these first)
npm run test:unit

# Watch mode for active development
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint:fix
```

### Integration Testing

```bash
# Manual integration tests (requires GitHub token)
GITHUB_TOKEN=your_token npm run test:integration

# Alternative with explicit API usage
USE_REAL_APIS=true npm run test:integration:manual
```

### CI/CD Workflow

1. **Every Commit**: Unit tests, type checking, linting
2. **PR Review**: Manual integration test approval via label `test:integration`
3. **Main Branch**: Automatic integration tests with GitHub Models

## Test Web Pages

We provide realistic test web pages to validate scraping functionality:

### Available Test Pages

1. **Simple Page** (`/simple`): Basic HTML structure
2. **Blog Post** (`/blog-post`): Article with metadata, headings, content types
3. **E-commerce** (`/ecommerce`): Product catalog with structured data
4. **Special Pages**:
   - `/delay` - Simulates slow responses
   - `/error` - Returns 500 error for error handling tests

### Usage

```typescript
import { getTestServer } from '../../../tests/test-web-server.js';

const testServer = await getTestServer();
const url = testServer.getPageUrl('blog-post');
const result = await agent.scrape(url);
```

## Contributing Guidelines

### Before Making Changes

1. **Understand the codebase**: Review existing agents and tests
2. **Check the testing strategy**: Decide if you need unit tests, integration tests, or both
3. **Set up your environment**: Ensure you have a GitHub token for integration testing

### Development Process

1. **Write unit tests first**: Start with mocked tests for your core logic
2. **Implement the feature**: Focus on the business logic
3. **Add integration tests**: Validate real-world scenarios
4. **Test locally**: Ensure all tests pass before committing

```bash
# Full local testing workflow
npm run typecheck  # Ensure TypeScript is valid
npm run lint:fix   # Fix linting issues
npm run test:unit  # Validate core logic
npm run build      # Ensure project builds
npm run test:integration  # Test with real APIs (requires token)
```

### Pull Request Process

1. **Submit PR**: Include unit tests with your changes
2. **Code Review**: Maintainers review code and unit tests
3. **Integration Approval**: Add `test:integration` label for real API testing
4. **Merge**: After all tests pass and review is complete

### Writing New Agents

Use the scaffolding tool to maintain consistency:

```bash
# Create a new agent with proper structure
npm run scaffold -- --name=my-new-agent --type=basic

# Implement your agent logic
cd agents/my-new-agent
# Edit src/agent.ts

# Add comprehensive tests
# Edit tests/agent.test.ts (unit tests)
# Create tests/agent.integration.test.ts (integration tests)

# Test your implementation
npm run test:unit agents/my-new-agent
npm run test:integration agents/my-new-agent
```

## Best Practices

### Test Organization

- **Separate unit and integration tests**: Different files, different purposes
- **Use descriptive test names**: Clearly state what's being tested
- **Group related tests**: Use `describe` blocks for logical organization
- **Mock external dependencies**: Keep unit tests fast and reliable

### LLM Testing

- **Use consistent models**: Stick to `gpt-4o-mini` for cost-effective testing
- **Set low temperature**: Use `temperature: 0.1` for deterministic responses
- **Test LLM failures**: Ensure graceful degradation when LLM calls fail
- **Validate schema compliance**: Always check that LLM-enhanced data meets schemas

### Error Handling

- **Test all error types**: Network, timeout, parsing, validation errors
- **Use realistic error scenarios**: Test with actual HTTP error codes
- **Validate error categorization**: Ensure errors are properly classified

### Performance

- **Set reasonable timeouts**: Don't let tests hang indefinitely
- **Test concurrent operations**: Validate rate limiting and parallel processing
- **Monitor test execution time**: Keep integration tests under 5 minutes

## Rate Limiting and Costs

### GitHub Models Limits

- **Free tier**: Generous limits for testing and development
- **Automatic throttling**: Built-in protection against excessive usage
- **No surprise costs**: Free for Pro account holders

### Best Practices

- **Use minimal test cases**: Don't over-test with real APIs
- **Batch integration tests**: Run them less frequently than unit tests
- **Monitor usage**: Be aware of API call patterns in tests
- **Cache when possible**: Reuse test server responses

## Troubleshooting

### Common Issues

#### GitHub Models Authentication

```bash
# Ensure your GitHub token has models:read permission
# In GitHub Actions, this is automatic
export GITHUB_TOKEN=your_personal_access_token
```

#### Test Server Port Conflicts

```bash
# The test server automatically finds available ports
# If issues persist, check for hanging processes:
lsof -i :3000
```

#### Integration Test Timeouts

```bash
# Increase timeout for slower networks
npm run test:integration -- --timeout=60000
```

### Getting Help

1. **Check the logs**: Integration tests provide detailed error information
2. **Review test fixtures**: Ensure test pages match your expectations
3. **Validate environment**: Confirm GitHub token and environment variables
4. **Run tests individually**: Isolate problematic tests for debugging

## Future Enhancements

- **Record/Replay**: Capture real API responses for consistent testing
- **Parallel Testing**: Optimize test execution for faster feedback
- **Custom Test Pages**: Generate test content dynamically
- **Performance Benchmarks**: Track agent performance over time
- **Cross-Model Testing**: Validate agents work with different LLM providers

---

This testing strategy ensures rapid development while maintaining confidence in real-world performance. The combination of GitHub Models and comprehensive test infrastructure provides a robust foundation for building reliable LangChainJS agents.
