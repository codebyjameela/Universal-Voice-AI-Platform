export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export interface VoiceServiceCallbacks {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onSpeakEnd?: () => void;
}

export class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private callbacks: VoiceServiceCallbacks;
  private isSupportedSTT: boolean = false;
  private isSupportedTTS: boolean = false;

  constructor(callbacks: VoiceServiceCallbacks) {
    this.callbacks = callbacks;
    this.initSTT();
    this.initTTS();
  }

  private initSTT() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupportedSTT = true;
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.callbacks.onStateChange('LISTENING');
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            this.callbacks.onTranscript(finalTranscript.trim(), true);
          } else if (interimTranscript) {
            this.callbacks.onTranscript(interimTranscript.trim(), false);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('[STT Error]', event.error);
          if (event.error === 'no-speech') {
            this.callbacks.onStateChange('IDLE');
          } else {
            this.callbacks.onError(`Microphone: ${event.error}`);
            this.callbacks.onStateChange('ERROR');
          }
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
        };
      } catch (err: any) {
        console.error('Failed to initialize SpeechRecognition:', err);
      }
    } else {
      console.warn('SpeechRecognition API not available in this browser.');
    }
  }

  private initTTS() {
    this.isSupportedTTS = 'speechSynthesis' in window;
  }

  public getStatus() {
    return {
      sttAvailable: this.isSupportedSTT,
      ttsAvailable: this.isSupportedTTS,
      isListening: this.isListening,
    };
  }

  /**
   * Start listening to the microphone
   * Supports user interruption: if AI is speaking, interrupt it!
   */
  public startListening() {
    // Interruption feature: Stop TTS immediately if speaking
    this.stopSpeaking();

    if (!this.recognition) {
      this.callbacks.onError('Microphone speech recognition is not supported in this browser. You can type your voice message.');
      return;
    }

    try {
      this.recognition.start();
    } catch (e: any) {
      // If already started, ignore or restart
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 100);
      } catch {
        // no-op
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // no-op
      }
    }
    this.isListening = false;
  }

  /**
   * Synthesize text to speech
   */
  public speak(text: string, voiceName?: string, language: string = 'en-US') {
    if (!this.isSupportedTTS) {
      this.callbacks.onSpeakEnd?.();
      return;
    }

    this.stopSpeaking();

    // Clean text of markdown characters for natural voice synthesis
    const speechText = text
      .replace(/[*_#`~\[\]]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!speechText) {
      this.callbacks.onSpeakEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = language;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          (voiceName && v.name.toLowerCase().includes(voiceName.toLowerCase())) ||
          v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.lang.startsWith(language.slice(0, 2))
      );
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.callbacks.onStateChange('SPEAKING');
    };

    utterance.onend = () => {
      this.callbacks.onStateChange('IDLE');
      this.callbacks.onSpeakEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('[TTS Error]', e);
      this.callbacks.onStateChange('IDLE');
      this.callbacks.onSpeakEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Interrupt AI speech immediately
   */
  public stopSpeaking() {
    if (this.isSupportedTTS && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      this.callbacks.onStateChange('IDLE');
    }
  }
}
