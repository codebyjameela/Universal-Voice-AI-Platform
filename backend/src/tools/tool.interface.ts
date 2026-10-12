export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute(args: any): Promise<any>;
}

export class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  public register(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  public get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  public getAll(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  public getForDomain(enabledNames?: string[]): AgentTool[] {
    if (!enabledNames || enabledNames.length === 0) {
      return this.getAll();
    }
    return enabledNames
      .map((name) => this.tools.get(name))
      .filter((t): t is AgentTool => Boolean(t));
  }

  public toOpenRouterToolDefinitions(tools: AgentTool[]) {
    return tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }
}

// Built-in tools
export const builtInCalculatorTool: AgentTool = {
  name: 'calculator',
  description: 'Evaluate mathematical expressions safely',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The math expression to evaluate, e.g. "50000 * 0.18"',
      },
    },
    required: ['expression'],
  },
  async execute({ expression }: { expression: string }) {
    try {
      // Basic math evaluation without eval
      const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');
      const result = Function(`'use strict'; return (${sanitized})`)();
      return { expression, result };
    } catch (e: any) {
      return { error: `Calculation failed: ${e.message}` };
    }
  },
};

export const builtInWeatherTool: AgentTool = {
  name: 'weather',
  description: 'Get simulated current weather and temperature for a city',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City and country, e.g. "Kochi, Kerala"' },
    },
    required: ['location'],
  },
  async execute({ location }: { location: string }) {
    // Helpful simulation for voice testing
    return {
      location,
      condition: 'Sunny with pleasant breeze',
      temperatureC: 28,
      temperatureF: 82.4,
      humidity: '65%',
    };
  },
};

export const defaultToolRegistry = new ToolRegistry();
defaultToolRegistry.register(builtInCalculatorTool);
defaultToolRegistry.register(builtInWeatherTool);
