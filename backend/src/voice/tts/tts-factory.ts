import { AudioResponse, TTSProvider } from './tts.interface.js';

export class BrowserTTSProvider implements TTSProvider {
  public readonly name = 'browser-speech-synthesis';

  async synthesize(text: string, voice: string, language: string): Promise<AudioResponse> {
    // Browser synthesis is handled in frontend via window.speechSynthesis
    return {
      audioBuffer: Buffer.from([]),
      contentType: 'audio/client-synthesized',
      durationMs: text.length * 50,
    };
  }
}

export class TTSFactory {
  private static providers: Map<string, TTSProvider> = new Map([
    ['browser', new BrowserTTSProvider()],
  ]);

  public static getProvider(name: string = 'browser'): TTSProvider {
    return this.providers.get(name) || this.providers.get('browser')!;
  }

  public static registerProvider(name: string, provider: TTSProvider): void {
    this.providers.set(name, provider);
  }
}
