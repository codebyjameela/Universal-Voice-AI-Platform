import { ChatMessage } from '../openrouter/ai-provider.interface.js';
import { DomainConfiguration } from '../domains/domain.types.js';

export interface PromptContext {
  domainConfig?: DomainConfiguration;
  ragSnippets?: Array<{ title: string; content: string; score?: number }>;
  sessionMemory?: Record<string, any>;
  conversationHistory?: ChatMessage[];
  availableTools?: Array<{ name: string; description: string }>;
  currentUserMessage: string;
}

export class PromptBuilder {
  /**
   * Base system prompt enforcing voice-optimized concise communication
   */
  public static buildSystemPrompt(): string {
    return [
      'You are a high-performance Voice AI Assistant powered by OpenRouter.',
      'You interact with users through real-time spoken voice (Speech-to-Text & Text-to-Speech).',
      'Follow these voice communication guidelines strictly:',
      '1. Keep responses clear, concise, and natural for speech playback.',
      '2. Avoid lengthy monologues, markdown tables, or complex ASCII formatting that sounds awkward when spoken aloud.',
      '3. Use natural punctuation and cadence.',
      '4. If information is uncertain or requires external knowledge, state so honestly.',
    ].join('\n');
  }

  /**
   * Domain-specific configuration prompt
   */
  public static buildDomainPrompt(domain?: DomainConfiguration): string {
    if (!domain) {
      return 'DOMAIN: General Assistant\nMaintain a helpful, balanced, and friendly tone.';
    }

    const lines = [
      `DOMAIN: ${domain.domain.toUpperCase()} (${domain.name})`,
      `TARGET AUDIENCE: ${domain.targetAudience}`,
      `ASSISTANT NAME: ${domain.assistantName}`,
      `PERSONA: ${domain.persona}`,
      `TONE: ${domain.tone}`,
      `RESPONSE LENGTH PREFERENCE: ${domain.responseLength}`,
      `PRIMARY LANGUAGE: ${domain.language}`,
      '',
      'DOMAIN INSTRUCTIONS:',
      ...domain.instructions.map((inst, i) => `  ${i + 1}. ${inst}`),
      '',
      'SAFETY & BEHAVIORAL RULES:',
      ...domain.rules.map((rule, i) => `  ${i + 1}. ${rule}`),
    ];

    return lines.join('\n');
  }

  /**
   * Format RAG retrieved context snippets
   */
  public static buildRAGContext(
    snippets?: Array<{ title: string; content: string; score?: number }>
  ): string {
    if (!snippets || snippets.length === 0) {
      return '';
    }

    const formattedSnippets = snippets
      .map(
        (s, idx) =>
          `[Source ${idx + 1}: ${s.title}]\n${s.content.trim()}`
      )
      .join('\n\n');

    return [
      '=== RETRIEVED KNOWLEDGE BASE CONTEXT (RAG) ===',
      'Ground your answer in the following verified domain knowledge when relevant:',
      formattedSnippets,
      '=== END RETRIEVED CONTEXT ===',
    ].join('\n');
  }

  /**
   * Format session facts and memory
   */
  public static buildMemoryContext(memory?: Record<string, any>): string {
    if (!memory || Object.keys(memory).length === 0) {
      return '';
    }

    const memoryEntries = Object.entries(memory)
      .map(([k, v]) => `- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');

    return [
      '=== ACTIVE SESSION MEMORY & KNOWN FACTS ===',
      memoryEntries,
      '=== END MEMORY ===',
    ].join('\n');
  }

  /**
   * Describe available tools
   */
  public static buildToolContext(tools?: Array<{ name: string; description: string }>): string {
    if (!tools || tools.length === 0) {
      return '';
    }

    const toolList = tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');

    return [
      'AVAILABLE AGENT TOOLS:',
      toolList,
      'Use the tool calling capability when current knowledge is insufficient or specific computation/retrieval is required.',
    ].join('\n');
  }

  /**
   * Format conversation history
   */
  public static buildConversationContext(history?: ChatMessage[]): ChatMessage[] {
    if (!history || history.length === 0) {
      return [];
    }
    // Return last 10 messages for conversational context
    return history.slice(-10);
  }

  /**
   * Assemble complete messages array for OpenRouter
   */
  public static buildOpenRouterMessages(context: PromptContext): ChatMessage[] {
    const systemSections: string[] = [
      this.buildSystemPrompt(),
      this.buildDomainPrompt(context.domainConfig),
    ];

    const ragPart = this.buildRAGContext(context.ragSnippets);
    if (ragPart) systemSections.push(ragPart);

    const memPart = this.buildMemoryContext(context.sessionMemory);
    if (memPart) systemSections.push(memPart);

    const toolPart = this.buildToolContext(context.availableTools);
    if (toolPart) systemSections.push(toolPart);

    const completeSystemPrompt = systemSections.join('\n\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: completeSystemPrompt },
    ];

    // Append prior history
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      messages.push(...this.buildConversationContext(context.conversationHistory));
    }

    // Append current user message
    messages.push({
      role: 'user',
      content: context.currentUserMessage,
    });

    return messages;
  }
}
