// src/pages/admin/suivi/types.ts

// Type pour un commercial, peut être enrichi
export interface Commercial {
    id: string;
    name: string;
    avatarFallback: string;
    position: [number, number]; // [latitude, longitude]
    equipe: string;
  }
  
  // Type pour une entrée de l'historique des transcriptions
  export interface Transcription {
    id: string;
    commercialId: string;
    commercialName: string;
    date: Date;
    snippet: string; // Un extrait de la transcription
    fullText: string; // La transcription complète
  }
  
  // Type pour une zone géographique
  export interface Zone {
    id: string;
    name: string;
    color: string;
    latlng: [number, number];
    radius: number;
  }