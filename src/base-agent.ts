/**
 * Base Agent class providing common functionality for all agents
 *
 * LangChain 1.0 Compatible Implementation
 *
 * Design Decision: Uses direct LLM invocation patterns suitable for simple,
 * linear workflows. For complex multi-step workflows with state management,
 * tool calling, and conditional branching, consider migrating to LangGraph.
 *
 * @see docs/langchain-1.0-implementation.md for migration guidance
 */
export abstract class BaseAgent {
  protected name: string;
  protected startTime: number = 0;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Execute the agent with timing and error handling
   */
  async run(input: any): Promise<any> {
    this.startTime = Date.now();

    try {
      this.validateInput(input);
      const result = await this.execute(input);
      return this.formatOutput(result);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get execution duration in milliseconds
   */
  getExecutionTime(): number {
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  /**
   * Abstract method to be implemented by concrete agents
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Validate input parameters (override in subclasses)
   */
  protected validateInput(_input: unknown): void {
    // Default implementation - override in subclasses
  }

  /**
   * Format output (override in subclasses)
   */
  protected formatOutput(output: any): any {
    return output;
  }

  /**
   * Handle errors (override in subclasses for custom error handling)
   */
  protected handleError(error: any): void {
    console.error(`[${this.name}] Error:`, error);
  }

  /**
   * Log information (can be overridden for custom logging)
   */
  protected log(message: string, ...args: any[]): void {
    console.log(`[${this.name}] ${message}`, ...args);
  }
}
