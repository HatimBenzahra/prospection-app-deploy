// frontend-shadcn/src/pages/admin/suivi/SuiviPage.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { SuiviSidebar } from './SuiviSidebar';
import { SuiviMap } from './SuiviMap';
import { FloatingTranscriptPopup } from './FloatingTranscriptPopup';
import type { Commercial, Transcription, Zone } from './types';

// --- MOCK DATA (inchangé) ---
const MOCK_COMMERCIALS: Commercial[] = [
  { id: 'com-001', name: 'Alice Leroy', avatarFallback: 'AL', position: [48.873, 2.34], equipe: 'Alpha' },
  { id: 'com-002', name: 'Paul Girard', avatarFallback: 'PG', position: [48.858, 2.359], equipe: 'Alpha' },
  { id: 'com-003', name: 'Emma Bonnet', avatarFallback: 'EB', position: [48.887, 2.344], equipe: 'Bêta' },
  { id: 'com-004', name: 'Hugo Moreau', avatarFallback: 'HM', position: [48.865, 2.335], equipe: 'Bêta' },
];
const MOCK_TRANSCRIPTIONS: Transcription[] = [
  { id: 't-1', commercialId: 'com-001', commercialName: 'Alice Leroy', date: new Date(Date.now() - 5 * 60000), snippet: 'Bonjour, je suis Alice de Finanssor. Je vous contacte...', fullText: 'Bonjour, je suis Alice de Finanssor. Je vous contacte au sujet de votre éligibilité à notre nouvelle offre. XXXXXXXXXXXXXXXXXXX XXXXXXXXXXXXX XXXXXXXXXXXXXXXXXXXXXXXX XXXXXXX XXXXXXX SCSFSFS ' },
];
const MOCK_ZONES: Zone[] = [
  { id: 'zone-1', name: 'Opéra', color: 'green', latlng: [48.872, 2.34], radius: 1500 },
];

const SuiviPage = () => {
  const [selectedCommercial, setSelectedCommercial] = useState<Commercial | null>(MOCK_COMMERCIALS[0] || null);
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  
  const [liveText, setLiveText] = useState('');
  const [isProspecting, setIsProspecting] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const prospectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => console.log('WebSocket connecté (Admin)');
    ws.onclose = () => console.log('WebSocket déconnecté (Admin)');

    ws.onmessage = (event) => {
      // Gérer les données audio binaires
      if (event.data instanceof Blob) {
        setAudioChunks(prev => [...prev, event.data]);
        return;
      }
      
      // Gérer les données texte (transcription)
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'LIVE_TRANSCRIPT' && data.payload.commercialId === selectedCommercial?.id) {
          setIsProspecting(true);
          setLiveText(data.payload.text);

          if (prospectingTimeoutRef.current) clearTimeout(prospectingTimeoutRef.current);
          prospectingTimeoutRef.current = setTimeout(() => {
            setIsProspecting(false);
          }, 3000);
        }
      } catch (error) {
          // Si ce n'est pas du JSON, on l'ignore (ça pourrait être un message de ping/pong, etc.)
      }
    };

    return () => {
      ws.close();
      if(prospectingTimeoutRef.current) clearTimeout(prospectingTimeoutRef.current);
    };
  }, [selectedCommercial]);
  
  // Vider les chunks audio à chaque fois qu'on en reçoit de nouveaux pour éviter une accumulation infinie
  useEffect(() => {
    if(audioChunks.length > 0) {
        const timer = setTimeout(() => setAudioChunks([]), 0);
        return () => clearTimeout(timer);
    }
  }, [audioChunks]);

  useEffect(() => {
    setLiveText('');
    setIsProspecting(false);
    setAudioChunks([]);
  }, [selectedCommercial]);

  const handleSelectCommercial = (commercial: Commercial) => setSelectedCommercial(commercial);
  const handleHistoryItemClick = (transcription: Transcription) => setSelectedTranscription(transcription);
  const handleClosePopup = () => setSelectedTranscription(null);

  const filteredTranscriptions = useMemo(() => {
    if (!selectedCommercial) return [];
    return MOCK_TRANSCRIPTIONS.filter(t => t.commercialId === selectedCommercial.id);
  }, [selectedCommercial]);
  
  const commercialsMap = useMemo(() => MOCK_COMMERCIALS.reduce((acc, comm) => {
    acc[comm.id] = { name: comm.name, avatarFallback: comm.avatarFallback };
    return acc;
  }, {} as { [id: string]: { name: string; avatarFallback: string } }), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-1 h-full flex flex-col gap-6">
        <SuiviSidebar 
          activeCommercial={selectedCommercial} 
          transcriptions={filteredTranscriptions}
          commercialsMap={commercialsMap}
          onHistoryItemClick={handleHistoryItemClick}
          liveText={liveText}
          isProspecting={isProspecting}
          audioChunks={audioChunks}
        />
      </div>
      
      <div className="lg:col-span-2 h-full relative">
        <SuiviMap 
          zones={MOCK_ZONES} 
          commercials={MOCK_COMMERCIALS}
          onMarkerClick={handleSelectCommercial}
          selectedCommercialId={selectedCommercial?.id}
        />
        {selectedTranscription && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <FloatingTranscriptPopup
              transcription={selectedTranscription}
              onClose={handleClosePopup}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SuiviPage;