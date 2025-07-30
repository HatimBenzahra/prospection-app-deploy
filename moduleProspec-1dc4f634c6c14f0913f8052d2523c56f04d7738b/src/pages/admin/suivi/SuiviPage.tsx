import { useState, useEffect } from 'react';
import { SuiviMap } from './SuiviMap';
import { createColumns } from './suivi-table/columns';
import { DataTable } from '@/components/data-table/DataTable';
import type { CommercialGPS, Zone } from '@/types/types';
import { commercialService } from '@/services/commercial.service';
import { io, Socket } from 'socket.io-client';
import { useAudioStreaming } from '@/hooks/useAudioStreaming';
import { useAuth } from '@/contexts/AuthContext';
import { Headphones, Volume2, VolumeX, MicOff, Users, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui-admin/button';
import { Slider } from '@/components/ui-admin/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { Badge } from '@/components/ui-admin/badge';
import { Modal } from '@/components/ui-admin/Modal';

const SuiviPage = () => {
  const { user } = useAuth();
  const [commercials, setCommercials] = useState<CommercialGPS[]>([]);
  const [selectedCommercial, setSelectedCommercial] = useState<CommercialGPS | null>(null);
  const [zones] = useState<Zone[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showListeningModal, setShowListeningModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [transcription, setTranscription] = useState('');

  // Configuration du streaming audio - détection automatique du protocole
  const getAudioServerUrl = () => {
    const isHttps = window.location.protocol === 'https:';
    const hostname = import.meta.env.VITE_SERVER_HOST || window.location.hostname;
    const httpsPort = import.meta.env.VITE_PYTHON_HTTPS_PORT || '8443';
    const httpPort = import.meta.env.VITE_PYTHON_HTTP_PORT || '8080';
    
    // Si on est en HTTPS, on utilise HTTPS pour le serveur audio aussi
    if (isHttps) {
      return `https://${hostname}:${httpsPort}`;
    } else {
      return `http://${hostname}:${httpPort}`;
    }
  };

  const audioStreaming = useAudioStreaming({
    serverUrl: getAudioServerUrl(),
    userId: user?.id || '',
    userRole: 'admin',
    userInfo: {
      name: user?.nom || '',
      role: user?.role || 'admin'
    }
  });

  // Initialiser Socket.IO pour recevoir les mises à jour GPS
  useEffect(() => {
    const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || window.location.hostname;
    const API_PORT = import.meta.env.VITE_API_PORT || '3000';
    const socketUrl = `https://${SERVER_HOST}:${API_PORT}`;
    console.log('🔌 Connexion socket admin GPS:', socketUrl);
    
    const socketConnection = io(socketUrl, {
      secure: true,
      transports: ['polling', 'websocket'], // Polling en premier pour mobile
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      rejectUnauthorized: false, // Accepter les certificats auto-signés
    });

    socketConnection.on('connect', () => {
      console.log('✅ Socket connecté pour suivi GPS');
      socketConnection.emit('joinRoom', 'gps-tracking');
      
      // Aussi rejoindre la room pour les événements audio
      socketConnection.emit('joinRoom', 'audio-streaming');
      console.log('✅ Rejoint la room audio-streaming');
    });

    socketConnection.on('locationUpdate', (data: {
      commercialId: string;
      position: [number, number];
      timestamp: string;
      speed?: number;
      heading?: number;
    }) => {
      console.log('📍 Position reçue côté admin:', data);
      setCommercials(prev => {
        const updated = prev.map(commercial => 
          commercial.id === data.commercialId 
            ? {
                ...commercial,
                position: data.position,
                lastUpdate: new Date(data.timestamp),
                speed: data.speed,
                heading: data.heading,
                isOnline: true
              }
            : commercial
        );
        console.log('📊 Commerciaux mis à jour:', updated);
        return updated;
      });
    });

    socketConnection.on('commercialOffline', (commercialId: string) => {
      setCommercials(prev => prev.map(commercial => 
        commercial.id === commercialId 
          ? { ...commercial, isOnline: false }
          : commercial
      ));
    });

    // DEBUG: Écouter tous les événements
    const originalEmit = socketConnection.emit;
    const originalOn = socketConnection.on;
    
    socketConnection.onAny((eventName, ...args) => {
      if (eventName.includes('stream')) {
        console.log('🔍 ADMIN - Événement reçu:', eventName, args);
      }
    });

    // Écouter les événements de streaming audio
    socketConnection.on('start_streaming', (data: { commercial_id: string; commercial_info: any }) => {
      console.log('🎤 ADMIN - Commercial started streaming:', data);
      setCommercials(prev => prev.map(commercial => 
        commercial.id === data.commercial_id 
          ? { ...commercial, isStreaming: true }
          : commercial
      ));
    });

    socketConnection.on('stop_streaming', (data: { commercial_id: string }) => {
      console.log('🎤 ADMIN - Commercial stopped streaming:', data);
      setCommercials(prev => prev.map(commercial => 
        commercial.id === data.commercial_id 
          ? { ...commercial, isStreaming: false }
          : commercial
      ));
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Charger les commerciaux au démarrage
  useEffect(() => {
    const loadCommercials = async () => {
      try {
        const response = await commercialService.getCommerciaux();
        const commercialsData = response.map((c: any) => ({
          id: c.id,
          name: c.nom,
          avatarFallback: c.nom.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          position: null, // Pas de position tant qu'il n'a pas envoyé de GPS
          equipe: c.equipe?.nom || 'Aucune équipe',
          isOnline: false, // Sera mis à jour via Socket.IO
          isStreaming: false, // Sera mis à jour via Socket.IO
          lastUpdate: null, // Pas de lastUpdate tant qu'il n'a pas envoyé de GPS
        }));
        console.log('👥 Commerciaux chargés avec données réelles:', commercialsData);
        setCommercials(commercialsData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des commerciaux:', error);
        setLoading(false);
      }
    };

    loadCommercials();
  }, []);

  // Connecter au serveur de streaming audio
  useEffect(() => {
    if (user?.id) {
      audioStreaming.connect();
    }
    
    return () => {
      audioStreaming.disconnect();
    };
  }, [user?.id]);

  const handleSelectCommercial = (commercial: CommercialGPS) => {
    setSelectedCommercial(commercial);
  };

  const handleShowOnMap = (commercial: CommercialGPS) => {
    setSelectedCommercial(commercial);
    setShowMapModal(true);
  };


  // Vérifier périodiquement les statuts en ligne/hors ligne
  useEffect(() => {
    const checkOnlineStatus = () => {
      setCommercials(prev => prev.map(commercial => {
        // Si jamais de lastUpdate, le commercial n'a jamais été connecté
        if (!commercial.lastUpdate) {
          return commercial;
        }
        
        const timeSinceLastUpdate = new Date().getTime() - commercial.lastUpdate.getTime();
        // Un commercial est considéré hors ligne s'il n'a pas envoyé de position depuis plus de 2 minutes
        const shouldBeOffline = timeSinceLastUpdate > 2 * 60 * 1000;
        
        // Seulement marquer comme hors ligne, pas en ligne (ça vient via Socket.IO)
        if (commercial.isOnline && shouldBeOffline) {
          console.log(`📱 ${commercial.name}: HORS LIGNE (dernière MAJ: ${Math.floor(timeSinceLastUpdate / 1000)}s)`);
          return { ...commercial, isOnline: false };
        }
        return commercial;
      }));
    };

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleStartListening = async (commercialId: string) => {
    console.log('🎧 ADMIN - Démarrage écoute pour commercial ID:', commercialId);
    try {
      await audioStreaming.startListening(commercialId);
      setShowListeningModal(true);
      setTranscription('En attente de transcription...'); // Message initial
      console.log('✅ ADMIN - Écoute démarrée avec succès');
    } catch (error) {
      console.error('❌ ADMIN - Erreur démarrage écoute:', error);
    }
  };

  const handleStopListening = async () => {
    try {
      await audioStreaming.stopListening();
      setShowListeningModal(false);
    } catch (error) {
      console.error('Erreur arrêt écoute:', error);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du suivi GPS...</p>
        </div>
      </div>
    );
  }

  const renderMapModal = () => {
    if (!showMapModal || !selectedCommercial) {
      return null;
    }

    return (
      <Modal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        title={`Position de ${selectedCommercial.name}`}
        maxWidth="max-w-4xl"
      >
        <div className="h-[500px]">
          <SuiviMap 
            zones={zones}
            commercials={commercials}
            onMarkerClick={() => {}}
            selectedCommercialId={selectedCommercial.id}
          />
        </div>
      </Modal>
    );
  };

  const renderListeningModal = () => {
    if (!showListeningModal || !audioStreaming.isListening) {
      return null;
    }

    const listeningCommercial = commercials.find(c => c.id === audioStreaming.currentListeningTo);

    return (
      <Modal
        isOpen={showListeningModal}
        onClose={() => setShowListeningModal(false)}
        title="Écoute en temps réel"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* En-tête avec info du commercial */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-medium">
                  {listeningCommercial?.avatarFallback}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{listeningCommercial?.name}</h3>
                <p className="text-sm text-gray-600">{listeningCommercial?.equipe}</p>
              </div>
            </div>
            <Badge variant="default" className="bg-red-500 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
              LIVE
            </Badge>
          </div>

          {/* Bouton Écouter */}
          <div className="flex justify-center">
            <Button
              onClick={handleStopListening}
              variant="destructive"
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
            >
              <MicOff className="w-5 h-5 mr-2" />
              Arrêter l'écoute
            </Button>
          </div>

          {/* Contrôles audio */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Contrôles audio</span>
              <Badge variant="outline" className="text-xs">
                Volume: {Math.round(audioStreaming.audioVolume * 100)}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <VolumeX className="h-4 w-4 text-gray-500" />
              <Slider
                value={[audioStreaming.audioVolume * 100]}
                onValueChange={(value) => audioStreaming.setVolume(value[0] / 100)}
                max={100}
                min={0}
                step={1}
                className="flex-1 [&>span:first-child]:bg-blue-100 [&>span:first-child>span]:bg-blue-600 [&>span:last-child]:bg-blue-600"
              />
              <Volume2 className="h-4 w-4 text-gray-500" />
            </div>

            {audioStreaming.error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                <strong>Erreur:</strong> {audioStreaming.error}
              </div>
            )}
          </div>

          {/* Zone de transcription */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Transcription automatique</label>
            </div>
            <div className="w-full h-40 p-3 border border-gray-300 rounded-lg bg-gray-50 overflow-y-auto">
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {transcription || "En attente de transcription..."}
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Transcription en temps réel</span>
              <Badge variant="outline" className="text-xs">
                {transcription ? 'Actif' : 'En attente'}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowListeningModal(false)}
            >
              Réduire
            </Button>
            <Button
              variant="default"
              onClick={() => {
                // Ici on pourrait exporter la transcription
                console.log('Transcription exportée:', transcription);
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!transcription || transcription === 'En attente de transcription...'}
            >
              Exporter transcription
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  const onlineCommercials = commercials.filter(c => c.isOnline);

  const columns = createColumns(
    audioStreaming,
    handleStartListening,
    handleShowOnMap,
    handleSelectCommercial
  );

  return (
    <div className="relative space-y-6">
      {/* Statistiques en haut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{commercials.length}</p>
                <p className="text-sm text-gray-600">Total commerciaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-5 h-5 bg-green-500 rounded-full" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{onlineCommercials.length}</p>
                <p className="text-sm text-gray-600">Connectés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Headphones className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {audioStreaming.isListening ? '1' : '0'}
                </p>
                <p className="text-sm text-gray-600">Écoute active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des commerciaux */}
      <div className="w-full">
        <DataTable
          columns={columns}
          data={commercials}
          filterColumnId="name"
          filterPlaceholder="Rechercher un commercial..."
          title="Suivi GPS en temps réel"
          onRowClick={handleSelectCommercial}
        />
      </div>
      
      {renderMapModal()}
      {renderListeningModal()}
    </div>
  );
};

export default SuiviPage;