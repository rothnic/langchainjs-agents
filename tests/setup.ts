import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Cleanup after all tests
});

beforeEach(async () => {
  // Setup before each test
});

afterEach(async () => {
  // Cleanup after each test
});
