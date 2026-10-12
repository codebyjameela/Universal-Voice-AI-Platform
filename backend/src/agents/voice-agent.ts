import { DomainConfiguration } from '../domains/domain.types.js';
import { MemoryManager, defaultMemoryManager } from '../memory/memory.manager.js';
import { AIProvider, AIResponse } from '../openrouter/ai-provider.interface.js';
import { openRouterProvider } from '../openrouter/openrouter.provider.js';
import { RAGService, defaultRAGService } from '../rag/rag.service.js';
import { ToolRegistry, defaultToolRegistry } from '../tools/tool.interface.js';
import { PromptBuilder } from './prompt-builder.js';

export interface VoiceAgentOptions {
  aiProvider?: AIProvider;
  ragService?: RAGService;
  memoryManager?: MemoryManager;
  toolRegistry?: ToolRegistry;
  domainConfig?: DomainConfiguration;
  sessionId?: string;
}

export interface VoiceAgentResponse {
  answer: string;
  modelUsed: string;
  sourcesUsed?: Array<{ title: string; content: string }>;
  toolsCalled?: Array<{ name: string; args: any; result: any }>;
  latencyMs: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class VoiceAgent {
  private ai: AIProvider;
  private rag: RAGService;
  private memory: MemoryManager;
  private tools: ToolRegistry;
  private domainConfig?: DomainConfiguration;
  private sessionId: string;

  constructor(options?: VoiceAgentOptions) {
    this.ai = options?.aiProvider || openRouterProvider;
    this.rag = options?.ragService || defaultRAGService;
    this.memory = options?.memoryManager || defaultMemoryManager;
    this.tools = options?.toolRegistry || defaultToolRegistry;
    this.domainConfig = options?.domainConfig;
    this.sessionId = options?.sessionId || 'default-session';
  }

  public setDomain(config: DomainConfiguration) {
    this.domainConfig = config;
  }

  public async processUserInput(
    userInput: string,
    streamCallback?: (delta: string) => void
  ): Promise<VoiceAgentResponse> {
    const startTime = Date.now();

    // 1. Record user message in memory
    this.memory.recordMessage(this.sessionId, 'user', userInput);

    // 2. Retrieve relevant domain RAG snippets
    const ragSnippets = await this.rag.retrieveRelevantContext(
      userInput,
      this.domainConfig?.id,
      3
    );

    // 3. Get active session facts & memory
    const sessionFacts = this.memory.getFacts(this.sessionId);

    // 4. Get enabled tools for domain
    const activeTools = this.tools.getForDomain(this.domainConfig?.enabledTools);
    const toolDefinitions = this.tools.toOpenRouterToolDefinitions(activeTools);

    // 5. Build dynamic OpenRouter prompt
    const messages = PromptBuilder.buildOpenRouterMessages({
      domainConfig: this.domainConfig,
      ragSnippets,
      sessionMemory: sessionFacts,
      conversationHistory: this.memory
        .getOrCreateSession(this.sessionId)
        .conversationHistory.map((m) => ({
          role: m.role as any,
          content: m.content,
        })),
      availableTools: activeTools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
      currentUserMessage: userInput,
    });

    // 6. Request OpenRouter LLM reasoning
    let aiResponse: AIResponse = await this.ai.generate({
      messages,
      tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
    });

    const toolsExecuted: Array<{ name: string; args: any; result: any }> = [];

    // 7. Handle Tool Calling if OpenRouter requests tool execution
    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      for (const call of aiResponse.toolCalls) {
        const tool = this.tools.get(call.function.name);
        if (tool) {
          try {
            const args = JSON.parse(call.function.arguments || '{}');
            const result = await tool.execute(args);
            toolsExecuted.push({ name: tool.name, args, result });

            // Feed tool result back to OpenRouter for final synthesis
            messages.push({
              role: 'assistant',
              content: '',
            });
            messages.push({
              role: 'tool',
              name: tool.name,
              tool_call_id: call.id,
              content: JSON.stringify(result),
            });
          } catch (toolErr: any) {
            toolsExecuted.push({
              name: tool.name,
              args: {},
              result: { error: toolErr.message },
            });
          }
        }
      }

      // Re-invoke OpenRouter with tool execution output
      aiResponse = await this.ai.generate({
        messages,
      });
    }

    const finalAnswer = aiResponse.content || 'I processed your request.';

    // 8. Record assistant response in memory
    this.memory.recordMessage(this.sessionId, 'assistant', finalAnswer);

    // 9. Heuristic fact extraction for session memory (e.g. key: value)
    this.detectAndStoreKeyFacts(userInput, finalAnswer);

    return {
      answer: finalAnswer,
      modelUsed: aiResponse.modelUsed,
      sourcesUsed: ragSnippets.length > 0 ? ragSnippets : undefined,
      toolsCalled: toolsExecuted.length > 0 ? toolsExecuted : undefined,
      latencyMs: Date.now() - startTime,
      usage: aiResponse.usage,
    };
  }

  private detectAndStoreKeyFacts(userInput: string, _answer: string): void {
    // Quick heuristic for preferences (e.g., "trip to Kerala", "budget is 50000")
    const budgetMatch = userInput.match(/budget (?:is|of) ([₹$€£\d,]+)/i);
    if (budgetMatch) {
      this.memory.setFact(this.sessionId, 'budget', budgetMatch[1]);
    }
    const daysMatch = userInput.match(/(\d+)[\s-]day/i);
    if (daysMatch) {
      this.memory.setFact(this.sessionId, 'duration', `${daysMatch[1]} days`);
    }
    const destinationMatch = userInput.match(/(?:visit|trip to|travel to|going to)\s+([A-Za-z\s]+)/i);
    if (destinationMatch) {
      this.memory.setFact(this.sessionId, 'destination', destinationMatch[1].trim());
    }
  }
}
