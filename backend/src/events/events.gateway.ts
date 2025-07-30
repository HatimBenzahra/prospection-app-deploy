import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface LocationUpdateData {
  commercialId: string;
  position: [number, number];
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

interface LocationErrorData {
  commercialId: string;
  error: string;
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: [`https://localhost:5173`, `https://${process.env.CLIENT_HOST || '192.168.1.116'}:5173`],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Stocker les positions des commerciaux en mémoire
  private commercialLocations = new Map<string, LocationUpdateData>();
  private commercialSockets = new Map<string, string>(); // commercialId -> socketId
  private activeStreams = new Map<string, { commercial_id: string; commercial_info: any }>(); // commercialId -> stream info

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`📡 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`📡 Client disconnected: ${client.id}`);
    
    // Trouver le commercial associé à cette socket
    const commercialId = Array.from(this.commercialSockets.entries())
      .find(([_, socketId]) => socketId === client.id)?.[0];
    
    if (commercialId) {
      this.commercialSockets.delete(commercialId);
      this.commercialLocations.delete(commercialId);
      
      // Nettoyer aussi l'état de streaming si le commercial était en train de streamer
      if (this.activeStreams.has(commercialId)) {
        console.log(`🎤 Commercial ${commercialId} se déconnecte pendant le streaming`);
        this.activeStreams.delete(commercialId);
        this.server.to('audio-streaming').emit('stop_streaming', { commercial_id: commercialId });
      }
      
      this.server.to('gps-tracking').emit('commercialOffline', commercialId);
      console.log(`📍 Commercial ${commercialId} hors ligne`);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    console.log(`📡 Client ${client.id} joined room: ${room}`);
    
    // Si c'est la room de tracking GPS, envoyer les positions actuelles
    if (room === 'gps-tracking') {
      this.commercialLocations.forEach((location, commercialId) => {
        client.emit('locationUpdate', location);
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    console.log(`📡 Client ${client.id} left room: ${room}`);
  }

  @SubscribeMessage('locationUpdate')
  handleLocationUpdate(client: Socket, data: LocationUpdateData) {
    console.log(`📍 Position reçue de ${data.commercialId}:`, {
      lat: data.position[0],
      lng: data.position[1],
      speed: data.speed
    });

    // Stocker la position
    this.commercialLocations.set(data.commercialId, data);
    this.commercialSockets.set(data.commercialId, client.id);

    // Diffuser la mise à jour aux admins
    this.server.to('gps-tracking').emit('locationUpdate', data);
  }

  @SubscribeMessage('locationError')
  handleLocationError(client: Socket, data: LocationErrorData) {
    console.log(`❌ Erreur GPS pour ${data.commercialId}:`, data.error);
    
    // Diffuser l'erreur aux admins
    this.server.to('gps-tracking').emit('locationError', data);
  }

  @SubscribeMessage('commercialOffline')
  handleCommercialOffline(client: Socket, commercialId: string) {
    console.log(`📍 Commercial ${commercialId} se déconnecte`);
    
    this.commercialLocations.delete(commercialId);
    this.commercialSockets.delete(commercialId);
    
    // Notifier les admins
    this.server.to('gps-tracking').emit('commercialOffline', commercialId);
  }

  // Gestion des événements audio streaming
  @SubscribeMessage('start_streaming')
  handleStartStreaming(client: Socket, data: { commercial_id: string; commercial_info?: any }) {
    console.log(`🎤 Commercial ${data.commercial_id} démarre le streaming`);
    
    // Stocker l'état du stream actif
    this.activeStreams.set(data.commercial_id, {
      commercial_id: data.commercial_id,
      commercial_info: data.commercial_info || {}
    });
    
    // Diffuser aux admins dans la room audio-streaming
    this.server.to('audio-streaming').emit('start_streaming', data);
  }

  @SubscribeMessage('stop_streaming')
  handleStopStreaming(client: Socket, data: { commercial_id: string }) {
    console.log(`🎤 Commercial ${data.commercial_id} arrête le streaming`);
    
    // Supprimer l'état du stream actif
    this.activeStreams.delete(data.commercial_id);
    
    // Diffuser aux admins dans la room audio-streaming
    this.server.to('audio-streaming').emit('stop_streaming', data);
  }

  // Gestion de la demande de synchronisation des streams
  @SubscribeMessage('request_streaming_status')
  handleRequestStreamingStatus(client: Socket) {
    console.log(`🔄 Demande de synchronisation des streams actifs de ${client.id}`);
    
    const activeStreamsArray = Array.from(this.activeStreams.values());
    console.log(`🔄 Streams actifs:`, activeStreamsArray);
    
    // Envoyer l'état actuel des streams au client qui demande
    client.emit('streaming_status_response', {
      active_streams: activeStreamsArray
    });
  }

  @SubscribeMessage('transcription_update')
  handleTranscriptionUpdate(client: Socket, data: { 
    commercial_id: string; 
    transcript: string; 
    is_final: boolean; 
    timestamp: string 
  }) {
    console.log(`📝 Transcription de ${data.commercial_id}: "${data.transcript}" (final: ${data.is_final})`);
    
    // Diffuser la transcription aux admins dans la room audio-streaming
    this.server.to('audio-streaming').emit('transcription_update', data);
  }

  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Méthode pour obtenir toutes les positions actuelles
  getAllLocations(): LocationUpdateData[] {
    return Array.from(this.commercialLocations.values());
  }

  // Méthode pour obtenir la position d'un commercial spécifique
  getCommercialLocation(commercialId: string): LocationUpdateData | undefined {
    return this.commercialLocations.get(commercialId);
  }
}
