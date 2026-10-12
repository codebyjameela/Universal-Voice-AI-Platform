export interface SessionMemoryState {
  sessionId: string;
  userId?: string;
  facts: Record<string, any>;
  conversationHistory: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
  isLongTermEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export class MemoryManager {
  private sessions: Map<string, SessionMemoryState> = new Map();

  public getOrCreateSession(sessionId: string, userId?: string): SessionMemoryState {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        userId,
        facts: {},
        conversationHistory: [],
        isLongTermEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  public recordMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): void {
    const session = this.getOrCreateSession(sessionId);
    session.conversationHistory.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    });
    session.updatedAt = new Date().toISOString();
  }

  public setFact(sessionId: string, key: string, value: any): void {
    const session = this.getOrCreateSession(sessionId);
    session.facts[key] = value;
    session.updatedAt = new Date().toISOString();
  }

  public getFacts(sessionId: string): Record<string, any> {
    const session = this.sessions.get(sessionId);
    return session ? { ...session.facts } : {};
  }

  public deleteFact(sessionId: string, key: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      delete session.facts[key];
      session.updatedAt = new Date().toISOString();
    }
  }

  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  public setLongTermEnabled(sessionId: string, enabled: boolean): void {
    const session = this.getOrCreateSession(sessionId);
    session.isLongTermEnabled = enabled;
  }
}

export const defaultMemoryManager = new MemoryManager();
