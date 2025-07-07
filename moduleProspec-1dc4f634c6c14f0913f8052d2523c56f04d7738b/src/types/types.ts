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
}

export interface Manager {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
}

export interface Zone {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
  rayonMetres: number;
  couleur: string;
  createdAt: string;
}