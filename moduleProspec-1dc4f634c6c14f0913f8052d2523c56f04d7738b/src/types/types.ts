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
