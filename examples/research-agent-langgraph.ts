/**
 * Example: Research Agent using LangGraph (LangChain 1.0)
 *
 * This example demonstrates when to use LangGraph instead of simple LLM invocation.
 * Use this pattern for complex workflows with:
 * - Multiple decision points
 * - Tool calling with dynamic paths
 * - State management across steps
 * - Parallel processing needs
 *
 * NOTE: This is an EXAMPLE ONLY - not currently used in the main application.
 * The structured scraping agent uses simpler patterns appropriate for its linear workflow.
 */

import { StateGraph, Annotation } from '@langchain/langgraph';
import { ToolNode, tool } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { LLMFactory } from '../config/llm-factory.js';

// Define research state schema
const ResearchState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (current, update) => current.concat(update),
  }),
  query: Annotation<string>({
    reducer: (current, update) => update || current,
  }),
  urls: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
  }),
  findings: Annotation<any[]>({
    reducer: (current, update) => [...current, ...update],
  }),
  next: Annotation<string>({
    reducer: (current, update) => update || current,
  }),
});

// Define tools for the research agent
const searchTool = tool(
  async ({ query }: { query: string }) => {
    // Simulate web search - replace with actual search API
    const mockResults = [
      `https://example.com/article1?q=${encodeURIComponent(query)}`,
      `https://example.com/article2?q=${encodeURIComponent(query)}`,
      `https://example.com/article3?q=${encodeURIComponent(query)}`,
    ];
    return JSON.stringify({ urls: mockResults });
  },
  {
    name: 'search_web',
    description: 'Search the web for information about a topic',
    schema: z.object({
      query: z.string().describe('The search query'),
    }),
  }
);

const scrapeTool = tool(
  async ({ url }: { url: string }) => {
    // Use the existing structured scraping agent
    // const agent = new StructuredScrapingAgent();
    // const result = await agent.scrape(url);

    // Simplified mock for this example
    return JSON.stringify({
      title: `Article from ${url}`,
      content: 'Mock article content with relevant information...',
      summary: 'This article discusses the research topic in detail.',
    });
  },
  {
    name: 'scrape_webpage',
    description: 'Scrape and analyze content from a webpage',
    schema: z.object({
      url: z.string().url().describe('The URL to scrape'),
    }),
  }
);

const analyzeTool = tool(
  async ({ _findings }: { _findings: unknown[] }) => {
    // Simulate analysis - in practice, this would use an LLM to synthesize findings
    const analysis = {
      summary: 'Based on the research, key findings include...',
      insights: ['Insight 1', 'Insight 2', 'Insight 3'],
      confidence: 0.85,
    };
    return JSON.stringify(analysis);
  },
  {
    name: 'analyze_findings',
    description: 'Analyze and synthesize research findings',
    schema: z.object({
      findings: z
        .array(z.any())
        .describe('Array of research findings to analyze'),
    }),
  }
);

/**
 * LangGraph-based Research Agent
 *
 * Demonstrates complex workflow patterns suitable for LangGraph:
 * 1. Planning: Determine research strategy
 * 2. Searching: Find relevant URLs
 * 3. Scraping: Extract content from multiple sources
 * 4. Analysis: Synthesize findings
 * 5. Decision: Determine if more research is needed
 */
export class ResearchAgent {
  private graph: any;
  private llm: ChatOpenAI;

  constructor() {
    this.llm = LLMFactory.createLLM({
      model: 'openai/gpt-4o-mini',
      temperature: 0.1,
    });

    this.graph = this.buildGraph();
  }

  private buildGraph() {
    const tools = [searchTool, scrapeTool, analyzeTool];
    const model = this.llm.bindTools(tools);
    const toolNode = new ToolNode(tools);

    // Planning node - decides research strategy
    const planningNode = async (state: typeof ResearchState.State) => {
      const prompt = `You are a research planner. Given the query "${state.query}", 
      decide what search terms to use and create a research plan.
      
      Call the search_web tool with appropriate search queries.`;

      const response = await model.invoke([
        { role: 'system', content: prompt },
        { role: 'user', content: state.query },
      ]);

      return {
        messages: [response],
        next: this.shouldCallTools(response) ? 'tools' : 'scraping',
      };
    };

    // Scraping coordinator - manages parallel scraping
    const scrapingNode = async (state: typeof ResearchState.State) => {
      if (state.urls.length === 0) {
        return { next: 'analysis' };
      }

      const prompt = `You have found these URLs: ${state.urls.join(', ')}
      
      Scrape the most relevant ones using the scrape_webpage tool.
      Focus on quality over quantity - select 2-3 most promising URLs.`;

      const response = await model.invoke([
        { role: 'system', content: prompt },
        { role: 'user', content: `Research query: ${state.query}` },
      ]);

      return {
        messages: [response],
        next: this.shouldCallTools(response) ? 'tools' : 'analysis',
      };
    };

    // Analysis node - synthesizes findings
    const analysisNode = async (state: typeof ResearchState.State) => {
      const prompt = `Analyze the research findings and provide a comprehensive summary.
      
      Use the analyze_findings tool to synthesize the information.`;

      const response = await model.invoke([
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `Findings: ${JSON.stringify(state.findings)}`,
        },
      ]);

      return {
        messages: [response],
        next: this.shouldCallTools(response) ? 'tools' : '__end__',
      };
    };

    // Build the graph workflow
    const workflow = new StateGraph(ResearchState)
      .addNode('planning', planningNode)
      .addNode('tools', toolNode)
      .addNode('scraping', scrapingNode)
      .addNode('analysis', analysisNode)
      .addEdge('__start__', 'planning')
      .addConditionalEdges(
        'planning',
        (state: typeof ResearchState.State) => state.next,
        {
          tools: 'tools',
          scraping: 'scraping',
          analysis: 'analysis',
        }
      )
      .addConditionalEdges(
        'scraping',
        (state: typeof ResearchState.State) => state.next,
        {
          tools: 'tools',
          analysis: 'analysis',
        }
      )
      .addConditionalEdges(
        'analysis',
        (state: typeof ResearchState.State) => state.next,
        {
          tools: 'tools',
          __end__: '__end__',
        }
      )
      .addEdge('tools', 'scraping');

    return workflow.compile();
  }

  private shouldCallTools(message: any): boolean {
    return message.tool_calls && message.tool_calls.length > 0;
  }

  /**
   * Conduct research on a given topic
   */
  async research(query: string) {
    const initialState = {
      messages: [],
      query,
      urls: [],
      findings: [],
      next: '',
    };

    const result = await this.graph.invoke(initialState);
    return result;
  }
}

/**
 * Example usage:
 *
 * const agent = new ResearchAgent();
 * const results = await agent.research("Latest trends in AI web scraping");
 * console.log(results);
 *
 * This demonstrates LangGraph's value for:
 * - Complex decision trees
 * - Tool orchestration
 * - State management
 * - Parallel processing
 * - Dynamic workflow routing
 */
