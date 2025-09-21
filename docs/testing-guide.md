# Testing Guide

This guide covers testing strategies and patterns for LangChainJS agents.

## Overview

The repository provides a comprehensive testing framework with:

- **Vitest**: Fast, modern test runner with great TypeScript support
- **Mock adapters**: LLM and HTTP request mocking
- **Test fixtures**: Consistent test data generation
- **Real-run toggle**: Switch between mocked and real API calls
- **Coverage reporting**: Built-in code coverage analysis

## Test Structure

### File Organization

```
agents/my-agent/
├── src/
│   └── agent.ts
└── tests/
    ├── agent.test.ts        # Main test file
    ├── integration.test.ts  # Integration tests
    └── fixtures/            # Test-specific fixtures
        └── sample-data.ts
```

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyAgent } from '../src/agent.js';
import { createMockLLM } from '../../../mocks/llm-mocks.js';

describe('MyAgent', () => {
  let agent: MyAgent;

  beforeEach(() => {
    agent = new MyAgent();
  });

  describe('constructor', () => {
    it('should initialize correctly', () => {
      expect(agent).toBeInstanceOf(MyAgent);
      expect(agent.getName()).toBe('my-agent');
    });
  });

  describe('execute', () => {
    it('should process valid input', async () => {
      const input = {
        /* test input */
      };
      const result = await agent.execute(input);

      expect(result).toBeDefined();
      // Add specific assertions
    });

    it('should validate input', async () => {
      const invalidInput = null;

      await expect(agent.execute(invalidInput)).rejects.toThrow(
        'Input validation failed'
      );
    });
  });
});
```

## Mocking Strategies

### LLM Mocking

```typescript
import { createMockLLM } from '../../../mocks/llm-mocks.js';

// Basic mock with single response
const mockLLM = createMockLLM(['Single response']);

// Mock with multiple responses (cycles through them)
const mockLLM = createMockLLM([
  'First response',
  'Second response',
  'Third response',
]);

// Use in agent
const agent = new MyAgent(mockLLM);
```

### HTTP Mocking

```typescript
import { setupHttpMocks } from '../../../mocks/llm-mocks.js';
import { vi } from 'vitest';

// Mock axios
vi.mock('axios');

beforeEach(() => {
  const mockAxios = setupHttpMocks();

  // Custom mock for specific URL
  mockAxios.mockImplementation((config) => {
    if (config.url === 'https://special-api.com') {
      return Promise.resolve({
        status: 200,
        data: { custom: 'response' },
      });
    }

    // Fall back to default mocks
    return Promise.reject(new Error(`No mock for ${config.url}`));
  });
});
```

### Custom Mocks

```typescript
// Mock a specific service
vi.mock('../src/external-service.js', () => ({
  ExternalService: vi.fn().mockImplementation(() => ({
    fetch: vi.fn().mockResolvedValue({ data: 'mocked' }),
    process: vi.fn().mockResolvedValue({ result: 'processed' }),
  })),
}));
```

## Test Data Management

### Using Test Fixtures

```typescript
import { TestDataFactory } from '../../../mocks/test-fixtures.js';

describe('MyAgent', () => {
  it('should handle webpage content', async () => {
    const testContent = TestDataFactory.createWebPageContent({
      title: 'Custom Test Title',
      url: 'https://test.example.com',
    });

    const result = await agent.execute(testContent);
    expect(result.title).toBe('Custom Test Title');
  });
});
```

### Custom Fixtures

```typescript
// agents/my-agent/tests/fixtures/sample-data.ts
export const sampleApiResponse = {
  success: true,
  data: {
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ],
  },
  meta: {
    total: 2,
    page: 1,
  },
};

export const sampleErrorResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input parameters',
  },
};
```

## Error Testing

### Testing Error Conditions

```typescript
describe('error handling', () => {
  it('should handle network errors', async () => {
    mockAxios.mockRejectedValueOnce(new Error('Network error'));

    await expect(agent.execute(input)).rejects.toMatchObject({
      type: 'network',
      message: expect.stringContaining('Network error'),
    });
  });

  it('should handle timeout errors', async () => {
    const timeoutError = new Error('Timeout');
    timeoutError.code = 'ETIMEDOUT';
    mockAxios.mockRejectedValueOnce(timeoutError);

    await expect(agent.execute(input)).rejects.toMatchObject({
      type: 'timeout',
    });
  });

  it('should handle validation errors', async () => {
    const invalidInput = {
      /* invalid data */
    };

    await expect(agent.execute(invalidInput)).rejects.toThrow('validation');
  });
});
```

### Error Categorization Testing

```typescript
it('should categorize errors correctly', async () => {
  const testCases = [
    { error: { code: 'ENOTFOUND' }, expectedType: 'network' },
    { error: { code: 'ETIMEDOUT' }, expectedType: 'timeout' },
    { error: new ZodError([]), expectedType: 'validation' },
  ];

  for (const { error, expectedType } of testCases) {
    mockService.mockRejectedValueOnce(error);

    try {
      await agent.execute(input);
    } catch (caught) {
      expect(caught.type).toBe(expectedType);
    }
  }
});
```

## Schema Validation Testing

### Input Validation

```typescript
import { z } from 'zod';

describe('input validation', () => {
  const validInput = {
    url: 'https://example.com',
    options: { timeout: 5000 },
  };

  it('should accept valid input', async () => {
    await expect(agent.execute(validInput)).resolves.toBeDefined();
  });

  it('should reject invalid URL', async () => {
    const invalidInput = { ...validInput, url: 'not-a-url' };

    await expect(agent.execute(invalidInput)).rejects.toThrow('Invalid URL');
  });

  it('should use default values', async () => {
    const minimalInput = { url: 'https://example.com' };

    const result = await agent.execute(minimalInput);
    // Assert that defaults were applied
  });
});
```

### Output Validation

```typescript
import { myOutputSchema } from '../src/schemas.js';

describe('output validation', () => {
  it('should return valid schema', async () => {
    const result = await agent.execute(validInput);

    // Should not throw
    expect(() => myOutputSchema.parse(result)).not.toThrow();
  });

  it('should include required fields', async () => {
    const result = await agent.execute(validInput);

    expect(result).toMatchObject({
      status: expect.any(String),
      data: expect.any(Object),
      timestamp: expect.any(String),
    });
  });
});
```

## Integration Testing

### Real API Testing

```typescript
import { config } from '../../../config/environment.js';

describe('integration tests', () => {
  // Only run if USE_REAL_APIS is true
  const itif = config.useRealApis ? it : it.skip;

  itif(
    'should work with real OpenAI API',
    async () => {
      const agent = new MyAgent(); // Uses real LLM
      const result = await agent.execute(realInput);

      expect(result).toBeDefined();
      // Add assertions for real API behavior
    },
    30000
  ); // Longer timeout for real APIs
});
```

### End-to-End Testing

```typescript
describe('end-to-end', () => {
  it('should complete full workflow', async () => {
    const agent = new MyAgent();

    const step1 = await agent.execute(input1);
    const step2 = await agent.execute(step1);
    const final = await agent.execute(step2);

    expect(final).toMatchObject({
      // Expected final state
    });
  });
});
```

## Performance Testing

### Execution Time

```typescript
describe('performance', () => {
  it('should complete within time limit', async () => {
    const startTime = Date.now();

    await agent.execute(input);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 5 seconds
  });

  it('should track execution time', async () => {
    await agent.run(input); // Use .run() to get timing

    const executionTime = agent.getExecutionTime();
    expect(executionTime).toBeGreaterThan(0);
  });
});
```

### Memory Usage

```typescript
it('should not leak memory', async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  // Run agent multiple times
  for (let i = 0; i < 100; i++) {
    await agent.execute(input);
  }

  // Force garbage collection if available
  if (global.gc) global.gc();

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;

  // Memory should not increase significantly
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## Test Commands

### Running Tests

```bash
# Run all tests
npm test

# Run specific agent tests
npm test agents/my-agent

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

### Environment Variables for Testing

```bash
# Use real APIs in tests
USE_REAL_APIS=true npm test

# Run only integration tests
npm test -- --grep="integration"

# Run with verbose output
npm test -- --reporter=verbose
```

## Best Practices

### 1. Test Organization

- Group related tests with `describe`
- Use descriptive test names
- Test one thing per test case
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Management

- Reset mocks between tests
- Use specific mocks for specific scenarios
- Don't over-mock - test the real logic

### 3. Test Data

- Use factories for consistent data
- Keep test data minimal but realistic
- Avoid hardcoded values in assertions

### 4. Error Testing

- Test all error paths
- Verify error messages and types
- Test error recovery mechanisms

### 5. Performance

- Set appropriate timeouts
- Monitor memory usage
- Test with realistic data sizes

### 6. Coverage

- Aim for high test coverage
- Focus on critical paths
- Don't chase 100% coverage at expense of quality

## Common Patterns

### Setup and Teardown

```typescript
describe('MyAgent', () => {
  let agent: MyAgent;
  let mockLLM: any;

  beforeEach(() => {
    mockLLM = createMockLLM(['response']);
    agent = new MyAgent(mockLLM);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
```

### Parameterized Tests

```typescript
describe('input validation', () => {
  const testCases = [
    { input: null, expectedError: 'Input required' },
    { input: '', expectedError: 'Input must not be empty' },
    { input: {}, expectedError: 'Missing required fields' },
  ];

  testCases.forEach(({ input, expectedError }) => {
    it(\`should reject \${JSON.stringify(input)}\`, async () => {
      await expect(agent.execute(input))
        .rejects.toThrow(expectedError);
    });
  });
});
```

### Async Testing

```typescript
describe('async operations', () => {
  it('should handle concurrent requests', async () => {
    const promises = Array(5)
      .fill(null)
      .map(() => agent.execute(input));

    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach((result) => {
      expect(result).toBeDefined();
    });
  });
});
```
