#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CLI tool for scaffolding new agents and tests
 */
class AgentScaffolder {
  constructor() {
    this.templatesDir = path.join(__dirname, 'templates');
    this.projectRoot = path.join(__dirname, '..');
  }

  async scaffoldAgent(name, type = 'basic') {
    console.log(`🚀 Scaffolding new agent: ${name} (type: ${type})`);

    const agentDir = path.join(this.projectRoot, 'agents', name);

    try {
      // Check if agent already exists
      await fs.access(agentDir);
      throw new Error(`Agent '${name}' already exists at ${agentDir}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create agent directory structure
    await fs.mkdir(agentDir, { recursive: true });
    await fs.mkdir(path.join(agentDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(agentDir, 'tests'), { recursive: true });

    // Copy template files
    const templateDir = path.join(this.templatesDir, type);
    await this.copyTemplate(templateDir, agentDir, { name, type });

    console.log(`✅ Agent '${name}' scaffolded successfully!`);
    console.log(`📁 Location: ${agentDir}`);
    console.log(`🏃 Next steps:`);
    console.log(`   1. cd agents/${name}`);
    console.log(`   2. Edit src/agent.ts to implement your logic`);
    console.log(`   3. Update tests/agent.test.ts with your test cases`);
    console.log(`   4. Run tests: npm test agents/${name}`);
  }

  async copyTemplate(templateDir, targetDir, variables) {
    try {
      const entries = await fs.readdir(templateDir, { withFileTypes: true });

      for (const entry of entries) {
        const sourcePath = path.join(templateDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
          await fs.mkdir(targetPath, { recursive: true });
          await this.copyTemplate(sourcePath, targetPath, variables);
        } else {
          const content = await fs.readFile(sourcePath, 'utf-8');
          const processedContent = this.processTemplate(content, variables);
          await fs.writeFile(targetPath, processedContent);
        }
      }
    } catch (error) {
      // Template directory doesn't exist, use default template
      if (error.code === 'ENOENT') {
        await this.createDefaultTemplate(targetDir, variables);
      } else {
        throw error;
      }
    }
  }

  processTemplate(content, variables) {
    let processed = content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    }

    return processed;
  }

  async createDefaultTemplate(targetDir, variables) {
    const { name, type } = variables;

    // Create README.md
    const readmeContent = `# ${name} Agent

A ${type} agent built with LangChainJS.

## Description

TODO: Add description of what this agent does.

## Usage

\`\`\`typescript
import { ${this.pascalCase(name)}Agent } from './src/agent.js';

const agent = new ${this.pascalCase(name)}Agent();
const result = await agent.execute(input);
\`\`\`

## Configuration

TODO: Document configuration options.

## Testing

\`\`\`bash
npm test agents/${name}
\`\`\`

## TODO

- [ ] Implement core agent logic
- [ ] Add comprehensive tests
- [ ] Document API
- [ ] Add usage examples
`;

    // Create agent.ts
    const agentContent = `import { BaseAgent } from '../../../src/base-agent.js';

/**
 * ${this.pascalCase(name)} Agent
 * 
 * TODO: Add description of agent functionality
 */
export class ${this.pascalCase(name)}Agent extends BaseAgent {
  constructor() {
    super('${name}');
  }

  /**
   * Execute the agent's main functionality
   */
  async execute(input: any): Promise<any> {
    // TODO: Implement agent logic
    throw new Error('Not implemented: ${this.pascalCase(name)}Agent.execute()');
  }

  /**
   * Validate input parameters
   */
  protected validateInput(input: any): void {
    // TODO: Add input validation
    if (!input) {
      throw new Error('Input is required');
    }
  }

  /**
   * Process and format output
   */
  protected formatOutput(output: any): any {
    // TODO: Add output formatting
    return output;
  }
}`;

    // Create test file
    const testContent = `import { describe, it, expect, beforeEach } from 'vitest';
import { ${this.pascalCase(name)}Agent } from '../src/agent.js';

describe('${this.pascalCase(name)}Agent', () => {
  let agent: ${this.pascalCase(name)}Agent;

  beforeEach(() => {
    agent = new ${this.pascalCase(name)}Agent();
  });

  describe('constructor', () => {
    it('should initialize agent correctly', () => {
      expect(agent).toBeInstanceOf(${this.pascalCase(name)}Agent);
    });
  });

  describe('execute', () => {
    it('should throw not implemented error', async () => {
      await expect(agent.execute({})).rejects.toThrow('Not implemented');
    });

    // TODO: Add more test cases
    it.todo('should handle valid input');
    it.todo('should validate input parameters');
    it.todo('should format output correctly');
    it.todo('should handle errors gracefully');
  });
});`;

    // Write files
    await fs.writeFile(path.join(targetDir, 'README.md'), readmeContent);
    await fs.writeFile(path.join(targetDir, 'src', 'agent.ts'), agentContent);
    await fs.writeFile(
      path.join(targetDir, 'tests', 'agent.test.ts'),
      testContent
    );
  }

  pascalCase(str) {
    return str
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  async listAgents() {
    const agentsDir = path.join(this.projectRoot, 'agents');

    try {
      const entries = await fs.readdir(agentsDir, { withFileTypes: true });
      const agents = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      if (agents.length === 0) {
        console.log(
          '📭 No agents found. Create one with: npm run scaffold -- --name=my-agent'
        );
        return;
      }

      console.log('🤖 Available agents:');
      for (const agent of agents) {
        const agentPath = path.join(agentsDir, agent);
        const readmePath = path.join(agentPath, 'README.md');

        try {
          const readme = await fs.readFile(readmePath, 'utf-8');
          const description = this.extractDescription(readme);
          console.log(`  📦 ${agent}: ${description}`);
        } catch {
          console.log(`  📦 ${agent}: No description available`);
        }
      }
    } catch (error) {
      console.log(
        '📁 Agents directory not found. Create your first agent with: npm run scaffold -- --name=my-agent'
      );
    }
  }

  extractDescription(readme) {
    const lines = readme.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('TODO')) {
        return line.substring(0, 80) + (line.length > 80 ? '...' : '');
      }
    }
    return 'No description available';
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const scaffolder = new AgentScaffolder();

  // Parse arguments
  const options = {
    name: '',
    type: 'basic',
    list: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--name' && args[i + 1]) {
      options.name = args[i + 1];
      i++;
    } else if (arg === '--type' && args[i + 1]) {
      options.type = args[i + 1];
      i++;
    } else if (arg === '--list') {
      options.list = true;
    } else if (arg.startsWith('--name=')) {
      options.name = arg.split('=')[1];
    } else if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1];
    }
  }

  try {
    if (options.list) {
      await scaffolder.listAgents();
    } else if (options.name) {
      await scaffolder.scaffoldAgent(options.name, options.type);
    } else {
      console.log('🤖 LangChainJS Agent Scaffolder');
      console.log('');
      console.log('Usage:');
      console.log(
        '  npm run scaffold -- --name=my-agent [--type=basic|scraping|api]'
      );
      console.log('  npm run scaffold -- --list');
      console.log('');
      console.log('Examples:');
      console.log('  npm run scaffold -- --name=data-processor --type=api');
      console.log('  npm run scaffold -- --name=web-crawler --type=scraping');
      console.log('  npm run scaffold -- --list');
      console.log('');
      console.log('Types:');
      console.log('  basic    - Basic agent template');
      console.log('  scraping - Web scraping agent template');
      console.log('  api      - API integration agent template');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { AgentScaffolder };
