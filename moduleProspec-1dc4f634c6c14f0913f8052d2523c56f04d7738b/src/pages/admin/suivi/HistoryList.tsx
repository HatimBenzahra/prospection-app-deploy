// src/pages/admin/suivi/HistoryList.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { ScrollArea } from '@/components/ui-admin/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui-admin/avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Transcription } from './types';
import { ArchiveX } from 'lucide-react'; // Importer une icône pour l'état vide

interface HistoryListProps {
  transcriptions: Transcription[];
  onHistoryItemClick: (transcription: Transcription) => void;
  commercials: { [id: string]: { name: string; avatarFallback: string } };
}

export const HistoryList = ({ transcriptions, onHistoryItemClick, commercials }: HistoryListProps) => {
  return (
    <Card className="flex-1 flex flex-col h-full bg-white shadow-md">
      <CardHeader>
        <CardTitle>Historique des transcriptions</CardTitle>
        <CardDescription>Derniers appels enregistrés pour ce commercial.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {transcriptions.length > 0 ? (
            <div className="space-y-0">
              {transcriptions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onHistoryItemClick(item)}
                  // AMÉLIORATION : Style de chaque item de la liste
                  className="flex items-start gap-4 p-4 border-b border-zinc-200 hover:bg-zinc-100 cursor-pointer transition-colors"
                >
                  <Avatar>
                    <AvatarFallback className="bg-zinc-200 text-zinc-700">
                      {commercials[item.commercialId]?.avatarFallback || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{item.commercialName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(item.date, { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.snippet}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // AMÉLIORATION : Gestion de l'état vide
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                <ArchiveX className="h-12 w-12 mb-4" />
                <p className="font-semibold">Aucun historique</p>
                <p className="text-sm">Aucun appel n'a été enregistré pour ce commercial.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};