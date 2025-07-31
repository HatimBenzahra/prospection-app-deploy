import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

class LocationService {
  private socket: Socket | null = null;
  private watchId: number | null = null;
  private commercialId: string | null = null;
  private isTracking = false;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    const socketUrl = SOCKET_URL;
      
    console.log('🔌 Initialisation socket GPS:', socketUrl);
    
    this.socket = io(socketUrl, {
      secure: true,
      transports: ['polling', 'websocket'], // Polling en premier pour mobile
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true, // Force une nouvelle connexion
      rejectUnauthorized: false, // Accepter les certificats auto-signés
    });

    this.socket.on('connect', () => {
      console.log('📍 Service GPS connecté');
      if (this.commercialId) {
        this.socket?.emit('joinRoom', 'gps-tracking');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('📍 Service GPS déconnecté:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.log('❌ Erreur connexion GPS:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 GPS reconnecté après', attemptNumber, 'tentatives');
      if (this.commercialId) {
        this.socket?.emit('joinRoom', 'gps-tracking');
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.log('❌ Impossible de reconnecter le GPS');
    });
  }

  async startTracking(commercialId: string): Promise<boolean> {
    if (this.isTracking) {
      console.log('📍 Suivi GPS déjà actif');
      return true;
    }

    this.commercialId = commercialId;

    // Vérifier si la géolocalisation est supportée
    if (!navigator.geolocation) {
      console.error('❌ Géolocalisation non supportée par ce navigateur');
      return false;
    }

    // Vérifier HTTPS sur mobile
    if (!window.location.protocol.startsWith('https') && window.location.hostname !== 'localhost') {
      console.error('❌ HTTPS requis pour la géolocalisation sur mobile');
      alert('La géolocalisation nécessite une connexion sécurisée (HTTPS)');
      return false;
    }

    try {
      console.log('📍 Tentative d\'accès à la géolocalisation...');
      
      // Tentative directe d'obtenir la position (cela déclenchera la demande de permission)
      const position = await this.getCurrentPositionWithRetry();
      console.log('✅ Permission GPS accordée et position obtenue');

      // Envoyer la position initiale
      this.sendLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
      });

      // Démarrer le suivi en temps réel
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };

          this.sendLocationUpdate(locationData);
        },
        (error) => {
          console.error('❌ Erreur de géolocalisation:', error.message);
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: false, // Moins précis mais plus rapide
          timeout: 60000, // 60 secondes pour watchPosition
          maximumAge: 120000, // Cache de 2 minutes
        }
      );

      this.isTracking = true;
      console.log('📍 Suivi GPS démarré');
      return true;

    } catch (error) {
      console.error('❌ Impossible d\'obtenir la position:', error);
      return false;
    }
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.socket && this.commercialId) {
      this.socket.emit('commercialOffline', this.commercialId);
    }

    this.isTracking = false;
    this.commercialId = null;
    console.log('📍 Suivi GPS arrêté');
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: false, // Moins précis mais plus rapide sur mobile
          timeout: 45000, // 45 secondes
          maximumAge: 600000, // Cache de 10 minutes pour la première position
        }
      );
    });
  }

  private async getCurrentPositionWithRetry(maxRetries = 3): Promise<GeolocationPosition> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`📍 Tentative GPS ${i + 1}/${maxRetries}...`);
        
        // Configuration adaptée aux mobiles
        const options = {
          enableHighAccuracy: false, // Toujours false pour éviter les problèmes de permission
          timeout: 30000, // 30 secondes
          maximumAge: 300000, // 5 minutes de cache
        };
        
        return await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
      } catch (error) {
        console.log(`❌ Tentative ${i + 1} échouée:`, error);
        if (i === maxRetries - 1) {
          throw error; // Dernière tentative, on lance l'erreur
        }
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Toutes les tentatives ont échoué');
  }

  private sendLocationUpdate(locationData: LocationData) {
    if (!this.socket || !this.commercialId) return;

    const updateData = {
      commercialId: this.commercialId,
      position: [locationData.latitude, locationData.longitude] as [number, number],
      timestamp: new Date(locationData.timestamp).toISOString(),
      speed: locationData.speed,
      heading: locationData.heading,
      accuracy: locationData.accuracy,
    };

    this.socket.emit('locationUpdate', updateData);
    console.log('📍 Position envoyée:', updateData);
  }

  private handleLocationError(error: GeolocationPositionError) {
    let message = '';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Permission de géolocalisation refusée';
        this.showLocationInstructions();
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Position non disponible';
        break;
      case error.TIMEOUT:
        message = 'Timeout de géolocalisation';
        break;
      default:
        message = 'Erreur de géolocalisation inconnue';
        break;
    }

    console.error('❌ Erreur GPS:', message);
    
    // Notifier l'admin que le commercial a un problème GPS
    if (this.socket && this.commercialId) {
      this.socket.emit('locationError', {
        commercialId: this.commercialId,
        error: message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      commercialId: this.commercialId,
      isConnected: this.socket?.connected || false,
    };
  }

  // Méthode pour tester la géolocalisation
  async testGeolocation(): Promise<boolean> {
    try {
      const position = await this.getCurrentPosition();
      console.log('🧪 Test GPS réussi:', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      return true;
    } catch (error) {
      console.error('🧪 Test GPS échoué:', error);
      return false;
    }
  }

  // Méthode pour guider l'utilisateur sur l'activation GPS
  showLocationInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = `
📱 INSTRUCTIONS POUR iOS:
1. Ouvrez Réglages > Confidentialité et sécurité > Service de localisation
2. Activez "Service de localisation"
3. Trouvez Safari dans la liste et sélectionnez "Lors de l'utilisation de l'app"
4. Rechargez cette page et autorisez l'accès à la localisation
      `.trim();
    } else if (isAndroid) {
      instructions = `
📱 INSTRUCTIONS POUR ANDROID:
1. Ouvrez Paramètres > Applications > Chrome (ou votre navigateur)
2. Appuyez sur "Autorisations"
3. Activez "Position"
4. Rechargez cette page et autorisez l'accès à la localisation
      `.trim();
    } else {
      instructions = `
💻 INSTRUCTIONS:
1. Cliquez sur l'icône de localisation dans la barre d'adresse
2. Sélectionnez "Toujours autoriser" ou "Autoriser"
3. Rechargez la page si nécessaire
      `.trim();
    }
    
    console.log(instructions);
    alert(instructions);
  }
}

export const locationService = new LocationService();