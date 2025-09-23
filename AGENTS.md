# Building LangChain.js 1.0 Agents

This guide provides minimal, non-class based examples for building LangChain.js 1.0 agents. These examples focus on the core patterns and can be easily adapted for your use cases.

## Prerequisites

```bash
npm install langchain @langchain/openai zod
```

## Environment Setup

Create a `.env` file for OpenRouter (recommended for better model access):

```bash
OPENAI_API_KEY=your_openrouter_api_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

## Core Agent Pattern

The fundamental pattern for LangChain.js 1.0 agents:

```typescript
import { createAgent, tool } from 'langchain';
import { z } from 'zod';

// 1. Define tools
const myTool = tool(
  async ({ input }) => {
    // Tool implementation
    return `Processed: ${input}`;
  },
  {
    name: 'myTool',
    description: 'Description of what the tool does',
    schema: z.object({
      input: z.string().describe('Input parameter description'),
    }),
  }
);

// 2. Create agent
const agent = await createAgent({
  model: 'openai:gpt-4o-mini', // Works with OpenRouter
  tools: [myTool],
  systemPrompt: 'You are a helpful assistant that uses tools to solve tasks.',
});

// 3. Use agent
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Use the tool to process: hello world' }],
});

console.log(result.messages[result.messages.length - 1].content);
```

## Agent with OpenRouter LLM Instance

For more control over LLM configuration, create an agent by passing an LLM instance:

```typescript
import { createAgent, tool } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Configure LLM for OpenRouter
const llm = new ChatOpenAI({
  model: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
  temperature: 0.1,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
    defaultHeaders: { 'User-Agent': 'langchainjs-agents/tool-based' },
  },
});

// Define tools
const calculateSum = tool(
  async ({ a, b }) => {
    const result = a + b;
    return `The sum of ${a} and ${b} is ${result}`;
  },
  {
    name: 'calculateSum',
    description: 'Add two numbers together',
    schema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
  }
);

// Create agent with LLM instance
const agent = await createAgent({
  llm, // Pass the configured LLM instance
  tools: [calculateSum],
  systemPrompt: 'You are a helpful assistant that uses tools to solve tasks.',
});

// Use agent
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Calculate 15 + 27' }],
});

console.log(result.messages[result.messages.length - 1].content);
```

## Tool Creation Patterns

### Simple Function Tool

```typescript
import { tool } from 'langchain';
import { z } from 'zod';

const calculateSum = tool(
  async ({ a, b }) => {
    const result = a + b;
    return `The sum of ${a} and ${b} is ${result}`;
  },
  {
    name: 'calculateSum',
    description: 'Add two numbers together',
    schema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
  }
);
```

### API Calling Tool

```typescript
import { tool } from 'langchain';
import { z } from 'zod';

const getWeather = tool(
  async ({ city }) => {
    // Replace with actual API call
    const response = await fetch(`https://api.weather.com/${city}`);
    const data = await response.json();
    return `Weather in ${city}: ${data.temperature}°C, ${data.condition}`;
  },
  {
    name: 'getWeather',
    description: 'Get current weather for a city',
    schema: z.object({
      city: z.string().describe('City name'),
    }),
  }
);
```

### Data Processing Tool

```typescript
import { tool } from 'langchain';
import { z } from 'zod';

const analyzeText = tool(
  async ({ text }) => {
    const wordCount = text.split(' ').length;
    const sentences = text.split(/[.!?]+/).length;
    return `Text analysis: ${wordCount} words, ${sentences} sentences`;
  },
  {
    name: 'analyzeText',
    description: 'Analyze text for word count and sentence count',
    schema: z.object({
      text: z.string().describe('Text to analyze'),
    }),
  }
);
```

## Agent Configuration

### Basic Agent

```typescript
const basicAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [calculateSum, getWeather],
  systemPrompt: 'You are a helpful assistant.',
});
```

### Agent with Structured Output

```typescript
import { z } from 'zod';

const ResponseSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()),
});

const structuredAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [getWeather],
  responseFormat: ResponseSchema,
});
```

### Agent with Custom Prompt

```typescript
const customPromptAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [analyzeText],
  systemPrompt: `You are a text analysis expert.
  Always provide detailed analysis and suggestions for improvement.`,
});
```

## Multiple Tools Agent

```typescript
const multiToolAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [calculateSum, getWeather, analyzeText],
  systemPrompt:
    'You have access to multiple tools. Use them as needed to help users.',
});

// Example usage
const result = await multiToolAgent.invoke({
  messages: [
    {
      role: 'user',
      content:
        'Calculate 15 + 27, then analyze this text: "Hello world. This is a test."',
    },
  ],
});
```

## Error Handling

```typescript
const robustTool = tool(
  async ({ input }) => {
    try {
      // Your tool logic here
      if (!input) {
        throw new Error('Input is required');
      }
      return `Processed: ${input}`;
    } catch (error) {
      return `Error processing input: ${error.message}`;
    }
  },
  {
    name: 'robustTool',
    description: 'A tool that handles errors gracefully',
    schema: z.object({
      input: z.string().describe('Input to process'),
    }),
  }
);

const errorHandlingAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [robustTool],
  systemPrompt: 'Handle errors gracefully and provide helpful feedback.',
});
```

## Tool Chaining Pattern

```typescript
// Tool that depends on another tool's output
const formatResult = tool(
  async ({ rawData }) => {
    // Format the raw data nicely
    return `📊 Formatted Result:\n${JSON.stringify(rawData, null, 2)}`;
  },
  {
    name: 'formatResult',
    description: 'Format raw data into a readable format',
    schema: z.object({
      rawData: z.any().describe('Raw data to format'),
    }),
  }
);

const getData = tool(
  async ({ source }) => {
    // Simulate getting data
    return { source, data: [1, 2, 3, 4, 5] };
  },
  {
    name: 'getData',
    description: 'Get data from a source',
    schema: z.object({
      source: z.string().describe('Data source'),
    }),
  }
);

const chainingAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [getData, formatResult],
  systemPrompt: 'Use tools in sequence to get and format data.',
});
```

## Real-World Example: Web Scraping Agent

Based on the structured scraping example, here's a minimal web scraping agent:

```typescript
import { tool } from 'langchain';
import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';

const loadPage = tool(
  async ({ url }) => {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'WebAgent/1.0' },
    });
    const $ = cheerio.load(response.data);
    return {
      html: response.data,
      title: $('title').text().trim(),
      status: response.status,
    };
  },
  {
    name: 'loadPage',
    description: 'Load a webpage and return its content',
    schema: z.object({
      url: z.string().url().describe('URL to load'),
    }),
  }
);

const extractText = tool(
  async ({ html, selector }) => {
    const $ = cheerio.load(html);
    const text = $(selector).text().trim();
    return { text, length: text.length };
  },
  {
    name: 'extractText',
    description: 'Extract text from HTML using a CSS selector',
    schema: z.object({
      html: z.string().describe('HTML content'),
      selector: z.string().describe('CSS selector'),
    }),
  }
);

const webScrapingAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [loadPage, extractText],
  systemPrompt: `You are a web scraping agent. Use tools to:
  1. Load pages with loadPage
  2. Extract content with extractText
  3. Focus on main content areas like 'main', 'article', '.content'`,
});

// Usage
const result = await webScrapingAgent.invoke({
  messages: [
    {
      role: 'user',
      content: 'Scrape the main content from https://example.com',
    },
  ],
});
```

## Testing Agents

```typescript
import { createAgent, tool } from 'langchain';

// Mock tool for testing
const mockTool = tool(async ({ input }) => `Mock response for: ${input}`, {
  name: 'mockTool',
  description: 'Mock tool for testing',
  schema: z.object({ input: z.string() }),
});

// Create agent for testing
const testAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [mockTool],
});

// Test the agent
describe('Agent Tests', () => {
  test('should use tool correctly', async () => {
    const result = await testAgent.invoke({
      messages: [{ role: 'user', content: 'Test input' }],
    });

    expect(result.messages.length).toBeGreaterThan(1);
    expect(result.messages[1].content).toContain('Mock response');
  });
});
```

## Best Practices

1. **Keep Tools Focused**: Each tool should do one specific thing well
2. **Use Descriptive Names**: Tool names and descriptions should be clear
3. **Validate Inputs**: Use Zod schemas to validate tool inputs
4. **Handle Errors**: Tools should handle errors gracefully
5. **Test Thoroughly**: Test both tools and agent behavior
6. **Use OpenRouter**: Better model access and pricing than direct OpenAI

## Advanced Patterns

### Conditional Tool Usage

```typescript
const smartAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [calculateSum, analyzeText],
  systemPrompt: `Choose the right tool based on the user's request:
  - For math: use calculateSum
  - For text analysis: use analyzeText
  - Explain your tool choice`,
});
```

### Multi-Step Workflows

```typescript
const workflowAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [getData, formatResult, analyzeText],
  systemPrompt: `Break down complex tasks into steps:
  1. Gather data
  2. Process/format data
  3. Analyze results
  4. Provide final answer`,
});
```

## References

- [Getting Started Guide](../docs/getting-started.md)
- [LangChain.js 1.0 Comprehensive Guide](../docs/langchainjs-1.0-comprehensive-guide.md)
- [Structured Extraction Guide](../docs/langchainjs-1.0-structured-extraction.md)
- [Migration Guide](../docs/langchainjs-1.0-migration.md)

## Next Steps

1. Experiment with the examples above
2. Create your own custom tools
3. Build agents for specific use cases
4. Add comprehensive testing
5. Deploy and monitor your agents
