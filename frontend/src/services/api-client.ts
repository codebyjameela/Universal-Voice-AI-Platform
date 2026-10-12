export interface DomainInfo {
  id: string;
  domain: string;
  name: string;
  description: string;
  targetAudience: string;
  assistantName: string;
  persona: string;
  tone: string;
  language: string;
  voice: string;
  instructions: string[];
  rules: string[];
  responseLength: string;
  enabledTools: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  tier?: 'recommended' | 'fast' | 'balanced' | 'advanced' | 'low-cost';
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface PipelineResponse {
  userTranscript: string;
  aiResponse: string;
  modelUsed: string;
  domain: string;
  voice: string;
  language: string;
  sourcesUsed?: Array<{ title: string; content: string }>;
  toolsCalled?: Array<{ name: string; args: any; result: any }>;
  latencyMs: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const API_BASE = '/api';

export const apiClient = {
  async checkStatus(): Promise<{
    status: string;
    provider: string;
    configured: boolean;
    defaultModel: string;
    fallbackModel: string;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/status`);
    return res.json();
  },

  async getDomains(): Promise<DomainInfo[]> {
    const res = await fetch(`${API_BASE}/domains`);
    const data = await res.json();
    return data.domains || [];
  },

  async createDomain(domainData: Partial<DomainInfo>): Promise<DomainInfo> {
    const res = await fetch(`${API_BASE}/domains`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(domainData),
    });
    const data = await res.json();
    return data.domain;
  },

  async getModels(): Promise<ModelInfo[]> {
    const res = await fetch(`${API_BASE}/ai/models`);
    const data = await res.json();
    return data.models || [];
  },

  async sendVoicePipeline(
    transcript: string,
    domainId: string,
    sessionId: string = 'voice-session'
  ): Promise<PipelineResponse> {
    const res = await fetch(`${API_BASE}/voice/pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        domainId,
        sessionId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Pipeline error' }));
      throw new ApiError(
        err.message || err.error || 'Voice Pipeline request failed',
        res.status,
        err.code
      );
    }

    return res.json();
  },

  async sendChat(message: string, model?: string, systemPrompt?: string) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, model, systemPrompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Chat error' }));
      throw new ApiError(
        err.message || err.error || 'Chat request failed',
        res.status,
        err.code
      );
    }

    return res.json();
  },
};
