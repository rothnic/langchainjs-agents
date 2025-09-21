import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';

// Polyfill for File in Node.js test environments
// @ts-ignore
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File extends Blob {
    name: string;
    lastModified: number;
    
    constructor(parts: any[], filename: string, options: any = {}) {
      super(parts, options);
      this.name = filename;
      this.lastModified = options.lastModified || Date.now();
    }
  } as any;
}

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
