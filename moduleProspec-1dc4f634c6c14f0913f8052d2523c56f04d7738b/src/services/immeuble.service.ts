// frontend-shadcn/src/services/immeuble.service.ts
import axios from 'axios';
import type { PorteStatus, ProspectingMode } from '@/types/enums';

const API_URL = 'http://localhost:3000/immeubles';

// Ce que l'API renvoie pour la liste (j'ajoute aussi les champs ici pour la cohérence)
export type ImmeubleFromAPI = {
  id: string;
  adresse: string;
  ville: string;
  codePostal: string;
  status: "A_VISITER" | "VISITE" | "RDV_PRIS" | "INACCESSIBLE";
  nbPortesTotal: number;
  latitude: number;
  longitude: number;
  zoneId: string;
  dateDerniereVisite: string | null;
  zone: { nom: string } | null;
  prospecteurs: { id: string; prenom: string; nom: string }[];
  // Ajout des champs manquants pour la liste aussi
  modeProspection: ProspectingMode;
  hasElevator: boolean;
  digicode: string | null;
};

// Ce que l'API renvoie pour les détails
export type PorteFromAPI = {
    id: string;
    numeroPorte: string;
    status: PorteStatus;
    nbPassages: number;
    commentaire: string | null;
};
export type ImmeubleDetailsFromAPI = ImmeubleFromAPI & {
    portes: PorteFromAPI[];
};

type UpdatePortePayload = {
    status?: PorteStatus;
    commentaire?: string;
};

const getImmeubles = async (): Promise<ImmeubleFromAPI[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

const getImmeubleDetails = async (id: string): Promise<ImmeubleDetailsFromAPI> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

const updatePorte = async (porteId: string, data: UpdatePortePayload): Promise<PorteFromAPI> => {
    const response = await axios.patch(`${API_URL}/portes/${porteId}`, data);
    return response.data;
};

export const immeubleService = {
  getImmeubles,
  getImmeubleDetails,
  updatePorte,
};