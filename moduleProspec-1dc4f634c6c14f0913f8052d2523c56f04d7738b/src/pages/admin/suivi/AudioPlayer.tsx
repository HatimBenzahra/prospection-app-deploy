// src/pages/admin/suivi/AudioPlayer.tsx
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { Avatar, AvatarFallback } from '@/components/ui-admin/avatar';
import { Slider } from '@/components/ui-admin/slider';
import { Volume2, BarChart, MicOff } from 'lucide-react';
import { type Commercial } from './types';
import { Badge } from '@/components/ui-admin/badge';

interface AudioPlayerProps {
  activeCommercial: Commercial | null;
  liveText: string;
  isProspecting: boolean;
  audioChunks: Blob[];
}

export const AudioPlayer = ({ activeCommercial, liveText, isProspecting, audioChunks }: AudioPlayerProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialise l'AudioContext
  useEffect(() => {
    if (!audioContextRef.current) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
      const gainNode = context.createGain();
      gainNode.connect(context.destination);
      gainNodeRef.current = gainNode;
    }
  }, []);
  
  // Met à jour le volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);


  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      return;
    }
    
    setIsPlaying(true);
    const blob = audioQueueRef.current.shift();
    if (!blob || !audioContextRef.current || !gainNodeRef.current) return;

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);
      source.onended = playNextInQueue; // Joue le prochain morceau quand celui-ci est fini
      source.start();
    } catch (error) {
      console.error("Erreur de décodage audio, passage au suivant.", error);
      playNextInQueue(); // Tente de jouer le prochain
    }
  };

  // Ajoute les nouveaux chunks à la file d'attente et démarre la lecture si nécessaire
  useEffect(() => {
    if (audioChunks.length > 0) {
      audioQueueRef.current.push(...audioChunks);
      if (!isPlaying) {
        playNextInQueue();
      }
    }
  }, [audioChunks, isPlaying]);

  // Réinitialise la file d'attente si le commercial change
  useEffect(() => {
    audioQueueRef.current = [];
    setIsPlaying(false);
  }, [activeCommercial]);


  if (!activeCommercial) {
    return (
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle>Lecteur Audio</CardTitle>
          <CardDescription>Aucun commercial sélectionné.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          <MicOff className="h-12 w-12" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg bg-zinc-200 text-zinc-700">{activeCommercial.avatarFallback}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{activeCommercial.name}</CardTitle>
            <CardDescription>Équipe {activeCommercial.equipe} - {isProspecting ? 'En ligne' : 'Hors ligne'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-zinc-100 border border-zinc-200 p-3 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto text-sm text-zinc-700 transition-colors">
          {isProspecting ? (
            liveText || <span className="italic text-zinc-500">En attente de transcription...</span>
          ) : (
            <span className="italic text-zinc-500">Le commercial n'est pas en prospection.</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
             <Badge variant="outline" className={isProspecting ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800 border-gray-300"}>
                {isProspecting ? <BarChart className="h-4 w-4 mr-2 animate-pulse" /> : <MicOff className="h-4 w-4 mr-2" />}
                {isProspecting ? 'EN DIRECT' : 'HORS LIGNE'}
             </Badge>
          </div>
          <div className="flex items-center gap-2 w-[120px]">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <Slider defaultValue={[volume]} max={100} step={1} onValueChange={(value) => setVolume(value[0])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};