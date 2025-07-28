import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Users, Headphones } from 'lucide-react';
import { Button } from '@/components/ui-admin/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui-admin/card';
import { cn } from '@/lib/utils';
import { io } from 'socket.io-client';

interface SimpleAudioListenerProps {
  commercialId?: string;
  commercialName?: string;
  className?: string;
}

export const SimpleAudioListener: React.FC<SimpleAudioListenerProps> = ({
  commercialId,
  commercialName,
  className,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [receivedChunks, setReceivedChunks] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState<Date | null>(null);
  
  const socketRef = useRef<any>(null);

  // Initialiser Socket.IO
  useEffect(() => {
    socketRef.current = io(`https://${window.location.hostname}:3000`, {
      secure: true,
      transports: ['websocket', 'polling'],
      forceNew: true,
      upgrade: true,
    });
    
    socketRef.current.on('connect', () => {
      console.log('✅ Admin socket connected:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 Admin socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('audioData', (data: any) => {
      console.log('📨 Received audio data:', data);
      setLastActivityTime(new Date());
      setReceivedChunks(prev => prev + 1);
      
      // Ici on pourrait traiter les données audio reçues
      if (data.audioData && isListening) {
        console.log('🎵 Processing audio chunk from:', data.userId);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isListening]);

  const startListening = () => {
    if (!commercialId) return;
    
    setIsListening(true);
    setReceivedChunks(0);
    console.log('👂 Started listening to commercial:', commercialId);
  };

  const stopListening = () => {
    setIsListening(false);
    setReceivedChunks(0);
    setIsConnected(false);
    console.log('🔇 Stopped listening to commercial:', commercialId);
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