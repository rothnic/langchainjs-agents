import { vi } from 'vitest';
import type { ChatOpenAI } from '@langchain/openai';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Mock OpenAI Chat Model for testing
 */
export class MockChatOpenAI {
  private responses: string[] = [];
  private responseIndex = 0;

  constructor(responses: string[] = ['Mock response']) {
    this.responses = responses;
  }

  async invoke(messages: BaseMessage[]): Promise<{ content: string }> {
    const response = this.responses[this.responseIndex % this.responses.length];
    this.responseIndex++;
    return { content: response };
  }

  async call(messages: BaseMessage[]): Promise<{ content: string }> {
    return this.invoke(messages);
  }
}

/**
 * Factory for creating mock LLM instances
 */
export const createMockLLM = (
  responses: string[] = ['Mock response']
): MockChatOpenAI => {
  return new MockChatOpenAI(responses);
};

/**
 * Mock web scraping responses
 */
export const mockWebResponses = {
  'https://example.com': {
    status: 200,
    data: `
      <html>
        <head><title>Example Page</title></head>
        <body>
          <h1>Welcome to Example</h1>
          <p>This is a test page with structured content.</p>
          <div class="content">
            <h2>Section 1</h2>
            <p>Content for section 1</p>
          </div>
        </body>
      </html>
    `,
  },
  'https://api.example.com/data': {
    status: 200,
    data: {
      title: 'Example API Response',
      items: [
        { id: 1, name: 'Item 1', description: 'First item' },
        { id: 2, name: 'Item 2', description: 'Second item' },
      ],
    },
  },
};

/**
 * Setup mocks for HTTP requests
 */
export const setupHttpMocks = () => {
  const axiosMock: any = vi.fn();

  axiosMock.mockImplementation((config: any) => {
    const url = typeof config === 'string' ? config : config.url;
    const mockResponse = mockWebResponses[url as keyof typeof mockWebResponses];

    if (mockResponse) {
      return Promise.resolve(mockResponse);
    }

    return Promise.reject(new Error(`No mock found for URL: ${url}`));
  });

  // Add the get method for axios.get calls
  axiosMock.get = vi.fn().mockImplementation((url: string, config?: any) => {
    const mockResponse = mockWebResponses[url as keyof typeof mockWebResponses];

    if (mockResponse) {
      return Promise.resolve(mockResponse);
    }

    return Promise.reject(new Error(`No mock found for URL: ${url}`));
  });

  return axiosMock;
};
