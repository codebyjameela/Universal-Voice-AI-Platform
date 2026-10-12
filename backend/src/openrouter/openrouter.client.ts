import { env, isOpenRouterConfigured, getActiveOpenRouterKey } from '../config/env.js';
import {
  AIChunk,
  AIRequest,
  AIResponse,
  ToolCall,
} from './ai-provider.interface.js';

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  tier?: 'recommended' | 'fast' | 'balanced' | 'advanced' | 'low-cost';
}

export class OpenRouterConfigError extends Error {
  public readonly code = 'OPENROUTER_CONFIG_ERROR';
  public readonly statusCode = 401;

  constructor(message?: string) {
    super(
      message ||
        'OpenRouter API key is not configured. Please set a valid OPENROUTER_API_KEY in backend/.env (obtain one from https://openrouter.ai/keys) and restart the backend server.'
    );
    this.name = 'OpenRouterConfigError';
  }
}

export class OpenRouterApiError extends Error {
  public readonly code = 'OPENROUTER_API_ERROR';

  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'OpenRouterApiError';
  }
}

export class OpenRouterClient {
  private baseUrl: string;
  private apiKey: string;
  private explicitApiKey?: string;
  private defaultModel: string;
  private fallbackModel: string;
  private modelsCache: OpenRouterModelInfo[] | null = null;
  private modelsCacheTime: number = 0;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    defaultModel?: string;
    fallbackModel?: string;
  }) {
    this.baseUrl = options?.baseUrl || env.OPENROUTER_BASE_URL;
    this.explicitApiKey = options?.apiKey;
    this.apiKey = options?.apiKey || env.OPENROUTER_API_KEY;
    this.defaultModel = options?.defaultModel || env.OPENROUTER_MODEL;
    this.fallbackModel = options?.fallbackModel || env.OPENROUTER_FALLBACK_MODEL;
  }

  private getEffectiveApiKey(): string {
    if (this.explicitApiKey !== undefined) {
      return this.explicitApiKey;
    }
    return getActiveOpenRouterKey();
  }

  private getHeaders(): Record<string, string> {
    const key = this.getEffectiveApiKey();
    return {
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': env.APP_URL || 'http://localhost:3000',
      'X-Title': 'Universal Voice AI Platform',
      'Content-Type': 'application/json',
    };
  }

  public isConfigured(): boolean {
    if (this.explicitApiKey !== undefined) {
      const key = this.explicitApiKey.trim();
      return (
        Boolean(key) &&
        key !== 'your_key_here' &&
        key !== 'your_actual_api_key' &&
        key !== 'your_openrouter_api_key_here' &&
        !key.startsWith('your_')
      );
    }
    return isOpenRouterConfigured();
  }

  /**
   * Send a real chat completion request to OpenRouter
   */
  public async chatCompletion(request: AIRequest): Promise<AIResponse> {
    // 1. Verify API Key is configured before sending
    if (!this.isConfigured()) {
      throw new OpenRouterConfigError();
    }

    const selectedModel = request.model || this.defaultModel;
    const fallbackModel = request.fallbackModel || this.fallbackModel;
    const startTime = Date.now();

    try {
      return await this.executeChatRequest(selectedModel, request, startTime, false);
    } catch (primaryError: any) {
      // If primary model failed with upstream 5xx or 404 and fallback is specified, attempt fallback model
      const shouldAttemptFallback =
        fallbackModel &&
        fallbackModel !== selectedModel &&
        (primaryError.statusCode >= 500 || primaryError.statusCode === 404);

      if (shouldAttemptFallback) {
        console.warn(
          `[OpenRouter] Primary model ${selectedModel} failed (${primaryError.message}). Attempting fallback to ${fallbackModel}...`
        );
        try {
          return await this.executeChatRequest(fallbackModel, request, startTime, true);
        } catch (fallbackError: any) {
          throw new OpenRouterApiError(
            `Primary model (${selectedModel}: ${primaryError.message}) and fallback model (${fallbackModel}: ${fallbackError.message}) both failed.`,
            primaryError.statusCode || 500
          );
        }
      }

      throw primaryError;
    }
  }

  private async executeChatRequest(
    model: string,
    request: AIRequest,
    startTime: number,
    isFallback: boolean
  ): Promise<AIResponse> {
    const body: Record<string, unknown> = {
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
    };

    if (request.maxTokens) {
      body.max_tokens = request.maxTokens;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000), // 45s timeout
      });
    } catch (networkErr: any) {
      if (networkErr.name === 'TimeoutError') {
        throw new OpenRouterApiError(
          'OpenRouter request timed out after 45 seconds. The selected model may be overloaded.',
          504
        );
      }
      throw new OpenRouterApiError(
        `Failed to connect to OpenRouter (${networkErr.message}). Check network connectivity.`,
        503
      );
    }

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const json = JSON.parse(errorText);
        parsedError = json.error?.message || json.message || errorText;
      } catch {
        // use raw text
      }

      const status = response.status;
      if (status === 401) {
        throw new OpenRouterApiError(
          'OpenRouter Authentication Error (401): Invalid or unauthorized API key. Please check OPENROUTER_API_KEY in backend/.env.',
          401,
          parsedError
        );
      }
      if (status === 402) {
        throw new OpenRouterApiError(
          'OpenRouter Payment Required (402): Insufficient balance/credits in your OpenRouter account. Visit https://openrouter.ai/credits to recharge.',
          402,
          parsedError
        );
      }
      if (status === 403) {
        throw new OpenRouterApiError(
          `OpenRouter Forbidden (403): Access denied for model ${model}.`,
          403,
          parsedError
        );
      }
      if (status === 404) {
        throw new OpenRouterApiError(
          `OpenRouter Model Not Found (404): The model '${model}' is unavailable.`,
          404,
          parsedError
        );
      }
      if (status === 429) {
        throw new OpenRouterApiError(
          'OpenRouter Rate Limit Exceeded (429): Rate limit reached for this model or account. Please wait a moment and retry.',
          429,
          parsedError
        );
      }
      throw new OpenRouterApiError(
        `OpenRouter request failed (${status}): ${parsedError}`,
        status,
        parsedError
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch (jsonErr: any) {
      throw new OpenRouterApiError('Failed to parse OpenRouter response JSON.', 502);
    }

    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message && (!choice?.finish_reason || choice.finish_reason !== 'tool_calls')) {
      throw new OpenRouterApiError(
        'OpenRouter returned an empty completion response without message content.',
        502
      );
    }

    let toolCalls: ToolCall[] | undefined;
    if (message?.tool_calls && Array.isArray(message.tool_calls)) {
      toolCalls = message.tool_calls.map((tc: any) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function?.name || '',
          arguments: tc.function?.arguments || '{}',
        },
      }));
    }

    return {
      content: message?.content || '',
      modelUsed: data.model || model,
      latencyMs,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
      toolCalls,
      finishReason: choice?.finish_reason,
      isFallbackUsed: isFallback,
    };
  }

  /**
   * Stream chat completion via Server-Sent Events (SSE)
   */
  public async *streamChatCompletion(request: AIRequest): AsyncIterable<AIChunk> {
    if (!this.isConfigured()) {
      throw new OpenRouterConfigError();
    }

    const selectedModel = request.model || this.defaultModel;

    const body: Record<string, unknown> = {
      model: selectedModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      stream: true,
    };

    if (request.maxTokens) {
      body.max_tokens = request.maxTokens;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      });
    } catch (networkErr: any) {
      throw new OpenRouterApiError(
        `Failed to connect to OpenRouter streaming: ${networkErr.message}`,
        503
      );
    }

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new OpenRouterApiError(
        `OpenRouter streaming error (${response.status}): ${errorText}`,
        response.status
      );
    }

    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') {
          yield { delta: '', isFinished: true, finishReason: 'stop' };
          return;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const choice = parsed.choices?.[0];
            const delta = choice?.delta?.content || '';
            const finishReason = choice?.finish_reason;

            if (delta || finishReason) {
              yield {
                delta,
                modelUsed: parsed.model || selectedModel,
                isFinished: Boolean(finishReason),
                finishReason,
              };
            }
          } catch {
            // Partial SSE line; skip
          }
        }
      }
    }
  }

  /**
   * Fetch live models list from OpenRouter API
   */
  public async listModels(): Promise<OpenRouterModelInfo[]> {
    const now = Date.now();
    if (this.modelsCache && now - this.modelsCacheTime < 3600000) {
      return this.modelsCache;
    }

    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch models: ${res.statusText}`);
      }

      const json: any = await res.json();
      const rawModels: any[] = json.data || [];

      const categorized: OpenRouterModelInfo[] = rawModels.map((m) => {
        let tier: OpenRouterModelInfo['tier'] = 'balanced';
        const idLower = m.id.toLowerCase();

        if (
          idLower.includes('auto') ||
          idLower.includes('llama-3.3-70b') ||
          idLower.includes('gpt-4o-mini') ||
          idLower.includes('gemini-2.0-flash')
        ) {
          tier = 'recommended';
        } else if (
          idLower.includes('flash') ||
          idLower.includes('8b') ||
          idLower.includes('haiku') ||
          idLower.includes('fast')
        ) {
          tier = 'fast';
        } else if (
          idLower.includes('opus') ||
          idLower.includes('sonnet') ||
          idLower.includes('o1') ||
          idLower.includes('o3') ||
          idLower.includes('gpt-4o')
        ) {
          tier = 'advanced';
        } else if (
          idLower.includes('free') ||
          idLower.includes('small') ||
          idLower.includes('nano')
        ) {
          tier = 'low-cost';
        }

        return {
          id: m.id,
          name: m.name || m.id,
          description: m.description,
          contextLength: m.context_length,
          pricing: m.pricing
            ? {
                prompt: String(m.pricing.prompt ?? '0'),
                completion: String(m.pricing.completion ?? '0'),
              }
            : undefined,
          tier,
        };
      });

      this.modelsCache = categorized;
      this.modelsCacheTime = now;
      return categorized;
    } catch (err) {
      console.warn('[OpenRouter] Could not fetch live models from API, using fallback list:', err);
      return this.getFallbackModels();
    }
  }

  /**
   * Fallback curated list of prominent OpenRouter models when offline
   */
  private getFallbackModels(): OpenRouterModelInfo[] {
    return [
      { id: 'openrouter/auto', name: 'OpenRouter Auto Router (Best for task)', tier: 'recommended' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta: Llama 3.3 70B Instruct', tier: 'recommended' },
      { id: 'google/gemini-2.0-flash-001', name: 'Google: Gemini 2.0 Flash', tier: 'fast' },
      { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o Mini', tier: 'balanced' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet', tier: 'advanced' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek: V3 Chat', tier: 'low-cost' },
      { id: 'mistralai/mistral-small-24b-instruct-2501', name: 'Mistral: Small 24B', tier: 'balanced' },
    ];
  }
}
