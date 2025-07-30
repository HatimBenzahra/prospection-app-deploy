import { useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface DeepgramTranscriptionHook {
  isConnected: boolean;
  transcription: string;
  error: string | null;
  startTranscription: (userId?: string, socket?: any) => Promise<void>;
  stopTranscription: () => void;
  clearTranscription: () => void;
}

export const useDeepgramTranscription = (): DeepgramTranscriptionHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const userIdRef = useRef<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const startTranscription = useCallback(async (userId?: string, socket?: any) => {
    try {
      console.log('🎙️ COMMERCIAL - Démarrage transcription avec:', { userId, socket: !!socket });
      
      // Stocker les références
      userIdRef.current = userId || null;
      socketRef.current = socket || null;

      // Créer une connexion socket séparée pour les transcriptions (serveur Node.js)
      if (!socketRef.current) {
        const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || window.location.hostname;
        const API_PORT = import.meta.env.VITE_API_PORT || '3000';
        const socketUrl = `https://${SERVER_HOST}:${API_PORT}`;
        
        console.log('🎙️ COMMERCIAL - Création socket pour transcriptions:', socketUrl);
        socketRef.current = io(socketUrl, {
          secure: true,
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 20000,
          forceNew: true,
          rejectUnauthorized: false,
        });

        socketRef.current.on('connect', () => {
          console.log('🎙️ COMMERCIAL - Socket transcriptions connecté');
          socketRef.current?.emit('joinRoom', 'transcriptions');
        });

        socketRef.current.on('disconnect', () => {
          console.log('🎙️ COMMERCIAL - Socket transcriptions déconnecté');
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('🎙️ COMMERCIAL - Erreur connexion socket transcriptions:', error);
        });

        socketRef.current.on('error', (error) => {
          console.error('🎙️ COMMERCIAL - Erreur socket transcriptions:', error);
        });
      }

      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      setError(null);

      const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        throw new Error('Clé API Deepgram manquante');
      }

      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&smart_format=true&interim_results=true&endpointing=300`;
      
      websocketRef.current = new WebSocket(wsUrl, ['token', deepgramApiKey]);

      websocketRef.current.onopen = () => {
        console.log('🎙️ Connexion Deepgram établie');
        setIsConnected(true);
        
        // Démarrer l'enregistrement
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(event.data);
          }
        };
        
        mediaRecorder.start(100); // Envoyer des chunks toutes les 100ms
      };

      websocketRef.current.onmessage = (event) => {
        const response = JSON.parse(event.data);
        
        if (response.channel?.alternatives?.[0]?.transcript) {
          const newTranscript = response.channel.alternatives[0].transcript;
          
          if (response.is_final) {
            // Transcription finale - l'ajouter définitivement
            const finalTranscript = newTranscript + ' ';
            setTranscription(prev => prev + finalTranscript);
            
            // Envoyer la transcription finale au serveur Node.js
            if (socketRef.current && userIdRef.current) {
              console.log('📝 COMMERCIAL - Envoi transcription finale:', finalTranscript);
              console.log('📝 COMMERCIAL - Socket connecté:', !!socketRef.current);
              console.log('📝 COMMERCIAL - User ID:', userIdRef.current);
              const eventData = {
                commercial_id: userIdRef.current,
                transcript: finalTranscript,
                is_final: true,
                timestamp: new Date().toISOString()
              };
              console.log('📝 COMMERCIAL - Données événement:', eventData);
              socketRef.current.emit('transcription_update', eventData);
              console.log('📝 COMMERCIAL - Événement transcription_update émis');
            } else {
              console.log('❌ COMMERCIAL - Impossible d\'envoyer transcription:', {
                socket: !!socketRef.current,
                userId: userIdRef.current
              });
            }
          } else {
            // Transcription temporaire - la remplacer
            setTranscription(prev => {
              const lines = prev.split('\n');
              const lastLineComplete = lines[lines.length - 1];
              return lastLineComplete + '[' + newTranscript + ']';
            });
            
            // Envoyer aussi les transcriptions temporaires (optionnel)
            if (socketRef.current && userIdRef.current) {
              console.log('📝 COMMERCIAL - Envoi transcription temporaire:', newTranscript);
              socketRef.current.emit('transcription_update', {
                commercial_id: userIdRef.current,
                transcript: newTranscript,
                is_final: false,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('❌ Erreur Deepgram WebSocket:', error);
        setError('Erreur de connexion à Deepgram');
        setIsConnected(false);
      };

      websocketRef.current.onclose = () => {
        console.log('🔌 Connexion Deepgram fermée');
        setIsConnected(false);
      };

    } catch (err) {
      console.error('❌ Erreur démarrage transcription:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsConnected(false);
    }
  }, []);

  const stopTranscription = useCallback(() => {
    // Arrêter l'enregistrement
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Fermer la connexion WebSocket Deepgram
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Arrêter le stream audio
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Fermer le socket de transcriptions
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setError(null);
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscription('');
  }, []);

  return {
    isConnected,
    transcription,
    error,
    startTranscription,
    stopTranscription,
    clearTranscription
  };
};