export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface AgentToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface AIRequest {
  model?: string;
  fallbackModel?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: AgentToolDefinition[];
  stream?: boolean;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  content: string;
  modelUsed: string;
  usage?: AIUsage;
  latencyMs: number;
  toolCalls?: ToolCall[];
  finishReason?: string;
  isFallbackUsed?: boolean;
}

export interface AIChunk {
  delta: string;
  modelUsed?: string;
  isFinished: boolean;
  finishReason?: string;
  toolCalls?: ToolCall[];
}

export interface AIProvider {
  readonly name: string;
  generate(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): AsyncIterable<AIChunk>;
  getAvailableModels?(): Promise<Array<{ id: string; name: string; contextLength?: number }>>;
}
