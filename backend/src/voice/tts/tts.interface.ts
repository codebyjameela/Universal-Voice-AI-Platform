// TTS Provider Interface (Text-to-Speech abstraction)
export interface AudioResponse {
  audioBuffer: Buffer | ArrayBuffer;
  contentType: string;
  durationMs?: number;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(
    text: string,
    voice: string,
    language: string
  ): Promise<AudioResponse>;
}
