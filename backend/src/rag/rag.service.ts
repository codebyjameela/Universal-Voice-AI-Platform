export interface DocumentChunk {
  id: string;
  documentId: string;
  title: string;
  domainId?: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface VectorStore {
  addChunks(chunks: DocumentChunk[]): Promise<void>;
  similaritySearch(query: string, domainId?: string, topK?: number): Promise<SearchResult[]>;
  deleteByDocument(documentId: string): Promise<void>;
}

/**
 * Lightweight in-memory semantic keyword & vector store for MVP
 * Can be connected to PostgreSQL + pgvector
 */
export class InMemoryVectorStore implements VectorStore {
  private chunks: DocumentChunk[] = [];

  public async addChunks(newChunks: DocumentChunk[]): Promise<void> {
    this.chunks.push(...newChunks);
  }

  public async similaritySearch(
    query: string,
    domainId?: string,
    topK: number = 3
  ): Promise<SearchResult[]> {
    const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean);

    const scored = this.chunks
      .filter((c) => !domainId || c.domainId === domainId)
      .map((chunk) => {
        const text = (chunk.title + ' ' + chunk.content).toLowerCase();
        let matches = 0;
        for (const token of queryTokens) {
          if (text.includes(token)) {
            matches++;
          }
        }
        const score = queryTokens.length > 0 ? matches / queryTokens.length : 0;
        return { chunk, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  public async deleteByDocument(documentId: string): Promise<void> {
    this.chunks = this.chunks.filter((c) => c.documentId !== documentId);
  }

  public getAll(): DocumentChunk[] {
    return this.chunks;
  }
}

export class RAGService {
  constructor(private vectorStore: VectorStore = new InMemoryVectorStore()) {}

  public async addDocument(
    documentId: string,
    title: string,
    content: string,
    domainId?: string
  ): Promise<number> {
    // Simple text chunker by paragraph or length
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    const chunks: DocumentChunk[] = paragraphs.map((text, idx) => ({
      id: `${documentId}-chunk-${idx}`,
      documentId,
      title,
      domainId,
      content: text,
      metadata: { chunkIndex: idx },
    }));

    await this.vectorStore.addChunks(chunks);
    return chunks.length;
  }

  public async retrieveRelevantContext(
    query: string,
    domainId?: string,
    topK: number = 3
  ): Promise<Array<{ title: string; content: string; score: number }>> {
    const results = await this.vectorStore.similaritySearch(query, domainId, topK);
    return results.map((r) => ({
      title: r.chunk.title,
      content: r.chunk.content,
      score: r.score,
    }));
  }
}

export const defaultRAGService = new RAGService();
