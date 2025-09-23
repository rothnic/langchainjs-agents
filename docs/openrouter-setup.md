# OpenRouter Integration Guide

This guide covers how to configure LangChain 1.0 agents to work with OpenRouter for cost-effective access to multiple LLM providers.

## Quick Setup

### 1. Environment Configuration

Create a `.env` file with your OpenRouter credentials:

```bash
# OpenRouter Configuration (Recommended)
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-openrouter-key-here
DEFAULT_MODEL=openai/gpt-4o-mini

# Optional: GitHub Models (Free for Pro users)
# OPENAI_BASE_URL=https://models.inference.ai.azure.com
# GITHUB_TOKEN=your-github-token
# DEFAULT_MODEL=gpt-4o-mini
```

### 2. LLM Initialization Pattern

Always pass an explicit LLM instance to `createAgent`:

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';

// ✅ Correct: Explicit LLM configuration
const llm = new ChatOpenAI({
  model: process.env.DEFAULT_MODEL || 'openai/gpt-4o-mini',
  temperature: 0.1,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  },
});

const agent = await createAgent({
  llm, // Pass the configured LLM instance
  tools: [myTool],
  systemPrompt: 'You are a helpful assistant.',
});
```

## Available Models

OpenRouter provides access to multiple providers:

### OpenAI Models

- `openai/gpt-4o` - Most capable, higher cost
- `openai/gpt-4o-mini` - Balanced performance/cost (recommended)
- `openai/gpt-3.5-turbo` - Fastest, lowest cost

### Anthropic Models

- `anthropic/claude-3-5-sonnet` - Excellent reasoning
- `anthropic/claude-3-haiku` - Fast and affordable

### Open Source Models

- `meta-llama/llama-3.1-8b-instruct` - Free tier available
- `microsoft/wizardlm-2-8x22b` - High performance

### Usage Examples

```typescript
// High-performance agent for complex tasks
const highPerformanceLLM = new ChatOpenAI({
  model: 'openai/gpt-4o',
  temperature: 0.1,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// Cost-effective agent for simple tasks
const costEffectiveLLM = new ChatOpenAI({
  model: 'openai/gpt-4o-mini',
  temperature: 0.1,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// Free tier agent for development
const freeLLM = new ChatOpenAI({
  model: 'meta-llama/llama-3.1-8b-instruct',
  temperature: 0.1,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
  },
});
```

## LLM Factory Pattern

For easier provider switching, use a factory function:

```typescript
// config/llm-factory.ts
import { ChatOpenAI } from '@langchain/openai';

export interface LLMConfig {
  model?: string;
  temperature?: number;
  provider?: 'openrouter' | 'github-models' | 'openai';
}

export function createLLM(config: LLMConfig = {}): ChatOpenAI {
  const {
    model = process.env.DEFAULT_MODEL || 'openai/gpt-4o-mini',
    temperature = 0.1,
    provider = 'openrouter',
  } = config;

  switch (provider) {
    case 'openrouter':
      return new ChatOpenAI({
        model,
        temperature,
        configuration: {
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: process.env.OPENAI_API_KEY,
        },
      });

    case 'github-models':
      return new ChatOpenAI({
        model: model.replace('openai/', ''), // Remove openai/ prefix
        temperature,
        configuration: {
          baseURL: 'https://models.inference.ai.azure.com',
          apiKey: process.env.GITHUB_TOKEN,
        },
      });

    case 'openai':
    default:
      return new ChatOpenAI({
        model: model.replace('openai/', ''), // Remove openai/ prefix
        temperature,
        apiKey: process.env.OPENAI_API_KEY,
      });
  }
}
```

## Cost Optimization

### Model Selection Strategy

```typescript
// Choose model based on task complexity
export function selectModel(
  taskComplexity: 'simple' | 'medium' | 'complex'
): string {
  switch (taskComplexity) {
    case 'simple':
      return 'openai/gpt-4o-mini'; // $0.15/1M tokens
    case 'medium':
      return 'openai/gpt-4o-mini'; // Good balance
    case 'complex':
      return 'openai/gpt-4o'; // $2.50/1M tokens
    default:
      return 'openai/gpt-4o-mini';
  }
}

// Usage in agent
const llm = createLLM({
  model: selectModel('simple'),
  temperature: 0.1,
});
```

### Request Optimization

```typescript
// Optimize system prompts to reduce token usage
const concisePrompt = `Extract structured data from the webpage. Return JSON only.`;

// vs verbose prompt that wastes tokens
const verbosePrompt = `You are a helpful web scraping assistant. Please carefully analyze the webpage and extract all the structured data including titles, headings, content, metadata, etc. Make sure to be thorough and accurate in your extraction process...`;
```

## Error Handling

Handle provider-specific errors gracefully:

```typescript
export async function callLLMWithRetry(
  llm: ChatOpenAI,
  messages: any[],
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await llm.invoke(messages);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // OpenRouter rate limiting
        if (error.message.includes('rate limit')) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Model not available
        if (error.message.includes('model not found')) {
          throw new Error(
            `Model not available on OpenRouter: ${error.message}`
          );
        }

        // API key issues
        if (error.message.includes('unauthorized')) {
          throw new Error('Invalid OpenRouter API key');
        }
      }

      // Last attempt, throw error
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}
```

## Environment Variables Reference

```bash
# Required
OPENAI_API_KEY=sk-or-v1-your-openrouter-key
OPENAI_BASE_URL=https://openrouter.ai/api/v1

# Optional
DEFAULT_MODEL=openai/gpt-4o-mini
DEFAULT_TEMPERATURE=0.1

# For GitHub Models (alternative)
GITHUB_TOKEN=your-github-token
# OPENAI_BASE_URL=https://models.inference.ai.azure.com

# For development
NODE_ENV=development
USE_REAL_APIS=false
```

## Testing with Different Providers

```typescript
describe('Multi-provider tests', () => {
  const providers = ['openrouter', 'github-models'] as const;

  providers.forEach((provider) => {
    describe(`with ${provider}`, () => {
      it('should handle basic requests', async () => {
        const llm = createLLM({ provider });
        const result = await llm.invoke([
          { role: 'user', content: 'Say hello' },
        ]);
        expect(result.content).toContain('hello');
      });
    });
  });
});
```

## Common Pitfalls

### ❌ Using Model String Instead of LLM Instance

```typescript
// This won't work with OpenRouter
const agent = await createAgent({
  model: 'gpt-4o-mini', // No OpenRouter support
  tools: [myTool],
});
```

### ❌ Missing Configuration

```typescript
// Missing baseURL means it uses OpenAI directly
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY, // OpenAI key, not OpenRouter
});
```

### ❌ Wrong Model Names

```typescript
// OpenRouter requires provider prefix
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini', // Should be 'openai/gpt-4o-mini'
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY,
  },
});
```

Following this guide ensures reliable, cost-effective LLM access through OpenRouter with proper error handling and optimization.
