export interface SpeechRecognitionResultHandler {
  onResult: (transcript: string) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

export class SpeechHandler {
  private recognition: any = null;
  public isSupported: boolean = false;
  public isListening: boolean = false;

  constructor(lang: 'ar' | 'en' = 'ar') {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.isSupported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      }
    }
  }

  public setLanguage(lang: 'ar' | 'en') {
    if (this.recognition) {
      this.recognition.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    }
  }

  public start(callbacks: SpeechRecognitionResultHandler) {
    if (!this.recognition) return;

    this.isListening = true;

    this.recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      callbacks.onResult(currentTranscript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (callbacks.onError) callbacks.onError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition already started or error', e);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
