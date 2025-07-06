import { useState, useEffect, useRef } from 'react';

// --- Définitions de types ---
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionConstructor = new () => SpeechRecognition;
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface CustomWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}
declare const window: CustomWindow;
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stopIntentionallyRef = useRef(false);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      console.warn("L'API Web Speech n'est pas supportée par ce navigateur.");
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setText(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Erreur de reconnaissance vocale:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      if (!stopIntentionallyRef.current) {
        try { recognition.start(); } 
        catch { setIsListening(false); }
      } else {
        setIsListening(false);
      }
    };
    
    recognitionRef.current = recognition;
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      finalTranscriptRef.current = ''; 
      setText('');
      stopIntentionallyRef.current = false;
      setIsListening(true);
      try { recognitionRef.current.start(); } 
      catch { setIsListening(false); }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      stopIntentionallyRef.current = true;
      recognitionRef.current.stop();
    }
  };

  return { text, isListening, startListening, stopListening, hasSupport: !!SpeechRecognitionAPI };
};