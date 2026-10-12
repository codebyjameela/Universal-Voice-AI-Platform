// STT Provider Interface (Speech-to-Text abstraction)
export interface AudioData {
  buffer: Buffer | ArrayBuffer;
  mimeType: string;
  sampleRate?: number;
  language?: string;
}

export interface Transcript {
  text: string;
  confidence?: number;
  words?: Array<{ word: string; start: number; end: number }>;
  isFinal: boolean;
}

export interface STTProvider {
  readonly name: string;
  transcribe(audio: AudioData): Promise<Transcript>;
}
