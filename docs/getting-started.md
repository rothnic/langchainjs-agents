# Getting Started with LangChain.js 1.0 Tool-Based Agents

This guide will teach you how to build reliable AI agents using LangChain.js 1.0's tool-based patterns. Learn to create agents that interact with content through specialized tools rather than loading full datasets, all with type safety and comprehensive error handling.

## Why Tool-Based Agents?

LangChain.js 1.0 provides powerful patterns for building efficient AI agents:

- **Tool-Based Interaction**: Agents use specialized tools to navigate and extract content iteratively
- **Efficient Processing**: Avoid loading full HTML by using outline-based navigation
- **OpenRouter Integration**: Configure different LLM providers via environment variables
- **Schema Validation**: Zod integration for runtime type safety
- **Comprehensive Logging**: Debug agent and tool execution with detailed logging
- **Production Ready**: Built-in testing, validation, and deployment patterns

## Quick Start

### 1. Setup Your Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd langchainjs-agents

# Install dependencies
npm install

# Set up environment variables for OpenRouter/OpenAI
cp .env.example .env
# Add your OPENAI_API_KEY to .env
# Set OPENAI_BASE_URL=https://openrouter.ai/api/v1 for OpenRouter
```

### 2. Explore the Tool-Based Structured Scraping Example

The included example demonstrates a tool-based agent that can interact with web content iteratively:

```typescript
import { StructuredScrapingAgent } from './examples/structured-scraping/src/agent.js';

// Create an agent instance with web scraping tools
const agent = new StructuredScrapingAgent();

// Extract structured data from a webpage using tools
const result = await agent.execute({
  url: 'https://example.com',
  options: { timeout: 10000 }
});

console.log('Title:', result.title);
console.log('Headings:', result.headings);
console.log('Content blocks:', result.content.length);
```

The agent uses specialized tools to:
- **Load pages** and analyze content structure
- **Extract specific sections** using CSS selectors
- **Navigate links** and detect external/internal references
- **Handle long content** by focusing on main content areas
- **Process content iteratively** rather than loading everything at once

### 3. Create Your First Tool-Based Agent

Extend the `BaseAgent` class to build custom agents with tools:

```typescript
import { BaseAgent } from '../src/base-agent.js';
import { createAgent, tool } from 'langchain';
import { z } from 'zod';

const MyAgentInputSchema = z.object({
  query: z.string().describe('The query to process'),
  options: z.object({
    timeout: z.number().default(30000)
  }).optional()
});

export class MyCustomAgent extends BaseAgent {
  constructor() {
    super('my-custom-agent');
  }

  protected validateInput(input: any): void {
    MyAgentInputSchema.parse(input);
  }

  async execute(input: any) {
    // Define tools for your agent
    const searchTool = tool(
      async ({ query }) => {
        // Mock search implementation
        return `Search results for: ${query}`;
      },
      {
        name: 'search',
        description: 'Search for information',
        schema: z.object({ query: z.string() })
      }
    );

    // Create agent with tools
    const agent = await createAgent({
      model: 'openai:gpt-4o-mini',
      tools: [searchTool]
    });

    // Execute agent
    const result = await agent.invoke({
      messages: [{ role: 'user', content: input.query }]
    });

    return {
      result: result.messages[result.messages.length - 1].content,
      processedAt: new Date().toISOString()
    };
  }
}
```

## Core Concepts

### Tool-Based Agent Design

**Design tools first** - tools are the foundation of efficient agent interaction:

```typescript
// Good: Specialized tools for specific interactions
const getPageOutline = tool(
  async ({ url }) => {
    // Get page structure without loading full content
    return {
      title: 'Page Title',
      headings: ['H1', 'H2', 'H3'],
      sections: ['header', 'main', 'footer']
    };
  },
  {
    name: 'getPageOutline',
    description: 'Get page structure outline',
    schema: z.object({ url: z.string().url() })
  }
);

// Avoid: Generic tools that load everything
const loadFullPage = tool(
  async ({ url }) => {
    // Loads entire page - inefficient!
    return await fetch(url).then(r => r.text());
  },
  {
    name: 'loadFullPage',
    schema: z.object({ url: z.string() })
  }
);
```

### createAgent with Tools

The `createAgent` function creates agents with specialized tools:

```typescript
import { createAgent, tool } from 'langchain';
import { z } from 'zod';

// Define tools for content interaction
const extractSectionContent = tool(
  async ({ url, section }) => {
    // Extract specific section content
    return { content: 'Section content...', wordCount: 150 };
  },
  {
    name: 'extractSectionContent',
    description: 'Extract content from specific section',
    schema: z.object({
      url: z.string().url(),
      section: z.string()
    })
  }
);

// Create agent with tools
const agent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [getPageOutline, extractSectionContent]
});

// Use agent
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Analyze this webpage: https://example.com' }]
});
```

### Efficient Content Processing

Use tools to interact with content efficiently:

```typescript
class WebScrapingTools {
  // Get page outline without loading full content
  async getPageOutline(url: string) {
    // Return structure: headings, sections, navigation
  }

  // Extract specific sections
  async extractSectionContent(url: string, section: string) {
    // Extract targeted content
  }

  // Analyze links
  async extractSectionLinks(url: string, section: string) {
    // Return categorized links
  }
}
```

## Advanced Tool Patterns

### Multiple Tool Types

Handle different types of content interaction with specialized tools:

```typescript
const navigationTool = tool(
  async ({ url, direction }) => {
    // Navigate to different sections
    return { newUrl: url, section: direction };
  },
  {
    name: 'navigate',
    description: 'Navigate to different page sections',
    schema: z.object({
      url: z.string().url(),
      direction: z.enum(['next', 'previous', 'up', 'down'])
    })
  }
);

const analysisTool = tool(
  async ({ content, analysisType }) => {
    // Analyze content characteristics
    return { insights: 'Analysis results...' };
  },
  {
    name: 'analyzeContent',
    description: 'Analyze content characteristics',
    schema: z.object({
      content: z.string(),
      analysisType: z.enum(['sentiment', 'topics', 'entities'])
    })
  }
);
```

### Tool Chains for Complex Workflows

Combine tools for multi-step processes:

```typescript
class ContentProcessingAgent {
  async processArticle(url: string) {
    // Step 1: Get outline
    const outline = await this.getPageOutline(url);

    // Step 2: Extract main content
    const mainContent = await this.extractSectionContent(url, 'article');

    // Step 3: Analyze content
    const analysis = await this.analyzeContent(mainContent.content, 'topics');

    // Step 4: Extract links
    const links = await this.extractSectionLinks(url, 'article');

    return {
      outline,
      content: mainContent,
      analysis,
      links
    };
  }
}
```

### Error Handling with Tools

Implement robust error handling for tool-based interactions:

```typescript
class ResilientToolAgent {
  async executeWithRetry(toolCall: () => Promise<any>, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await toolCall();
      } catch (error) {
        console.warn(`Tool call failed (attempt ${attempt}):`, error.message);

        if (attempt === maxRetries) {
          throw new Error(`Tool failed after ${maxRetries} attempts: ${error.message}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async safeExtractSection(url: string, section: string) {
    return this.executeWithRetry(async () => {
      return await this.extractSectionContent(url, section);
    });
  }
}
```

## Testing Tool-Based Agents

### Unit Tests with Tool Mocks

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createAgent, tool } from 'langchain';

describe('WebScrapingAgent', () => {
  it('should extract content using tools successfully', async () => {
    // Mock tools
    const mockGetOutline = vi.fn().mockResolvedValue({
      title: 'Test Page',
      sections: ['header', 'main', 'footer']
    });

    const mockExtractContent = vi.fn().mockResolvedValue({
      content: 'Main content...',
      wordCount: 150
    });

    // Create agent with mocked tools
    const agent = await createAgent({
      model: 'openai:gpt-4o-mini',
      tools: [
        tool(mockGetOutline, {
          name: 'getPageOutline',
          schema: z.object({ url: z.string() })
        }),
        tool(mockExtractContent, {
          name: 'extractSectionContent',
          schema: z.object({ url: z.string(), section: z.string() })
        })
      ]
    });

    const result = await agent.invoke({
      messages: [{ role: 'user', content: 'Extract from https://example.com' }]
    });

    expect(mockGetOutline).toHaveBeenCalled();
    expect(result.messages.length).toBeGreaterThan(1);
  });

  it('should handle tool errors gracefully', async () => {
    const failingTool = vi.fn().mockRejectedValue(new Error('Network error'));

    const agent = await createAgent({
      model: 'openai:gpt-4o-mini',
      tools: [
        tool(failingTool, {
          name: 'failingTool',
          schema: z.object({})
        })
      ]
    });

    const result = await agent.invoke({
      messages: [{ role: 'user', content: 'Use failing tool' }]
    });

    // Agent should handle the error and respond appropriately
    expect(result.messages[result.messages.length - 1].content).toContain('error');
  });
});
```

### Integration Tests with Real Tools

```typescript
describe('WebScrapingAgent Integration', () => {
  it.skip('should extract real webpage content', async () => {
    // Only run with real API and network access
    if (!process.env.USE_REAL_APIS) return;

    const agent = new StructuredScrapingAgent();
    const result = await agent.scrape('https://httpbin.org/html', {
      timeout: 15000
    });

    expect(result).toMatchObject({
      title: expect.any(String),
      content: expect.any(Array),
      metadata: expect.objectContaining({
        wordCount: expect.any(Number)
      })
    });
  });
});
```

## Best Practices

### Tool Design
- **Be Specific**: Create specialized tools for specific interactions
- **Efficient**: Avoid loading full content when outlines suffice
- **Composable**: Design tools that work well together
- **Error Handling**: Include proper error handling in tool implementations

### Agent Architecture
- **Outline First**: Get content structure before detailed extraction
- **Iterative Processing**: Process content in focused chunks
- **Logging**: Include comprehensive logging for debugging
- **Timeouts**: Set reasonable timeouts for tool operations

### Performance
- **Model Selection**: Use appropriate model sizes for your use case
- **Caching**: Cache tool results when possible
- **Batching**: Process multiple items together when appropriate
- **Monitoring**: Track tool usage and performance metrics

### Testing
- **Mock Tools**: Use mocks for unit tests to ensure fast, reliable testing
- **Real API Tests**: Separate integration tests for real tool validation
- **Edge Cases**: Test malformed inputs, network errors, and timeouts
- **Logging Verification**: Test that logging works as expected

## Common Tool Patterns

### Web Content Extraction

```typescript
const webTools = [
  tool(
    async ({ url }) => {
      // Get page outline
      return { title: 'Page Title', sections: ['header', 'main'] };
    },
    {
      name: 'getPageOutline',
      description: 'Get page structure outline',
      schema: z.object({ url: z.string().url() })
    }
  ),
  tool(
    async ({ url, section }) => {
      // Extract section content
      return { content: 'Section content...', links: [] };
    },
    {
      name: 'extractSectionContent',
      description: 'Extract content from specific section',
      schema: z.object({
        url: z.string().url(),
        section: z.string()
      })
    }
  )
];
```

### Data Processing Agents

```typescript
const dataTools = [
  tool(
    async ({ data, operation }) => {
      // Process data
      return { result: 'Processed data...' };
    },
    {
      name: 'processData',
      description: 'Process data with specified operation',
      schema: z.object({
        data: z.any(),
        operation: z.enum(['filter', 'transform', 'analyze'])
      })
    }
  )
];
```

## Next Steps

1. **Explore the Examples**: Check out `examples/structured-scraping/` for working tool-based code
2. **Run the Tests**: Execute `npm test` to see the testing patterns with increased timeouts
3. **Try Different Tools**: Experiment with your own tool designs
4. **Add Logging**: Implement comprehensive logging for debugging

Remember: Tool-based agents are about efficiency and reliability. Design tools that interact with content intelligently, test thoroughly, and log extensively for debugging!
