// src/pages/admin/suivi/SuiviSidebar.tsx
import { AudioPlayer } from './AudioPlayer';
import { HistoryList } from './HistoryList';
import type { Commercial, Transcription } from './types';

interface SuiviSidebarProps {
  activeCommercial: Commercial | null;
  transcriptions: Transcription[];
  commercialsMap: { [id: string]: { name: string; avatarFallback: string } };
  onHistoryItemClick: (transcription: Transcription) => void;
  liveText: string;
  isProspecting: boolean;
  audioChunks: Blob[]; // NOUVEAU
}

export const SuiviSidebar = (props: SuiviSidebarProps) => {
  return (
    <div className="bg-zinc-50 rounded-lg flex flex-col h-full gap-6 p-4 border border-zinc-200 shadow-sm">
      <AudioPlayer 
        activeCommercial={props.activeCommercial}
        liveText={props.liveText}
        isProspecting={props.isProspecting}
        audioChunks={props.audioChunks} // Transmission des données audio
      />
      <HistoryList 
        transcriptions={props.transcriptions} 
        onHistoryItemClick={props.onHistoryItemClick}
        commercials={props.commercialsMap}
      />
    </div>
  );
};