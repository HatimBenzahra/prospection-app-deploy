import { useState, useEffect } from 'react';
import { SuiviSidebar } from './SuiviSidebar';
import { SuiviMap } from './SuiviMap';
import type { CommercialGPS, Zone } from '@/types/types';
import { commercialService } from '@/services/commercial.service';
import { io, Socket } from 'socket.io-client';

const SuiviPage = () => {
  const [commercials, setCommercials] = useState<CommercialGPS[]>([]);
  const [selectedCommercial, setSelectedCommercial] = useState<CommercialGPS | null>(null);
  const [zones] = useState<Zone[]>([]);
  const [, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialiser Socket.IO pour recevoir les mises à jour GPS
  useEffect(() => {
    const socketUrl = `https://${window.location.hostname}:3000`;
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
          position: [48.8566, 2.3522] as [number, number], // Position par défaut (Paris)
          equipe: c.equipe?.nom || 'Aucune équipe',
          isOnline: false,
          lastUpdate: new Date(),
        }));
        console.log('👥 Commerciaux chargés:', commercialsData);
        setCommercials(commercialsData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des commerciaux:', error);
        setLoading(false);
      }
    };

    loadCommercials();
  }, []);

  const handleSelectCommercial = (commercial: CommercialGPS) => {
    setSelectedCommercial(commercial);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-1 h-full">
        <SuiviSidebar 
          commercials={commercials}
          selectedCommercial={selectedCommercial}
          onSelectCommercial={handleSelectCommercial}
        />
      </div>
      
      <div className="lg:col-span-2 h-full">
        <SuiviMap 
          zones={zones}
          commercials={commercials}
          onMarkerClick={handleSelectCommercial}
          selectedCommercialId={selectedCommercial?.id}
        />
      </div>
    </div>
  );
};

export default SuiviPage;