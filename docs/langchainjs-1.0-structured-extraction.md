# LangChain.js 1.0 - Structured Data Extraction Guide

This comprehensive guide covers all approaches to structured data extraction using LangChain.js 1.0, from basic schemas to advanced extraction pipelines for production use cases.

## Table of Contents

1. [Overview and Installation](#overview-and-installation)
2. [Core Extraction Methods](#core-extraction-methods)
3. [Schema Definition with Zod](#schema-definition-with-zod)
4. [The withStructuredOutput Method](#the-withstructuredoutput-method)
5. [Output Parsers and Custom Parsing](#output-parsers-and-custom-parsing)
6. [Reference Examples for Quality](#reference-examples-for-quality)
7. [Error Handling and Recovery](#error-handling-and-recovery)
8. [Advanced Extraction Patterns](#advanced-extraction-patterns)
9. [Performance Optimization](#performance-optimization)
10. [Production Use Cases](#production-use-cases)
11. [Testing and Validation](#testing-and-validation)
12. [Debug and Troubleshooting](#debug-and-troubleshooting)

## Overview and Installation

### What is Structured Data Extraction?

Structured data extraction transforms unstructured text into machine-readable formats like JSON objects, database records, or typed data structures. LangChain.js 1.0 provides multiple approaches:

- **Function/Tool Calling**: Using model-native structured output capabilities
- **JSON Schema**: Defining output format with JSON Schema specifications
- **Zod Schemas**: Type-safe TypeScript schema definition and validation
- **Custom Parsers**: Fallback parsing for models without native support

### Installation

```bash
# Install LangChain 1.0 and required packages
npm install langchain@next @langchain/openai@next @langchain/core@next
npm install zod zod-to-json-schema
npm install uuid  # For example generation
```

### Environment Setup

```typescript
import { config } from 'dotenv';
config();

// Required environment variables
// OPENAI_API_KEY=your_openai_api_key
// ANTHROPIC_API_KEY=your_anthropic_key (optional)
```

## Core Extraction Methods

### 1. Basic Extraction with createAgent

The simplest approach using LangChain.js 1.0's `createAgent`:

```typescript
import { createAgent, HumanMessage } from 'langchain';
import { z } from 'zod';

// Define extraction schema
const PersonSchema = z.object({
  name: z.string().optional().describe("The person's full name"),
  age: z.number().optional().describe("The person's age in years"),
  email: z.string().email().optional().describe('Email address if mentioned'),
  profession: z.string().optional().describe('Job title or profession'),
});

// Create extraction agent
const extractionAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [],
  responseFormat: PersonSchema,
});

// Extract data from text
const text =
  'John Smith is a 30-year-old software engineer. You can reach him at john@example.com.';

const result = await extractionAgent.invoke({
  messages: [new HumanMessage(`Extract person information from: ${text}`)],
});

console.log(result.structuredResponse);
// Output: { name: "John Smith", age: 30, email: "john@example.com", profession: "software engineer" }
```

### 2. Multiple Entity Extraction

Extract multiple entities from a single text:

```typescript
import { z } from 'zod';

// Single person schema
const PersonSchema = z.object({
  name: z.string().optional().describe("The person's full name"),
  age: z.number().optional().describe("The person's age"),
  role: z.string().optional().describe('Their role or job title'),
});

// Multiple people schema
const PeopleSchema = z.object({
  people: z
    .array(PersonSchema)
    .describe('List of people mentioned in the text'),
  summary: z.string().describe('Brief summary of the text content'),
});

const multipleExtractionAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [],
  responseFormat: PeopleSchema,
});

const text = `The meeting included CEO Alice Johnson (45), CTO Bob Williams (38), 
and intern Sarah Chen (22). They discussed the Q4 roadmap.`;

const result = await multipleExtractionAgent.invoke({
  messages: [
    new HumanMessage(`Extract all people and provide a summary: ${text}`),
  ],
});

console.log(result.structuredResponse);
/* Output:
{
  people: [
    { name: "Alice Johnson", age: 45, role: "CEO" },
    { name: "Bob Williams", age: 38, role: "CTO" },
    { name: "Sarah Chen", age: 22, role: "intern" }
  ],
  summary: "Meeting participants discussed Q4 roadmap including CEO, CTO, and intern"
}
*/
```

## Schema Definition with Zod

### 3. Complex Schema Patterns

#### Nested Objects

```typescript
import { z } from 'zod';

const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

const CompanySchema = z.object({
  name: z.string().describe('Company name'),
  industry: z.string().optional().describe('Industry sector'),
  address: AddressSchema.optional(),
  employees: z.number().optional().describe('Number of employees'),
  founded: z.number().optional().describe('Year founded'),
});
```

#### Enums and Unions

```typescript
const StatusEnum = z.enum(['active', 'inactive', 'pending', 'suspended']);

const ContactSchema = z.object({
  name: z.string(),
  status: StatusEnum,
  contactMethod: z.union([
    z.object({ type: z.literal('email'), value: z.string().email() }),
    z.object({ type: z.literal('phone'), value: z.string() }),
    z.object({ type: z.literal('address'), value: AddressSchema }),
  ]),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
```

#### Array Validation

```typescript
const EventSchema = z.object({
  title: z.string(),
  date: z.string().describe('Date in YYYY-MM-DD format'),
  attendees: z.array(z.string()).min(1).describe('List of attendee names'),
  tags: z.array(z.string()).optional().describe('Event categories or tags'),
  duration: z.number().positive().describe('Duration in minutes'),
});
```

### 4. Schema Documentation Best Practices

```typescript
const WellDocumentedSchema = z.object({
  // Clear, specific descriptions
  customerName: z.string().min(1).describe('Full legal name of the customer'),

  // Optional fields to avoid hallucination
  dateOfBirth: z
    .string()
    .optional()
    .describe('Birth date in YYYY-MM-DD format, only if explicitly mentioned'),

  // Constrained values
  accountType: z
    .enum(['premium', 'standard', 'basic'])
    .describe('Account tier - premium, standard, or basic'),

  // Numeric validation
  creditScore: z
    .number()
    .int()
    .min(300)
    .max(850)
    .optional()
    .describe('Credit score between 300-850, only if mentioned'),

  // Array with constraints
  previousAddresses: z
    .array(AddressSchema)
    .max(5)
    .optional()
    .describe('Up to 5 previous addresses if mentioned in chronological order'),
});
```

## The withStructuredOutput Method

### 5. Model-Level Structured Output

For direct model usage without agents:

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0, // Lower temperature for more consistent extraction
});

const InvoiceSchema = z.object({
  invoiceNumber: z.string(),
  date: z.string().describe('Invoice date in YYYY-MM-DD format'),
  vendor: z.string(),
  total: z.number().describe('Total amount as a number'),
  currency: z.string().default('USD'),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      total: z.number(),
    })
  ),
});

// Create structured model
const structuredModel = model.withStructuredOutput(InvoiceSchema);

// Create extraction chain
const prompt = ChatPromptTemplate.fromTemplate(`
Extract invoice information from the following text:

{text}

Be precise and only extract information that is clearly stated.
If a field is not mentioned, omit it from the response.
`);

const extractionChain = prompt.pipe(structuredModel);

// Use the chain
const invoiceText = `
Invoice #INV-2024-001
Date: March 15, 2024
From: TechCorp Solutions
Total: $1,250.00

Line Items:
- Software License (Qty: 1) - $1,000.00
- Support Package (Qty: 1) - $250.00
`;

const result = await extractionChain.invoke({ text: invoiceText });
console.log(result);
```

### 6. Method Selection

You can specify which method the model should use:

```typescript
// Use function calling (default for supported models)
const functionCallingModel = model.withStructuredOutput(schema, {
  method: 'functionCalling',
  name: 'extract_data',
});

// Use JSON mode (for models that support it)
const jsonModeModel = model.withStructuredOutput(schema, {
  method: 'jsonMode',
  name: 'extraction_result',
});

// Let LangChain choose the best method
const autoModel = model.withStructuredOutput(schema);
```

## Output Parsers and Custom Parsing

### 7. JsonOutputParser

For models without native structured output support:

```typescript
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

type ExtractedData = {
  entities: Array<{
    name: string;
    type: string;
    confidence: number;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
  }>;
};

const parser = new JsonOutputParser<ExtractedData>();

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `Extract entities and relationships from the text.
  
  {format_instructions}
  
  Return only valid JSON that matches this structure:
  {{
    "entities": [{{ "name": "string", "type": "string", "confidence": number }}],
    "relationships": [{{ "from": "string", "to": "string", "type": "string" }}]
  }}
  `,
  ],
  ['human', '{text}'],
]);

const extractionChain = prompt.pipe(model).pipe(parser);

const result = await extractionChain.invoke({
  text: 'Apple Inc. was founded by Steve Jobs in Cupertino, California.',
  format_instructions: parser.getFormatInstructions(),
});
```

### 8. Custom Parser with Error Recovery

````typescript
import { BaseOutputParser } from '@langchain/core/output_parsers';

class RobustJsonParser<T> extends BaseOutputParser<T> {
  constructor(private schema: z.ZodSchema<T>) {
    super();
  }

  async parse(text: string): Promise<T> {
    // Try to extract JSON from markdown code blocks
    const jsonMatch =
      text.match(/```json\n?(.*?)\n?```/s) || text.match(/```\n?(.*?)\n?```/s);

    let jsonStr = jsonMatch ? jsonMatch[1] : text;

    // Clean common formatting issues
    jsonStr = jsonStr
      .replace(/^\s*```json\s*/, '')
      .replace(/\s*```\s*$/, '')
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return this.schema.parse(parsed);
    } catch (error) {
      // Attempt to fix common JSON issues
      const fixed = this.attemptJsonFix(jsonStr);
      try {
        const parsed = JSON.parse(fixed);
        return this.schema.parse(parsed);
      } catch (secondError) {
        throw new Error(
          `Failed to parse JSON: ${error.message}\nOriginal text: ${text}`
        );
      }
    }
  }

  private attemptJsonFix(jsonStr: string): string {
    return jsonStr
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/\n/g, ' ') // Remove newlines
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  getFormatInstructions(): string {
    return `Respond with valid JSON that matches the required schema. 
    Wrap your response in \`\`\`json and \`\`\` tags.`;
  }
}

// Usage
const robustParser = new RobustJsonParser(PersonSchema);
const robustChain = prompt.pipe(model).pipe(robustParser);
````

## Reference Examples for Quality

### 9. Few-Shot Examples

Reference examples dramatically improve extraction quality:

```typescript
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  HumanMessage,
  AIMessage,
  ToolMessage,
} from '@langchain/core/prompts';
import { v4 as uuidv4 } from 'uuid';

// Create example extraction scenarios
const createExampleMessages = () => {
  const toolCallId = uuidv4();

  return [
    // Example 1: Clear extraction
    new HumanMessage(
      'Dr. Sarah Wilson, 42, is a cardiologist at City Hospital.'
    ),
    new AIMessage({
      content: '',
      tool_calls: [
        {
          id: toolCallId,
          name: 'extract_person',
          args: {
            name: 'Dr. Sarah Wilson',
            age: 42,
            profession: 'cardiologist',
            workplace: 'City Hospital',
          },
        },
      ],
    }),
    new ToolMessage({
      content: 'Successfully extracted person information.',
      tool_call_id: toolCallId,
    }),

    // Example 2: Partial information
    new HumanMessage("John mentioned he works in tech but didn't say his age."),
    new AIMessage({
      content: '',
      tool_calls: [
        {
          id: uuidv4(),
          name: 'extract_person',
          args: {
            name: 'John',
            profession: 'technology worker',
            // Note: age omitted when not mentioned
          },
        },
      ],
    }),
    new ToolMessage({
      content: 'Successfully extracted available person information.',
      tool_call_id: uuidv4(),
    }),

    // Example 3: No relevant information
    new HumanMessage('The weather today is sunny with a high of 75 degrees.'),
    new AIMessage({
      content: '',
      tool_calls: [
        {
          id: uuidv4(),
          name: 'extract_person',
          args: {
            people: [], // Empty when no people mentioned
          },
        },
      ],
    }),
    new ToolMessage({
      content: 'No person information found in the text.',
      tool_call_id: uuidv4(),
    }),
  ];
};

// Create prompt with examples
const promptWithExamples = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are an expert extraction algorithm. 
  Only extract information that is clearly stated in the text.
  If information is not mentioned, omit that field entirely.
  Look at the examples below to understand the expected behavior.`,
  ],

  new MessagesPlaceholder('examples'),

  ['human', 'Extract person information from: {text}'],
]);

// Use with structured model
const modelWithExamples = model.withStructuredOutput(PersonSchema);

const extractionWithExamples = promptWithExamples.pipe(modelWithExamples);

const result = await extractionWithExamples.invoke({
  text: 'The new intern Sarah is 23 and studying computer science.',
  examples: createExampleMessages(),
});
```

### 10. Dynamic Example Selection

Select relevant examples based on input:

```typescript
class ExampleSelector {
  constructor(
    private examples: Array<{
      input: string;
      output: any;
      category: string;
    }>
  ) {}

  selectExamples(inputText: string, maxExamples: number = 3): any[] {
    // Simple keyword-based selection
    const inputWords = inputText.toLowerCase().split(/\s+/);

    const scored = this.examples.map((example) => {
      const exampleWords = example.input.toLowerCase().split(/\s+/);
      const commonWords = inputWords.filter((word) =>
        exampleWords.includes(word)
      );
      const score =
        commonWords.length / Math.max(inputWords.length, exampleWords.length);

      return { ...example, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxExamples)
      .map((ex) => this.formatExample(ex));
  }

  private formatExample(example: any) {
    return [
      new HumanMessage(example.input),
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: uuidv4(),
            name: 'extract_data',
            args: example.output,
          },
        ],
      }),
      new ToolMessage({
        content: 'Extraction completed.',
        tool_call_id: uuidv4(),
      }),
    ];
  }
}

// Usage
const exampleSelector = new ExampleSelector([
  {
    input: 'Dr. Smith is a 45-year-old surgeon.',
    output: { name: 'Dr. Smith', age: 45, profession: 'surgeon' },
    category: 'medical',
  },
  {
    input: 'Alice works as a software engineer at Google.',
    output: {
      name: 'Alice',
      profession: 'software engineer',
      company: 'Google',
    },
    category: 'tech',
  },
  // ... more examples
]);

const dynamicExtractionChain = async (text: string) => {
  const relevantExamples = exampleSelector.selectExamples(text);

  return await extractionWithExamples.invoke({
    text,
    examples: relevantExamples.flat(),
  });
};
```

## Error Handling and Recovery

### 11. Validation and Error Recovery

```typescript
import { z } from 'zod';

class ValidatedExtractor {
  constructor(
    private model: any,
    private schema: z.ZodSchema<any>,
    private maxRetries: number = 3
  ) {}

  async extract(text: string): Promise<{
    data: any | null;
    errors: string[];
    attempts: number;
  }> {
    const errors: string[] = [];

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.model.invoke({
          messages: [new HumanMessage(`Extract structured data from: ${text}`)],
        });

        // Validate the result
        const validated = this.schema.parse(result.structuredResponse);

        return {
          data: validated,
          errors: [],
          attempts: attempt,
        };
      } catch (error) {
        const errorMsg =
          error instanceof z.ZodError
            ? this.formatZodError(error)
            : error.message;

        errors.push(`Attempt ${attempt}: ${errorMsg}`);

        if (attempt === this.maxRetries) {
          return {
            data: null,
            errors,
            attempts: attempt,
          };
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private formatZodError(error: z.ZodError): string {
    return error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
  }
}

// Usage
const extractor = new ValidatedExtractor(extractionAgent, PersonSchema, 3);

const result = await extractor.extract('John is a 30-year-old engineer');
if (result.data) {
  console.log('Extracted:', result.data);
} else {
  console.log('Extraction failed:', result.errors);
}
```

### 12. Fallback Strategies

```typescript
class MultiStrategyExtractor {
  constructor(
    private strategies: Array<{
      name: string;
      extractor: (text: string) => Promise<any>;
      priority: number;
    }>
  ) {
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  async extract(text: string): Promise<{
    data: any;
    strategy: string;
    allAttempts: Array<{ strategy: string; success: boolean; error?: string }>;
  }> {
    const attempts: Array<{
      strategy: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const strategy of this.strategies) {
      try {
        const data = await strategy.extractor(text);
        attempts.push({ strategy: strategy.name, success: true });

        return {
          data,
          strategy: strategy.name,
          allAttempts: attempts,
        };
      } catch (error) {
        attempts.push({
          strategy: strategy.name,
          success: false,
          error: error.message,
        });
      }
    }

    throw new Error(
      `All extraction strategies failed: ${JSON.stringify(attempts)}`
    );
  }
}

// Define extraction strategies
const strategies = [
  {
    name: 'structured_output',
    extractor: async (text: string) => {
      const result = await structuredModel.invoke({
        messages: [new HumanMessage(`Extract data from: ${text}`)],
      });
      return result.structuredResponse;
    },
    priority: 3,
  },
  {
    name: 'function_calling',
    extractor: async (text: string) => {
      // Implementation using function calling
      return await functionCallingExtractor.extract(text);
    },
    priority: 2,
  },
  {
    name: 'json_parsing',
    extractor: async (text: string) => {
      // Implementation using JSON parsing
      return await jsonParsingExtractor.extract(text);
    },
    priority: 1,
  },
];

const multiExtractor = new MultiStrategyExtractor(strategies);
const result = await multiExtractor.extract('Complex text here...');
```

## Advanced Extraction Patterns

### 13. Hierarchical Extraction

Extract data at multiple levels of granularity:

```typescript
const DocumentSchema = z.object({
  metadata: z.object({
    title: z.string(),
    author: z.string().optional(),
    date: z.string().optional(),
    type: z.enum(['contract', 'invoice', 'report', 'email', 'other']),
  }),

  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
      entities: z.array(
        z.object({
          text: z.string(),
          type: z.enum(['person', 'organization', 'date', 'money', 'location']),
          confidence: z.number().min(0).max(1),
        })
      ),
      keyPoints: z.array(z.string()),
    })
  ),

  summary: z.object({
    overview: z.string(),
    actionItems: z.array(z.string()),
    decisions: z.array(z.string()),
    nextSteps: z.array(z.string()),
  }),
});

const hierarchicalExtractor = await createAgent({
  model: 'openai:gpt-4o', // Use more powerful model for complex extraction
  tools: [],
  responseFormat: DocumentSchema,
  systemPrompt: `You are an expert document analyzer.
  
  Extract information at multiple levels:
  1. Document metadata (title, author, type)
  2. Section-level content with entities
  3. Overall summary with actionable insights
  
  Be thorough but precise. Only extract information that is clearly present.`,
});
```

### 14. Conditional Extraction

Extract different schemas based on content type:

```typescript
const determineContentType = async (text: string): Promise<string> => {
  const typeDetector = await createAgent({
    model: 'openai:gpt-4o-mini',
    tools: [],
    responseFormat: z.object({
      contentType: z.enum([
        'resume',
        'job_posting',
        'email',
        'contract',
        'report',
      ]),
      confidence: z.number().min(0).max(1),
    }),
  });

  const result = await typeDetector.invoke({
    messages: [
      new HumanMessage(
        `Determine the content type of this text: ${text.substring(0, 500)}...`
      ),
    ],
  });

  return result.structuredResponse.contentType;
};

const schemaMap = {
  resume: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    skills: z.array(z.string()),
    experience: z.array(
      z.object({
        company: z.string(),
        position: z.string(),
        duration: z.string(),
        description: z.string(),
      })
    ),
    education: z.array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        year: z.number().optional(),
      })
    ),
  }),

  job_posting: z.object({
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    salary: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
        currency: z.string().default('USD'),
      })
      .optional(),
    requirements: z.array(z.string()),
    responsibilities: z.array(z.string()),
    benefits: z.array(z.string()).optional(),
  }),

  // ... other schemas
};

const conditionalExtractor = async (text: string) => {
  const contentType = await determineContentType(text);
  const schema = schemaMap[contentType];

  if (!schema) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const extractor = await createAgent({
    model: 'openai:gpt-4o-mini',
    tools: [],
    responseFormat: schema,
  });

  return await extractor.invoke({
    messages: [
      new HumanMessage(`Extract ${contentType} information from: ${text}`),
    ],
  });
};
```

### 15. Streaming Extraction

For large documents, extract data incrementally:

```typescript
class StreamingExtractor {
  constructor(
    private chunkSize: number = 2000,
    private overlap: number = 200
  ) {}

  async extractFromLargeText(text: string, schema: z.ZodSchema<any>) {
    const chunks = this.chunkText(text);
    const results: any[] = [];

    const extractor = await createAgent({
      model: 'openai:gpt-4o-mini',
      tools: [],
      responseFormat: z.object({
        entities: z.array(schema),
        chunkSummary: z.string(),
      }),
    });

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      const result = await extractor.invoke({
        messages: [
          new HumanMessage(`
          Extract structured data from this text chunk (${i + 1}/${chunks.length}):
          
          ${chunks[i]}
          
          Focus on entities and provide a brief summary of this chunk.
        `),
        ],
      });

      results.push({
        chunkIndex: i,
        ...result.structuredResponse,
      });
    }

    return this.mergeResults(results);
  }

  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - this.overlap;
    }

    return chunks;
  }

  private mergeResults(results: any[]): any {
    // Merge entities and combine summaries
    const allEntities = results.flatMap((r) => r.entities);
    const combinedSummary = results.map((r) => r.chunkSummary).join(' ');

    return {
      entities: this.deduplicateEntities(allEntities),
      fullSummary: combinedSummary,
      chunkCount: results.length,
    };
  }

  private deduplicateEntities(entities: any[]): any[] {
    // Simple deduplication based on key fields
    const seen = new Set();
    return entities.filter((entity) => {
      const key = JSON.stringify(entity);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Usage
const streamingExtractor = new StreamingExtractor();
const largeDocumentResult = await streamingExtractor.extractFromLargeText(
  largeText,
  PersonSchema
);
```

## Performance Optimization

### 16. Batch Processing

```typescript
class BatchExtractor {
  constructor(
    private batchSize: number = 10,
    private concurrency: number = 3
  ) {}

  async extractBatch(
    texts: string[],
    schema: z.ZodSchema<any>
  ): Promise<{
    results: Array<{ text: string; data: any; success: boolean }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const batches = this.createBatches(texts);
    const allResults: any[] = [];

    // Process batches with concurrency control
    for (const batch of batches) {
      const batchPromises = batch.map(async (text, index) => {
        try {
          const extractor = await createAgent({
            model: 'openai:gpt-4o-mini',
            tools: [],
            responseFormat: schema,
          });

          const result = await extractor.invoke({
            messages: [new HumanMessage(`Extract data from: ${text}`)],
          });

          return {
            text,
            data: result.structuredResponse,
            success: true,
          };
        } catch (error) {
          return {
            text,
            data: null,
            success: false,
            error: error.message,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      allResults.push(...batchResults);
    }

    return {
      results: allResults,
      summary: {
        total: allResults.length,
        successful: allResults.filter((r) => r.success).length,
        failed: allResults.filter((r) => !r.success).length,
      },
    };
  }

  private createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }
    return batches;
  }
}

// Usage
const batchExtractor = new BatchExtractor(5, 3);
const texts = [
  /* array of texts to process */
];
const batchResults = await batchExtractor.extractBatch(texts, PersonSchema);
```

### 17. Caching and Memoization

```typescript
class CachedExtractor {
  private cache = new Map<string, any>();

  constructor(
    private baseExtractor: any,
    private ttl: number = 3600000
  ) {} // 1 hour TTL

  async extract(text: string): Promise<any> {
    const key = this.generateKey(text);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await this.baseExtractor.extract(text);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  private generateKey(text: string): string {
    // Simple hash function for caching
    return Buffer.from(text).toString('base64').slice(0, 32);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number } {
    // Implementation for cache statistics
    return { size: this.cache.size, hitRate: 0.85 }; // placeholder
  }
}
```

## Production Use Cases

### 18. Invoice Processing System

```typescript
const InvoiceProcessingSystem = {
  // Define comprehensive invoice schema
  schema: z.object({
    header: z.object({
      invoiceNumber: z.string(),
      date: z.string().describe('Invoice date in YYYY-MM-DD format'),
      dueDate: z.string().optional().describe('Due date in YYYY-MM-DD format'),
      type: z.enum(['standard', 'credit_note', 'debit_note', 'proforma']),
    }),

    vendor: z.object({
      name: z.string(),
      address: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      taxId: z.string().optional(),
    }),

    client: z.object({
      name: z.string(),
      address: z.string().optional(),
      email: z.string().email().optional(),
      purchaseOrder: z.string().optional(),
    }),

    lineItems: z.array(
      z.object({
        description: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number(),
        total: z.number(),
        taxRate: z.number().optional(),
        category: z.string().optional(),
      })
    ),

    totals: z.object({
      subtotal: z.number(),
      tax: z.number().optional(),
      total: z.number(),
      currency: z.string().default('USD'),
    }),

    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
  }),

  async processInvoice(invoiceText: string) {
    const processor = await createAgent({
      model: 'openai:gpt-4o',
      tools: [],
      responseFormat: this.schema,
      systemPrompt: `You are an expert invoice processing system.
      
      Extract all invoice information accurately:
      - Parse dates in YYYY-MM-DD format
      - Calculate totals correctly
      - Identify vendor and client information
      - Extract all line items with quantities and prices
      
      Be precise with numbers and dates. If information is unclear, mark as optional.`,
    });

    const result = await processor.invoke({
      messages: [new HumanMessage(`Process this invoice:\n\n${invoiceText}`)],
    });

    // Validate business rules
    return this.validateInvoice(result.structuredResponse);
  },

  validateInvoice(invoice: any) {
    const errors: string[] = [];

    // Validate total calculation
    const calculatedSubtotal = invoice.lineItems.reduce(
      (sum, item) => sum + item.total,
      0
    );
    if (Math.abs(calculatedSubtotal - invoice.totals.subtotal) > 0.01) {
      errors.push('Subtotal calculation mismatch');
    }

    // Validate dates
    if (
      invoice.header.dueDate &&
      invoice.header.dueDate < invoice.header.date
    ) {
      errors.push('Due date cannot be before invoice date');
    }

    return {
      invoice,
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Usage
const invoiceResult = await InvoiceProcessingSystem.processInvoice(invoiceText);
if (invoiceResult.isValid) {
  console.log('Invoice processed successfully:', invoiceResult.invoice);
} else {
  console.log('Validation errors:', invoiceResult.errors);
}
```

### 19. Resume Parser

```typescript
const ResumeParser = {
  schema: z.object({
    personalInfo: z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      website: z.string().url().optional(),
    }),

    summary: z.string().optional(),

    experience: z.array(
      z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string().describe('Start date in YYYY-MM format'),
        endDate: z
          .string()
          .optional()
          .describe("End date in YYYY-MM format or 'Present'"),
        location: z.string().optional(),
        description: z.string(),
        achievements: z.array(z.string()).optional(),
      })
    ),

    education: z.array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string().optional(),
        graduationDate: z
          .string()
          .optional()
          .describe('Graduation date in YYYY-MM format'),
        gpa: z.number().optional(),
        honors: z.array(z.string()).optional(),
      })
    ),

    skills: z.object({
      technical: z.array(z.string()).optional(),
      languages: z
        .array(
          z.object({
            language: z.string(),
            proficiency: z.enum([
              'native',
              'fluent',
              'conversational',
              'basic',
            ]),
          })
        )
        .optional(),
      certifications: z
        .array(
          z.object({
            name: z.string(),
            issuer: z.string().optional(),
            date: z.string().optional(),
          })
        )
        .optional(),
    }),

    projects: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
          technologies: z.array(z.string()).optional(),
          url: z.string().url().optional(),
        })
      )
      .optional(),
  }),

  async parseResume(resumeText: string) {
    const parser = await createAgent({
      model: 'openai:gpt-4o',
      tools: [],
      responseFormat: this.schema,
      systemPrompt: `You are an expert resume parser.
      
      Extract information accurately:
      - Parse dates consistently (YYYY-MM format)
      - Identify skills from context, not just explicit lists
      - Separate achievements from job descriptions
      - Categorize skills appropriately
      
      Be thorough but only extract information that is clearly present.`,
    });

    const result = await parser.invoke({
      messages: [new HumanMessage(`Parse this resume:\n\n${resumeText}`)],
    });

    return this.enrichResumeData(result.structuredResponse);
  },

  enrichResumeData(resume: any) {
    // Calculate experience summary
    const totalExperience = this.calculateExperience(resume.experience);

    // Extract skill categories
    const skillAnalysis = this.analyzeSkills(resume.skills.technical || []);

    return {
      ...resume,
      metadata: {
        totalExperience,
        skillAnalysis,
        completenessScore: this.calculateCompleteness(resume),
      },
    };
  },

  calculateExperience(experiences: any[]): string {
    // Implementation to calculate total years of experience
    let totalMonths = 0;

    experiences.forEach((exp) => {
      const start = new Date(exp.startDate + '-01');
      const end =
        exp.endDate === 'Present' ? new Date() : new Date(exp.endDate + '-01');
      totalMonths +=
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
    });

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    return `${years} years${months > 0 ? `, ${months} months` : ''}`;
  },

  analyzeSkills(skills: string[]) {
    // Categorize skills
    const categories = {
      programming: ['javascript', 'python', 'java', 'c++', 'c#'],
      frameworks: ['react', 'vue', 'angular', 'django', 'flask'],
      databases: ['mysql', 'postgresql', 'mongodb', 'redis'],
      cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes'],
    };

    const result = {};
    for (const [category, keywords] of Object.entries(categories)) {
      result[category] = skills.filter((skill) =>
        keywords.some((keyword) => skill.toLowerCase().includes(keyword))
      );
    }

    return result;
  },

  calculateCompleteness(resume: any): number {
    const requiredFields = [
      'personalInfo.name',
      'personalInfo.email',
      'experience',
      'education',
      'skills',
    ];

    const presentFields = requiredFields.filter((field) => {
      const value = this.getNestedValue(resume, field);
      return value && (Array.isArray(value) ? value.length > 0 : true);
    });

    return Math.round((presentFields.length / requiredFields.length) * 100);
  },

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  },
};

// Usage
const resumeData = await ResumeParser.parseResume(resumeText);
console.log('Parsed resume:', resumeData);
console.log('Experience:', resumeData.metadata.totalExperience);
console.log('Completeness:', resumeData.metadata.completenessScore + '%');
```

## Testing and Validation

### 20. Extraction Quality Testing

```typescript
import { describe, test, expect } from '@jest/globals';

describe('Structured Data Extraction', () => {
  const testCases = [
    {
      name: 'Complete person information',
      input:
        'Dr. Sarah Johnson, 35, is a cardiologist at Mayo Clinic. Contact: sarah.j@email.com',
      expected: {
        name: 'Dr. Sarah Johnson',
        age: 35,
        profession: 'cardiologist',
        email: 'sarah.j@email.com',
        workplace: 'Mayo Clinic',
      },
    },
    {
      name: 'Partial information',
      input: 'John works in marketing but prefers not to share his age.',
      expected: {
        name: 'John',
        profession: 'marketing',
        // age should not be present
      },
    },
    {
      name: 'No relevant information',
      input: 'The weather is sunny today with temperatures reaching 80°F.',
      expected: {},
    },
  ];

  test.each(testCases)('$name', async ({ input, expected }) => {
    const result = await extractionAgent.invoke({
      messages: [new HumanMessage(`Extract person info: ${input}`)],
    });

    const extracted = result.structuredResponse;

    // Check that all expected fields are present
    for (const [key, value] of Object.entries(expected)) {
      expect(extracted[key]).toBe(value);
    }

    // Check that no unexpected fields are present
    for (const key of Object.keys(extracted)) {
      if (!(key in expected)) {
        expect(extracted[key]).toBeUndefined();
      }
    }
  });

  test('Schema validation', async () => {
    const invalidData = { name: 123, age: 'thirty' }; // Invalid types

    expect(() => PersonSchema.parse(invalidData)).toThrow();
  });

  test('Error handling', async () => {
    const extractor = new ValidatedExtractor(extractionAgent, PersonSchema, 2);

    // Test with problematic input
    const result = await extractor.extract('Garbled text #@$%^&*()');

    if (!result.data) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.attempts).toBeLessThanOrEqual(2);
    }
  });
});
```

### 21. Performance Benchmarking

```typescript
class ExtractionBenchmark {
  async runBenchmark(testData: Array<{ text: string; expected: any }>) {
    const results = {
      accuracy: 0,
      averageLatency: 0,
      totalCost: 0,
      errors: [],
    };

    const startTime = Date.now();
    let correct = 0;
    let totalTokens = 0;

    for (const testCase of testData) {
      try {
        const caseStartTime = Date.now();

        const result = await extractionAgent.invoke({
          messages: [new HumanMessage(`Extract data: ${testCase.text}`)],
        });

        const latency = Date.now() - caseStartTime;
        const isCorrect = this.compareResults(
          result.structuredResponse,
          testCase.expected
        );

        if (isCorrect) correct++;

        // Track token usage if available
        if (result.usage) {
          totalTokens += result.usage.total_tokens;
        }
      } catch (error) {
        results.errors.push({
          input: testCase.text,
          error: error.message,
        });
      }
    }

    results.accuracy = correct / testData.length;
    results.averageLatency = (Date.now() - startTime) / testData.length;
    results.totalCost = this.estimateCost(totalTokens);

    return results;
  }

  private compareResults(actual: any, expected: any): boolean {
    // Implement semantic comparison logic
    const actualKeys = Object.keys(actual).filter((k) => actual[k] != null);
    const expectedKeys = Object.keys(expected);

    const keyMatch =
      actualKeys.length === expectedKeys.length &&
      actualKeys.every((key) => expectedKeys.includes(key));

    const valueMatch = expectedKeys.every((key) =>
      this.compareValues(actual[key], expected[key])
    );

    return keyMatch && valueMatch;
  }

  private compareValues(actual: any, expected: any): boolean {
    if (typeof actual !== typeof expected) return false;

    if (typeof actual === 'string') {
      return actual.toLowerCase().trim() === expected.toLowerCase().trim();
    }

    return actual === expected;
  }

  private estimateCost(tokens: number): number {
    // Rough cost estimation (adjust based on model pricing)
    const costPerToken = 0.00002; // $0.02 per 1K tokens
    return tokens * costPerToken;
  }
}

// Usage
const benchmark = new ExtractionBenchmark();
const testData = [
  /* your test cases */
];
const benchmarkResults = await benchmark.runBenchmark(testData);

console.log(`Accuracy: ${(benchmarkResults.accuracy * 100).toFixed(1)}%`);
console.log(`Average Latency: ${benchmarkResults.averageLatency}ms`);
console.log(`Estimated Cost: $${benchmarkResults.totalCost.toFixed(4)}`);
```

## Debug and Troubleshooting

### 22. Debug Logging for Extraction

```typescript
// Enable debug logging
process.env.DEBUG = 'langchain:*';

// Debug configuration for extraction
const debugExtractionAgent = await createAgent({
  model: 'openai:gpt-4o-mini',
  tools: [],
  responseFormat: PersonSchema,
  debug: {
    level: 'verbose',
    logPrompts: true,
    logResponses: true,
    logValidation: true,
  },
});

// Test extraction with debug info
const debugTest = async (text: string) => {
  console.log('=== DEBUG EXTRACTION TEST ===');
  console.log('Input text:', text);
  console.log('Schema:', PersonSchema._def);

  try {
    const result = await debugExtractionAgent.invoke({
      messages: [new HumanMessage(`Extract: ${text}`)],
    });

    console.log('Raw response:', result);
    console.log('Structured response:', result.structuredResponse);
    console.log('Validation successful');
  } catch (error) {
    console.error('Extraction failed:', error.message);

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
    }
  }

  console.log('=== END DEBUG TEST ===');
};

// Debug common issues
await debugTest('John Smith is 30'); // Should work
await debugTest('The weather is nice'); // Should return empty/null
await debugTest('Dr. Jane Doe, age unknown'); // Test optional fields
```

### 23. Common Issues and Solutions

```typescript
const TroubleshootingGuide = {
  // Issue: Model returns null/empty results
  async diagnosePoorExtraction(text: string, schema: z.ZodSchema<any>) {
    console.log('=== EXTRACTION DIAGNOSIS ===');

    // Check if text contains relevant information
    const contentAnalyzer = await createAgent({
      model: 'openai:gpt-4o-mini',
      tools: [],
      responseFormat: z.object({
        hasRelevantInfo: z.boolean(),
        detectedEntities: z.array(z.string()),
        confidence: z.number().min(0).max(1),
      }),
    });

    const analysis = await contentAnalyzer.invoke({
      messages: [
        new HumanMessage(
          `Analyze if this text contains extractable information: ${text}`
        ),
      ],
    });

    console.log('Content analysis:', analysis.structuredResponse);

    // Test with more explicit prompt
    const explicitExtractor = await createAgent({
      model: 'openai:gpt-4o-mini',
      tools: [],
      responseFormat: schema,
      systemPrompt: `You are an expert data extractor. 
      IMPORTANT: Only extract information that is explicitly mentioned.
      If no relevant information exists, return an empty object or null values.
      Do not guess or infer information that isn't clearly stated.`,
    });

    const result = await explicitExtractor.invoke({
      messages: [
        new HumanMessage(
          `Extract structured data from this text. Be precise and only extract what is clearly mentioned: ${text}`
        ),
      ],
    });

    console.log('Explicit extraction result:', result.structuredResponse);

    return {
      contentAnalysis: analysis.structuredResponse,
      extractionResult: result.structuredResponse,
    };
  },

  // Issue: Validation errors
  async diagnoseValidationErrors(text: string, schema: z.ZodSchema<any>) {
    try {
      // Test with relaxed validation
      const relaxedSchema = this.makeSchemaOptional(schema);

      const relaxedExtractor = await createAgent({
        model: 'openai:gpt-4o-mini',
        tools: [],
        responseFormat: relaxedSchema,
      });

      const result = await relaxedExtractor.invoke({
        messages: [new HumanMessage(`Extract: ${text}`)],
      });

      console.log('Relaxed schema result:', result.structuredResponse);

      // Now try to validate with original schema
      const validated = schema.parse(result.structuredResponse);
      console.log('Original schema validation successful');
    } catch (error) {
      console.error('Schema validation failed:', error.message);

      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          console.error(`Field: ${err.path.join('.')}, Issue: ${err.message}`);
        });
      }
    }
  },

  makeSchemaOptional(schema: z.ZodSchema<any>): z.ZodSchema<any> {
    // Convert all fields to optional for testing
    if (schema instanceof z.ZodObject) {
      const shape = {};
      for (const [key, fieldSchema] of Object.entries(schema.shape)) {
        shape[key] = z.optional(fieldSchema);
      }
      return z.object(shape);
    }
    return schema;
  },

  // Issue: Inconsistent results
  async testConsistency(text: string, iterations: number = 5) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const result = await extractionAgent.invoke({
        messages: [new HumanMessage(`Extract: ${text}`)],
      });
      results.push(result.structuredResponse);
    }

    // Analyze consistency
    const consistency = this.analyzeConsistency(results);
    console.log('Consistency analysis:', consistency);

    return results;
  },

  analyzeConsistency(results: any[]): any {
    const fieldConsistency = {};

    // Get all possible fields
    const allFields = new Set();
    results.forEach((result) => {
      Object.keys(result || {}).forEach((key) => allFields.add(key));
    });

    // Check consistency for each field
    allFields.forEach((field) => {
      const values = results.map((r) => r?.[field]);
      const uniqueValues = new Set(values.filter((v) => v != null));

      fieldConsistency[field] = {
        presentCount: values.filter((v) => v != null).length,
        uniqueValueCount: uniqueValues.size,
        consistency: uniqueValues.size <= 1 ? 'high' : 'low',
      };
    });

    return fieldConsistency;
  },
};

// Usage
await TroubleshootingGuide.diagnosePoorExtraction(
  'Some problematic text here',
  PersonSchema
);
```

This comprehensive guide covers all aspects of structured data extraction with LangChain.js 1.0, from basic schemas to production-ready systems with error handling, performance optimization, and debugging capabilities. The examples are practical and immediately usable for real-world applications.

Key takeaways:

- Use `createAgent` with `responseFormat` for the simplest approach
- Define schemas carefully with optional fields to prevent hallucination
- Implement reference examples to improve extraction quality
- Add validation and error recovery for production systems
- Use performance optimization techniques for large-scale processing
- Include comprehensive testing and debugging capabilities

This guide provides everything needed to build robust structured data extraction systems with LangChain.js 1.0.
