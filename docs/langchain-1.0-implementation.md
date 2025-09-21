# LangChain 1.0 Implementation Guide

This document explains how this repository implements LangChain 1.0 best practices for agent development.

## LangChain 1.0 Features Used

### 1. Modular Package Structure

The repository uses the new modular import structure from LangChain 1.0:

```typescript
// Using specific provider packages
import { ChatOpenAI } from '@langchain/openai';

// Using core utilities
import { z } from 'zod';
```

### 2. Schema-First Development with Zod

Following LangChain 1.0 best practices, we use Zod schemas for:

- Input validation
- Output validation
- Type safety at runtime

```typescript
// Structured output validation
export const scrapedDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  headings: z.array(headingSchema),
  content: z.array(contentBlockSchema),
  links: z.array(linkSchema),
  images: z.array(imageSchema),
  metadata: metadataSchema,
});

// Type inference from schema
export type ScrapedData = z.infer<typeof scrapedDataSchema>;
```

### 3. Modern LLM Invocation Patterns

The implementation uses LangChain 1.0's standardized message format:

```typescript
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: humanPrompt },
];

const response = await this.llm.invoke(messages);
```

### 4. Provider Abstraction with Factory Pattern

The `LLMFactory` implements provider abstraction supporting:

- GitHub Models (cost-free testing)
- OpenAI (production)
- Easy switching between providers

```typescript
// Automatic provider selection based on environment
const llm = LLMFactory.createLLM({
  model: 'openai/gpt-4o-mini',
  temperature: 0.1,
});
```

### 5. Error Handling and Fallbacks

Following LangChain 1.0 patterns for robust error handling:

```typescript
try {
  const response = await this.llm.invoke(messages);
  // Parse and validate response
  return scrapedDataSchema.parse(enhancedData);
} catch (error) {
  console.warn('LLM enhancement failed, using basic data:', error);
  // Graceful fallback to basic extraction
  return scrapedDataSchema.parse(basicData);
}
```

## When to Use LangGraph

LangGraph is recommended for:

- **Multi-step workflows** with complex state management
- **Tool-calling agents** that need decision trees
- **Conversational agents** with memory
- **Multi-agent systems** with collaboration patterns

### Current Implementation Choice

The structured scraping agent uses a **simple linear workflow**:

1. Fetch webpage
2. Extract basic data with Cheerio
3. Enhance with LLM
4. Validate and return

This doesn't require LangGraph's complex state management. The current approach is appropriate because:

- ✅ **Single-purpose**: Focus on web scraping and enhancement
- ✅ **Linear flow**: No branching or complex decisions
- ✅ **Predictable**: Same steps for every URL
- ✅ **Fast**: Direct invocation without graph overhead

### When to Migrate to LangGraph

Consider migrating when you need:

```typescript
// Example: Multi-step research agent with tools
import { StateGraph, Annotation } from '@langchain/langgraph';
import { ToolNode, tool } from 'langchain';

const tools = [
  tool(async ({ url }) => scrapeWebpage(url), {
    name: 'scrape_webpage',
    schema: z.object({ url: z.string().url() }),
  }),
  tool(async ({ query }) => searchWeb(query), {
    name: 'search_web',
    schema: z.object({ query: z.string() }),
  }),
];

// Graph-based agent for complex workflows
const researchAgent = new StateGraph(AgentState)
  .addNode('planner', planningNode)
  .addNode('scraper', scrapingNode)
  .addNode('analyzer', analysisNode)
  .addConditionalEdges('planner', shouldContinue)
  .compile();
```

## Testing Patterns with LangChain 1.0

### Unit Testing with Mocks

```typescript
// Mock LLM responses for consistent testing
const mockLLM = {
  invoke: vi.fn().mockResolvedValue({
    content: JSON.stringify(expectedResponse),
  }),
};

const agent = new StructuredScrapingAgent(mockLLM);
```

### Integration Testing with Real APIs

```typescript
// Use environment toggle for real API testing
const USE_REAL_APIS = process.env.USE_REAL_APIS === 'true';

if (USE_REAL_APIS) {
  // Test with actual GitHub Models or OpenAI
  const realAgent = new StructuredScrapingAgent();
  const result = await realAgent.scrape(testUrl);
  expect(result).toMatchSchema(scrapedDataSchema);
} else {
  // Skip integration tests in CI unless explicitly enabled
  test.skip('Integration test requires USE_REAL_APIS=true');
}
```

## Migration Notes from LangChain 0.x

### Dependencies Updated

```json
{
  "dependencies": {
    "@langchain/openai": "^1.0.0-alpha.1",
    "langchain": "^1.0.0-alpha.6"
  }
}
```

### Import Changes

```typescript
// Old (0.x)
import { ChatOpenAI } from 'langchain/chat_models/openai';

// New (1.0)
import { ChatOpenAI } from '@langchain/openai';
```

### Message Format Standardization

```typescript
// Consistent message format across all providers
const messages = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Hello!' },
];
```

## Best Practices Implemented

1. **Schema Validation**: All inputs/outputs validated with Zod
2. **Error Handling**: Graceful fallbacks and clear error messages
3. **Provider Abstraction**: Easy switching between LLM providers
4. **Testing Strategy**: Unit tests with mocks + integration tests with real APIs
5. **Type Safety**: Full TypeScript coverage with strict compilation
6. **Documentation**: Clear examples and migration guides

## Future Enhancements

Consider these LangChain 1.0 features for future iterations:

1. **Structured Output**: Use LangChain's native structured output parsing
2. **Tool Integration**: Add tools for specific scraping tasks
3. **Memory**: Add conversation memory for interactive scraping
4. **Streaming**: Support streaming responses for large content
5. **Parallel Processing**: Use LangGraph for concurrent scraping

This implementation demonstrates modern LangChain 1.0 patterns while keeping complexity appropriate for the use case.
