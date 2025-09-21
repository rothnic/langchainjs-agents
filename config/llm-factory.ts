import { ChatOpenAI } from "@langchain/openai";
import { config } from './environment.js';

/**
 * Factory for creating LLM instances based on configuration
 */
export class LLMFactory {
  /**
   * Create an LLM instance based on the configured provider
   */

  static createLLM(options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): ChatOpenAI {
    const { model, temperature = 0.1, maxTokens } = options || {};

    if (config.llmProvider === 'github-models') {
      return this.createGitHubModelsLLM(model, temperature, maxTokens);
    } else {
      return this.createOpenAILLM(model, temperature, maxTokens);
    }
  }

  /**
   * Create GitHub Models LLM instance
   */
  private static createGitHubModelsLLM(
    model?: string,
    temperature?: number,
    maxTokens?: number
  ): ChatOpenAI {
    const modelName = model || 'openai/gpt-4o-mini';
    const apiKey = config.github.token || process.env.GITHUB_TOKEN;
    const baseURL = config.github.modelsBaseUrl || 'https://models.github.ai/inference';

    if (!apiKey) {
      throw new Error(
        'GitHub token is required for GitHub Models. Set GITHUB_TOKEN environment variable.'
      );
    }

    return new ChatOpenAI({
      model: modelName,
      temperature,
      maxTokens,
      apiKey,
      configuration: {
        baseURL,
        apiKey,
        defaultHeaders: {
          'User-Agent': 'langchainjs-agents/ci'
        }
      }
    });
  }

  /**
   * Create OpenAI LLM instance
   */
  private static createOpenAILLM(
    model?: string,
    temperature?: number,
    maxTokens?: number
  ): ChatOpenAI {
    const modelName = model || 'gpt-3.5-turbo';
    const apiKey = config.openai.apiKey;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key is required. Set OPENAI_API_KEY environment variable.'
      );
    }

    return new ChatOpenAI({
      model: modelName,
      temperature,
      maxTokens,
      apiKey,
    });
  }

  /**
   * Create a test-friendly LLM instance (uses GitHub Models by default)
   */
  static createTestLLM(): ChatOpenAI {
    // For tests, always prefer GitHub Models if available
    if (config.github.token || process.env.GITHUB_TOKEN) {
      return this.createGitHubModelsLLM('openai/gpt-4o-mini', 0.1);
    }

    // Fallback to OpenAI for backward compatibility
    if (config.openai.apiKey) {
      return this.createOpenAILLM('gpt-3.5-turbo', 0.1);
    }

    throw new Error(
      'No LLM provider configured. Set either GITHUB_TOKEN or OPENAI_API_KEY.'
    );
  }
}
