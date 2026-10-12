import { AudioData, STTProvider, Transcript } from './stt.interface.js';

export class BrowserSTTProvider implements STTProvider {
  public readonly name = 'browser-web-speech';

  async transcribe(_audio: AudioData): Promise<Transcript> {
    throw new Error(
      'BrowserSTTProvider is executed client-side via the browser Web Speech API (webkitSpeechRecognition).'
    );
  }
}

export class MockServerSTTProvider implements STTProvider {
  public readonly name = 'server-mock-whisper';

  async transcribe(audio: AudioData): Promise<Transcript> {
    // Basic simulation for server transcription test
    const text = 'Hello, I want to explore recommendations for our selected domain.';
    return {
      text,
      confidence: 0.98,
      isFinal: true,
    };
  }
}

export class STTFactory {
  private static providers: Map<string, STTProvider> = new Map([
    ['browser', new BrowserSTTProvider()],
    ['mock', new MockServerSTTProvider()],
  ]);

  public static getProvider(name: string = 'browser'): STTProvider {
    return this.providers.get(name) || this.providers.get('browser')!;
  }

  public static registerProvider(name: string, provider: STTProvider): void {
    this.providers.set(name, provider);
  }
}
