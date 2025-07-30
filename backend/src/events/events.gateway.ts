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
