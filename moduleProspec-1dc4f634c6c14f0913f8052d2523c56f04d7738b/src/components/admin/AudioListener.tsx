import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Users, Headphones } from 'lucide-react';
import { Button } from '@/components/ui-admin/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui-admin/card';
import { webrtcAudioService } from '@/services/webrtc-audio.service';
import type { StreamingEvent } from '@/services/webrtc-audio.service';
import { cn } from '@/lib/utils';

interface AudioListenerProps {
  commercialId?: string;
  commercialName?: string;
  className?: string;
}

export const AudioListener: React.FC<AudioListenerProps> = ({
  commercialId,
  commercialName,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [receivedChunks, setReceivedChunks] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  useEffect(() => {
    if (!commercialId) return;

    const handleStreamingEvent = (event: StreamingEvent) => {
      setLastActivityTime(new Date());
      
      switch (event.type) {
        case 'audio-chunk':
          if (event.data && isListening) {
            playAudioChunk(event.data);
            setReceivedChunks(prev => prev + 1);
          }
          break;
        case 'stream-start':
          console.log('Commercial started streaming');
          setIsConnected(true);
          break;
        case 'stream-end':
          console.log('Commercial stopped streaming');
          setIsConnected(false);
          break;
        case 'error':
          console.error('Streaming error:', event.error);
          setIsConnected(false);
          break;
      }
    };

    webrtcAudioService.onStreamingEvent(handleStreamingEvent);

    return () => {
      webrtcAudioService.offStreamingEvent(handleStreamingEvent);
      stopListening();
    };
  }, [commercialId, isListening]);

  const setupAudioPlayer = () => {
    if (!audioRef.current) return;

    audioSourceRef.current = new MediaSource();
    audioRef.current.src = URL.createObjectURL(audioSourceRef.current);

    audioSourceRef.current.addEventListener('sourceopen', () => {
      if (!audioSourceRef.current) return;
      
      try {
        sourceBufferRef.current = audioSourceRef.current.addSourceBuffer('audio/webm; codecs="opus"');
        sourceBufferRef.current.addEventListener('updateend', () => {
          // Buffer updated
        });
      } catch (error) {
        console.error('Error setting up source buffer:', error);
      }
    });
  };

  const playAudioChunk = async (arrayBuffer: ArrayBuffer) => {
    if (!sourceBufferRef.current || sourceBufferRef.current.updating) return;

    try {
      const uint8Array = new Uint8Array(arrayBuffer);
      sourceBufferRef.current.appendBuffer(uint8Array);
      
      if (audioRef.current && audioRef.current.paused) {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  };

  const startListening = () => {
    if (!commercialId) return;
    
    setupAudioPlayer();
    setIsListening(true);
    setReceivedChunks(0);
    console.log('Started listening to commercial:', commercialId);
  };

  const stopListening = () => {
    setIsListening(false);
    setReceivedChunks(0);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (audioSourceRef.current && audioSourceRef.current.readyState === 'open') {
      try {
        audioSourceRef.current.endOfStream();
      } catch (error) {
        console.log('MediaSource already closed');
      }
    }
    
    audioSourceRef.current = null;
    sourceBufferRef.current = null;
    console.log('Stopped listening to commercial:', commercialId);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(event.target.value);
    setAudioVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  };

  const formatLastActivity = () => {
    if (!lastActivityTime) return 'Aucune activité';
    
    const now = new Date();
    const diff = now.getTime() - lastActivityTime.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `Il y a ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours}h`;
  };

  return (
    <Card className={cn('bg-white border border-slate-200 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Headphones className="h-5 w-5 text-blue-500" />
          Écoute en direct
          {commercialName && (
            <span className="text-sm font-normal text-slate-600">
              - {commercialName}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Audio element (hidden) */}
        <audio 
          ref={audioRef} 
          controls={false}
          volume={audioVolume}
          className="hidden"
        />
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={!commercialId}
            className={cn(
              'flex items-center gap-2',
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            )}
          >
            {isListening ? (
              <>
                <VolumeX className="h-4 w-4" />
                Arrêter l'écoute
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Démarrer l'écoute
              </>
            )}
          </Button>
          
          {/* Status indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-3 h-3 rounded-full transition-colors duration-200',
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-300'
              )} />
              <span className="text-sm text-slate-600">
                {isConnected ? 'Commercial en ligne' : 'Hors ligne'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">
                {receivedChunks} chunks reçus
              </span>
            </div>
          </div>
        </div>
        
        {/* Volume control */}
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-slate-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audioVolume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${audioVolume * 100}%, #e2e8f0 ${audioVolume * 100}%, #e2e8f0 100%)`
            }}
          />
          <span className="text-sm text-slate-600 min-w-[3rem]">
            {Math.round(audioVolume * 100)}%
          </span>
        </div>
        
        {/* Activity status */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex justify-between items-center text-sm text-slate-600">
            <span>Dernière activité:</span>
            <span className={cn(
              'font-medium',
              isConnected ? 'text-green-600' : 'text-slate-500'
            )}>
              {formatLastActivity()}
            </span>
          </div>
          
          {isListening && (
            <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              🎧 Écoute active - Audio en temps réel
            </div>
          )}
        </div>
        
        {!commercialId && (
          <div className="text-center text-slate-500 text-sm py-4 bg-slate-50 rounded-lg">
            Sélectionnez un commercial pour commencer l'écoute
          </div>
        )}
      </CardContent>
    </Card>
  );
};