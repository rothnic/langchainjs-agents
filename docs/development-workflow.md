# Development Workflow & CI Requirements

## Pre-Commit Validation Requirements

**CRITICAL**: Before committing any changes, you MUST run all CI commands locally to ensure they pass. This prevents CI failures and reduces development friction.

### Required Pre-Commit Commands

Run these commands in order and ensure ALL pass before committing:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Type checking - MUST pass with no errors
npm run typecheck

# 3. Linting - MUST pass (warnings acceptable for 'any' types in utility code)
npm run lint

# 4. Unit tests - MUST pass all tests
npm run test:unit

# 5. Build - MUST complete successfully
npm run build

# 6. Format check - MUST pass (run prettier --write . if needed)
npm run format:check
```

### Quick Validation Script

You can run all validations at once:

```bash
npm run typecheck && npm run lint && npm run test:unit && npm run build && npm run format:check
```

### If Formatting Fails

If `npm run format:check` fails, fix it by running:

```bash
npx prettier --write .
```

Then run `npm run format:check` again to verify.

## Integration Tests with Increased Timeouts

Integration tests require real API calls and should be run separately with longer timeouts:

```bash
# Only run when testing real API integration (15-30 second timeouts typical)
USE_REAL_APIS=true npm run test:integration
```

⚠️ **Note**: Integration tests require:

- `USE_REAL_APIS=true` environment variable
- Valid `OPENAI_API_KEY` environment variable
- `OPENAI_BASE_URL=https://openrouter.ai/api/v1` for OpenRouter (recommended)
- Are typically run only with approval in CI/CD due to longer execution times

## CI/CD Pipeline

Our GitHub Actions workflow runs:

1. **Type Check**: Validates TypeScript compilation
2. **Lint**: Code quality and style enforcement
3. **Unit Tests**: Fast mocked tests
4. **Build**: Compilation and artifact generation
5. **Format Check**: Prettier code formatting
6. **Integration Tests**: (conditional) Real API testing

## Development Best Practices

### Before Each Commit:

1. ✅ Run all pre-commit validation commands
2. ✅ Ensure no TypeScript errors
3. ✅ Address any linting errors (warnings for `any` types acceptable in utility code)
4. ✅ Verify all unit tests pass
5. ✅ Confirm build completes successfully
6. ✅ Check code formatting is consistent

### Acceptable Warnings:

- `@typescript-eslint/no-explicit-any` warnings in:
  - Test utilities and mocks
  - External library type definitions
  - Complex type intersections where `any` is necessary

### Required Fixes:

- All TypeScript compilation errors
- ESLint errors (not warnings)
- Failed unit tests
- Build failures
- Prettier formatting issues

## Tool-Based Agent Development Workflow

### 1. Design Specialized Tools

Create tools that interact with content efficiently without loading everything:

```typescript
import { tool } from 'langchain';
import { z } from 'zod';

class WebScrapingTools {
  // Tool: Get page outline without loading full content
  getPageOutline = tool(
    async ({ url }) => {
      // Get structure: headings, sections, navigation
      return {
        title: 'Page Title',
        headings: ['H1', 'H2', 'H3'],
        sections: ['header', 'main', 'footer'],
        hasNavigation: true,
      };
    },
    {
      name: 'getPageOutline',
      description: 'Get page structure outline for efficient navigation',
      schema: z.object({ url: z.string().url() }),
    }
  );

  // Tool: Extract specific content sections
  extractSectionContent = tool(
    async ({ url, section }) => {
      // Extract targeted content using section identifier
      return {
        content: 'Section content...',
        wordCount: 150,
        links: ['link1', 'link2'],
      };
    },
    {
      name: 'extractSectionContent',
      description: 'Extract content from a specific page section',
      schema: z.object({
        url: z.string().url(),
        section: z.string(),
      }),
    }
  );

  // Tool: Analyze and categorize links
  extractSectionLinks = tool(
    async ({ url, section }) => {
      // Find and categorize links in a section
      return {
        internal: ['/page1', '/page2'],
        external: ['https://external.com'],
        navigation: ['#top', '#bottom'],
      };
    },
    {
      name: 'extractSectionLinks',
      description: 'Extract and categorize links from a page section',
      schema: z.object({
        url: z.string().url(),
        section: z.string(),
      }),
    }
  );
}
```

### 2. Implement Agent with Tool-Based Logic

Use `createAgent` with tools for iterative content processing:

```typescript
import { createAgent } from 'langchain';

class ToolBasedAgent {
  private tools: WebScrapingTools;

  async createAgent() {
    return await createAgent({
      model: 'openai:gpt-4o-mini',
      tools: [
        this.tools.getPageOutline,
        this.tools.extractSectionContent,
        this.tools.extractSectionLinks,
      ],
    });
  }

  async processContent(url: string) {
    const agent = await this.createAgent();

    // Use agent to analyze and extract content iteratively
    const result = await agent.invoke({
      messages: [
        {
          role: 'user',
          content: `Analyze and extract content from: ${url}. Start by getting the page outline, then extract main content sections.`,
        },
      ],
    });

    return this.parseAgentResponse(result);
  }
}
```

### 3. Handle Content Iteratively

Process content in focused chunks rather than loading everything:

```typescript
private async processLongContent(url: string) {
  const agent = await this.createAgent();

  // Step 1: Get outline first
  const outlineResult = await agent.invoke({
    messages: [{
      role: 'user',
      content: `Get outline for: ${url}`
    }]
  });

  const outline = this.parseOutline(outlineResult);

  // Step 2: Extract main content sections iteratively
  const contentResults = [];
  for (const section of outline.mainSections) {
    const sectionResult = await agent.invoke({
      messages: [{
        role: 'user',
        content: `Extract content from section "${section}" on: ${url}`
      }]
    });
    contentResults.push(this.parseSectionContent(sectionResult));
  }

  return this.combineResults(outline, contentResults);
}
```

### 4. Implement Comprehensive Logging

Add detailed logging for debugging agent and tool execution:

```typescript
class LoggingToolBasedAgent extends ToolBasedAgent {
  async processContent(url: string) {
    console.log(`[AGENT] Starting content processing for: ${url}`);

    try {
      const agent = await this.createAgent();
      console.log(
        `[AGENT] Created agent with ${agent.tools?.length || 0} tools`
      );

      const result = await agent.invoke({
        messages: [
          {
            role: 'user',
            content: `Analyze and extract content from: ${url}`,
          },
        ],
      });

      console.log(
        `[AGENT] Agent completed processing, response length: ${result.messages.length}`
      );

      // Log tool calls made during execution
      const toolCalls = result.messages.filter((m) => m.tool_calls?.length > 0);
      console.log(`[AGENT] Tool calls made: ${toolCalls.length}`);

      toolCalls.forEach((message, index) => {
        message.tool_calls?.forEach((call) => {
          console.log(
            `[TOOL] Call ${index + 1}: ${call.name} with args:`,
            call.args
          );
        });
      });

      return this.parseAgentResponse(result);
    } catch (error) {
      console.error(`[AGENT] Error processing ${url}:`, error);
      throw error;
    }
  }
}
```

### 5. Error Handling & Recovery

Implement robust error handling for tool-based interactions:

```typescript
private categorizeError(error: any): string {
  if (error.code === 'ENOTFOUND') return 'network';
  if (error.code === 'ETIMEDOUT') return 'timeout';
  if (error.message?.includes('tool')) return 'tool_execution';
  if (error.message?.includes('schema')) return 'validation';
  return 'unknown';
}

async executeWithRetry(operation: () => Promise<any>, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[RETRY] Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      const errorType = this.categorizeError(error);
      console.warn(`[RETRY] Attempt ${attempt} failed (${errorType}):`, error.message);

      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Environment Setup

Ensure you have:

- Node.js 18 or higher
- npm dependencies installed
- Proper environment variables:
  - `OPENAI_API_KEY`: Your OpenAI API key
  - `OPENAI_BASE_URL`: `https://openrouter.ai/api/v1` for OpenRouter (recommended) or `https://api.openai.com/v1` for direct OpenAI
  - `USE_REAL_APIS`: Set to `true` for integration tests

## Troubleshooting

### Common Issues:

**TypeScript Errors**:

- Check for missing dependencies: `npm install`
- Verify imports are correct
- Ensure types are properly defined

**Linting Errors**:

- Run `npx eslint . --ext .ts,.js --fix` for auto-fixes
- Address unused variables (prefix with `_` if intentionally unused)

**Test Failures**:

- Check mock configurations
- Verify test environment setup
- Ensure test isolation

**Build Failures**:

- Clean `dist/` directory: `rm -rf dist/`
- Check TypeScript configuration
- Verify entry points in `package.json`

**Format Issues**:

- Run `npx prettier --write .`
- Check `.prettierrc.json` configuration

**Agent Development Issues**:

- Verify tool definitions are correct and schemas are properly typed
- Test with simpler tools first when debugging
- Check OpenRouter API key and base URL configuration
- Ensure tool interfaces match agent expectations
- Validate logging output for debugging tool execution
- Check integration test timeouts are sufficient (15-30 seconds typical)

## Best Practices for Tool-Based Agent Development

### Tool Design

- **Be Specific**: Create specialized tools for specific interactions
- **Efficient**: Design tools that avoid loading full content when possible
- **Composable**: Make tools that work well together in sequences
- **Well-Typed**: Use clear Zod schemas for tool parameters and responses

### Agent Architecture

- **Outline First**: Get content structure before detailed extraction
- **Iterative Processing**: Process content in focused chunks
- **Logging**: Include comprehensive logging for debugging
- **Error Recovery**: Implement robust error handling for tool failures

### OpenRouter/OpenAI Configuration

- **Use OpenRouter**: Set `OPENAI_BASE_URL=https://openrouter.ai/api/v1` for flexibility
- **Fallback to Direct**: Use `https://api.openai.com/v1` for direct OpenAI access
- **Environment Variables**: Keep API keys secure and configurable
- **Model Selection**: Choose appropriate models (gpt-4o-mini for most tasks)

### Testing

- **Mock Tools**: Use mocks for unit tests to ensure fast, reliable testing
- **Real API Tests**: Separate integration tests with increased timeouts
- **Edge Cases**: Test network errors, malformed inputs, and tool failures
- **Logging Verification**: Ensure logging works for debugging

### Performance

- **Tool Efficiency**: Design tools to minimize data transfer
- **Caching**: Cache tool results when appropriate
- **Batching**: Process multiple operations together when possible
- **Monitoring**: Track tool usage, success rates, and performance metrics

### Agent Patterns

- **Web Scraping Agents**: Tool-based content extraction and navigation
- **Data Processing Agents**: Structured data extraction and transformation
- **Content Analysis Agents**: Document analysis and summarization
- **Integration Agents**: API interactions and external service communication
- **Workflow Agents**: Multi-step process orchestration with tool chains

This workflow ensures consistent code quality and prevents CI failures while promoting best practices for tool-based agent development with LangChain.js 1.0.
