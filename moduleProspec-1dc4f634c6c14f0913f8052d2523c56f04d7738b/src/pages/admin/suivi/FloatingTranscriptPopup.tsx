// src/pages/admin/suivi/FloatingTranscriptPopup.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { Button } from '@/components/ui-admin/button';
import { ScrollArea } from '@/components/ui-admin/scroll-area';
import { X } from 'lucide-react';
import type { Transcription } from './types';

interface FloatingTranscriptPopupProps {
  transcription: Transcription | null;
  onClose: () => void;
}

export const FloatingTranscriptPopup = ({ transcription, onClose }: FloatingTranscriptPopupProps) => {
  if (!transcription) {
    return null;
  }

  return (
    // AMÉLIORATION : Le conteneur ne gère plus la position, seulement l'animation et la taille.
    // La classe `pointer-events-auto` est cruciale pour rendre la carte cliquable.
    <div className="w-full max-w-lg pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-300">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-zinc-200/80 flex flex-col h-[calc(100vh-12rem)] max-h-[650px]">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-zinc-200/80">
          <div>
            {/* AMÉLIORATION : Typographie du titre et de la description */}
            <CardTitle className="text-lg font-bold text-zinc-800 tracking-tight">
              Appel de {transcription.commercialName}
            </CardTitle>
            <CardDescription className="text-xs tracking-wider uppercase text-zinc-500 mt-1">
              {transcription.date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </div>
          {/* AMÉLIORATION : Style du bouton de fermeture */}
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 rounded-full">
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </Button>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            {/* AMÉLIORATION : Typographie du contenu pour meilleure lisibilité */}
            <p className="text-base whitespace-pre-wrap leading-relaxed text-zinc-700 p-6">
              {transcription.fullText}
            </p>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};