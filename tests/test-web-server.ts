import { createServer, Server } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test web server for serving static HTML files for scraping tests
 */
export class TestWebServer {
  private server: Server | null = null;
  private port: number;
  private baseUrl: string;

  constructor(port: number = 0) {
    this.port = port;
    this.baseUrl = '';
  }

  /**
   * Start the test server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        try {
          await this.handleRequest(req, res);
        } catch (error) {
          console.error('Server error:', error);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });

      this.server.listen(this.port, () => {
        const address = this.server!.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          this.baseUrl = `http://localhost:${this.port}`;
          resolve();
        } else {
          reject(new Error('Failed to start server'));
        }
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Stop the test server
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.server = null;
          resolve();
        });
      });
    }
  }

  /**
   * Get the base URL of the server
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get URL for a specific test page
   */
  getPageUrl(pageName: string): string {
    return `${this.baseUrl}/${pageName}`;
  }

  /**
   * Handle incoming requests
   */
  private async handleRequest(req: any, res: any): Promise<void> {
    const url = req.url;

    // Route different test pages
    if (url === '/blog-post' || url === '/blog-post.html') {
      await this.serveFile(res, 'blog-post.html');
    } else if (url === '/ecommerce' || url === '/ecommerce.html') {
      await this.serveFile(res, 'ecommerce-catalog.html');
    } else if (url === '/simple' || url === '/simple.html') {
      await this.serveFile(res, 'simple-page.html');
    } else if (url === '/delay') {
      // Test page with artificial delay
      setTimeout(() => {
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><body><h1>Delayed Response</h1></body></html>');
      }, 2000);
      return;
    } else if (url === '/error') {
      // Test page that returns an error
      res.statusCode = 500;
      res.end('Test Error Page');
      return;
    } else {
      // Default to simple page
      await this.serveFile(res, 'simple-page.html');
    }
  }

  /**
   * Serve a static file from the fixtures directory
   */
  private async serveFile(res: any, filename: string): Promise<void> {
    try {
      const filePath = join(__dirname, 'fixtures', 'web-pages', filename);
      const content = await readFile(filePath, 'utf-8');

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.statusCode = 200;
      res.end(content);
    } catch (error) {
      res.statusCode = 404;
      res.end('Page not found');
    }
  }
}

/**
 * Global test server instance for sharing across tests
 */
let globalTestServer: TestWebServer | null = null;

/**
 * Get or create a global test server instance
 */
export async function getTestServer(): Promise<TestWebServer> {
  if (!globalTestServer) {
    globalTestServer = new TestWebServer();
    await globalTestServer.start();
  }
  return globalTestServer;
}

/**
 * Clean up global test server
 */
export async function cleanupTestServer(): Promise<void> {
  if (globalTestServer) {
    await globalTestServer.stop();
    globalTestServer = null;
  }
}
