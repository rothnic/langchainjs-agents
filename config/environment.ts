import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

// Environment schema validation
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  OPENAI_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  LANGCHAIN_API_KEY: z.string().optional(),
  LANGCHAIN_TRACING_V2: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  USE_REAL_APIS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  LLM_PROVIDER: z
    .enum(['openai', 'github-models'])
    .default('github-models'),
});

export type Environment = z.infer<typeof envSchema>;

// Validate and export environment configuration
export const env = envSchema.parse(process.env);

// Configuration for different environments
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  useRealApis: env.USE_REAL_APIS,
  llmProvider: env.LLM_PROVIDER,
  langchain: {
    apiKey: env.LANGCHAIN_API_KEY,
    tracingEnabled: env.LANGCHAIN_TRACING_V2,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },
  github: {
    token: env.GITHUB_TOKEN,
    modelsBaseUrl: 'https://models.inference.ai.azure.com',
  },
} as const;
