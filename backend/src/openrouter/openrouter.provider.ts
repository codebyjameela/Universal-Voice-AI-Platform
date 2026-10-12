import {
  AIChunk,
  AIProvider,
  AIRequest,
  AIResponse,
} from './ai-provider.interface.js';
import { OpenRouterClient, OpenRouterModelInfo } from './openrouter.client.js';

export class OpenRouterProvider implements AIProvider {
  public readonly name = 'openrouter';
  private client: OpenRouterClient;

  constructor(client?: OpenRouterClient) {
    this.client = client || new OpenRouterClient();
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    return this.client.chatCompletion(request);
  }

  public stream(request: AIRequest): AsyncIterable<AIChunk> {
    return this.client.streamChatCompletion(request);
  }

  public async getAvailableModels(): Promise<OpenRouterModelInfo[]> {
    return this.client.listModels();
  }

  public getClient(): OpenRouterClient {
    return this.client;
  }
}

// Export singleton instance
export const openRouterProvider = new OpenRouterProvider();
