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

      // Paramètres audio pour discours fluide
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      setError(null);

      const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        throw new Error('Clé API Deepgram manquante');
      }

      console.log('🎙️ COMMERCIAL - Clé API Deepgram:', deepgramApiKey.substring(0, 10) + '...');
      console.log('🎙️ COMMERCIAL - Longueur de la clé:', deepgramApiKey.length);
      console.log('🎙️ COMMERCIAL - Vérification de la clé API...');

      // Vérifier le format de la clé (doit commencer par "dg_" dans le nouveau format)
      if (!deepgramApiKey.startsWith('dg_')) {
        // Ancien format hexadécimal détecté. On continue mais on log un avertissement.
        console.warn('⚠️ COMMERCIAL - Clé API Deepgram sans préfixe "dg_". Assurez-vous qu\'elle est toujours valide.');
      }

      // Déterminer le modèle Deepgram : par défaut "general" si non précisé
      const dgModel = import.meta.env.VITE_DEEPGRAM_MODEL ?? 'general';

      // URL optimisée pour discours continu fluide
      let wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&interim_results=true&punctuate=true&smart_format=true&utterance_end_ms=3000&endpointing=1000`;

      console.log('🎙️ COMMERCIAL - URL WebSocket Deepgram:', wsUrl);
      console.log('🎙️ COMMERCIAL - Clé API (10 premiers chars):', deepgramApiKey.substring(0, 10));
      console.log('🎙️ COMMERCIAL - Tentative de connexion WebSocket...');

      // Fonction fallback utilisant l'API REST
      const startRestModeTranscription = () => {
        console.log('🔄 Démarrage transcription mode REST...');
        setIsConnected(true);
        
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 32000
        });
        
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            try {
              const formData = new FormData();
              formData.append('audio', event.data, 'audio.webm');
              
              const response = await fetch(`https://api.deepgram.com/v1/listen?model=nova-2&language=fr&punctuate=true&smart_format=true`, {
                method: 'POST',
                headers: {
                  'Authorization': `Token ${deepgramApiKey}`,
                },
                body: formData
              });
              
              if (response.ok) {
                const result = await response.json();
                const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();
                const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;
                
                if (transcript && transcript.length > 2) {
                  setTranscription(prev => {
                    // Éviter les doublons exacts
                    if (prev.endsWith(transcript)) return prev;
                    
                    // Ajouter simplement
                    return prev + (prev.length > 0 ? ' ' : '') + transcript;
                  });
                  
                  // Envoyer au serveur Node.js
                  if (socketRef.current && userIdRef.current) {
                    socketRef.current.emit('transcription_update', {
                      commercial_id: userIdRef.current,
                      transcript: transcript,
                      is_final: true,
                      timestamp: new Date().toISOString()
                    });
                  }
                }
              }
            } catch (error) {
              console.error('❌ Erreur transcription REST:', error);
            }
          }
        };
        
        mediaRecorder.start(2000); // Chunks de 2 secondes pour meilleur équilibre
        return;
      };

      // Essayer d'abord WebSocket streaming
      try {
        websocketRef.current = new WebSocket(wsUrl, ['token', deepgramApiKey]);
        
        // Timeout pour détecter les échecs de connexion
        const connectionTimeout = setTimeout(() => {
          if (websocketRef.current?.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket timeout - Utilisation du mode REST fallback');
            websocketRef.current?.close();
            startRestModeTranscription();
          }
        }, 5000);

        websocketRef.current.addEventListener('open', () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket streaming activé');
          console.log('🎙️ Connexion Deepgram établie');
          setIsConnected(true);
          
          // Configuration optimisée pour conversation continue
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 32000 // Qualité supérieure pour meilleure précision
          });
          
          mediaRecorderRef.current = mediaRecorder;
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
              websocketRef.current.send(event.data);
            }
          };
          
          mediaRecorder.start(250); // Chunks plus larges pour éviter fragmentation
        });

        websocketRef.current.addEventListener('error', () => {
          clearTimeout(connectionTimeout);
          console.warn('⚠️ WebSocket échoué - Basculement vers REST API');
          startRestModeTranscription();
        });

        websocketRef.current.onmessage = (event) => {
          const response = JSON.parse(event.data);
          
          if (response.channel?.alternatives?.[0]?.transcript) {
            const newTranscript = response.channel.alternatives[0].transcript.trim();
            
            // Ignorer les transcriptions vides ou trop courtes
            if (!newTranscript || newTranscript.length < 2) return;
            
            if (response.is_final) {
              // Transcription finale - simple ajout
              setTranscription(prev => {
                // Éviter les doublons exacts
                if (prev.endsWith(newTranscript)) return prev;
                
                // Ajouter simplement avec un espace
                return prev + (prev.length > 0 ? ' ' : '') + newTranscript;
              });
              
              // Envoyer au serveur
              if (socketRef.current && userIdRef.current) {
                console.log('📝 COMMERCIAL - Transcription finale:', newTranscript);
                socketRef.current.emit('transcription_update', {
                  commercial_id: userIdRef.current,
                  transcript: newTranscript,
                  is_final: true,
                  timestamp: new Date().toISOString()
                });
              }
            } else {
              // Transcription temporaire - aperçu simple
              setTranscription(prev => {
                const cleanPrev = prev.replace(/\s*\[.*?\]\s*$/g, '');
                if (newTranscript.length > 3) {
                  return cleanPrev + (cleanPrev.length > 0 ? ' ' : '') + '[' + newTranscript + ']';
                }
                return cleanPrev;
              });
            }
          }
        };

      websocketRef.current.onerror = (error) => {
        console.error('❌ Erreur Deepgram WebSocket:', error);
        console.error('❌ Détails de l\'erreur:', {
          readyState: websocketRef.current?.readyState,
          url: websocketRef.current?.url,
          protocol: websocketRef.current?.protocol
        });
        
        // Vérifier si c'est un problème d'authentification
        if (websocketRef.current?.readyState === WebSocket.CLOSED) {
          console.error('❌ Connexion fermée - Vérifiez votre clé API Deepgram');
          setError('Authentification Deepgram échouée - Vérifiez votre clé API');
        } else {
          setError('Erreur de connexion à Deepgram');
        }
        setIsConnected(false);
      };

      websocketRef.current.onclose = (event) => {
        console.log('🔌 Connexion Deepgram fermée');
        console.log('🔌 Code de fermeture:', event.code);
        console.log('🔌 Raison de fermeture:', event.reason);
        
        // Codes d'erreur spécifiques Deepgram
        if (event.code === 1002) {
          console.error('❌ Erreur protocole WebSocket');
          setError('Erreur de protocole - Vérifiez les paramètres de connexion');
        } else if (event.code === 1006) {
          console.error('❌ Connexion fermée anormalement');
          setError('Connexion fermée anormalement - Problème réseau ou authentification');
        } else if (event.code === 4001) {
          console.error('❌ Clé API invalide');
          setError('Clé API Deepgram invalide');
        } else if (event.code === 4002) {
          console.error('❌ Quota dépassé');
          setError('Quota Deepgram dépassé');
        }
        
        setIsConnected(false);
        };
      } catch (error) {
        console.warn('⚠️ WebSocket non supporté - Utilisation du mode REST');
        startRestModeTranscription();
      }

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