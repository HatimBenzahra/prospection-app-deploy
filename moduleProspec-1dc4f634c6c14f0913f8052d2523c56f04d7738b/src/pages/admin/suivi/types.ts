// src/pages/admin/suivi/types.ts

// Type pour un commercial avec sa localisation GPS
export interface Commercial {
  id: string;
  name: string;
  avatarFallback: string;
  position: [number, number]; // [latitude, longitude]
  equipe: string;
  isOnline: boolean;
  lastUpdate: Date;
  speed?: number; // km/h
  heading?: number; // degrés (0-360)
}

// Type pour une zone géographique
export interface Zone {
  id: string;
  name: string;
  color: string;
  latlng: [number, number];
  radius: number;
}

// Type pour l'historique de position
export interface LocationHistory {
  id: string;
  commercialId: string;
  position: [number, number];
  timestamp: Date;
  speed?: number;
  heading?: number;
}