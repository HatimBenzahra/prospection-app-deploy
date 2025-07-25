export interface Commercial {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  equipeId?: string;
  managerId: string;
  currentMonthlyGoal?: number; // Ajouté pour correspondre au schéma Prisma
  historiques: { nbContratsSignes: number }[]; // Ajouté pour correspondre à l'API
  manager?: string;
  equipe?: string;
  classement?: number;
}

export interface Manager {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  nbEquipes?: number; // Rendu optionnel car peut être calculé
  classement?: number; // Rendu optionnel car peut être calculé
  equipes?: {
    id: string;
    nom: string;
    commerciaux?: {
      id: string;
      nom: string;
      prenom: string;
      telephone?: string;
      historiques?: {
        nbContratsSignes: number;
      }[];
    }[];
  }[];
}

export interface Zone {
  id: string;
  name: string;
  assignedTo: string;
  color: string;
  latlng: [number, number];
  radius: number;
  dateCreation: string;
  nbImmeubles: number;
  totalContratsSignes: number;
  totalRdvPris: number;
}


export interface HistoryEntry {
  id: string; // ID de l'entrée d'historique
  immeubleId: string; // L'ID de l'immeuble associé à cette entrée d'historique
  adresse: string;
  ville: string;
  codePostal?: string; // Added for postal code
  dateProspection: string;
  nbPortesVisitees: number;
  totalNbPortesImmeuble?: number; // Added for total doors in the building
  nbContratsSignes: number;
  nbRdvPris: number;
  nbRefus: number;
  nbAbsents: number;
  commentaire: string;
  tauxCouverture: number;
  zoneName?: string; // Added for zone name
}

export interface CommercialDetails {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  equipe: {
    id: string;
    nom: string;
    manager: {
      id: string;
      nom: string;
      prenom: string;
    };
  };
}

export interface CommercialStats {
  commercialInfo: {
    nom: string;
    prenom: string;
    email: string;
  };
  kpis: {
    immeublesVisites: number;
    portesVisitees: number;
    contratsSignes: number;
    rdvPris: number;
    tauxDeConversion: number;
  };
  repartitionStatuts: {
    [key: string]: number;
  };
}
