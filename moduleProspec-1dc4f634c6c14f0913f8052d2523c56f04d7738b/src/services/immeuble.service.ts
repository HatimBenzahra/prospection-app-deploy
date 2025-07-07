import axios from 'axios';

const API_URL = 'http://localhost:3000/immeubles';

export interface ImmeubleFromApi {
  id: string;
  adresse: string;
  ville: string;
  codePostal: string;
  zone: { id: string; nom: string }; // Added id to zone
  prospectors: { id: string; prenom: string; nom: string }[];
  status: string;
  portes: any[];
  historiques: any[];
  latitude: number; // Added latitude
  longitude: number; // Added longitude
}

export interface ImmeubleDetailsFromApi extends ImmeubleFromApi {
  hasElevator: boolean;
  digicode: string | null;
  stats: {
    contratsSignes: number;
    rdvPris: number;
  };
  nbPortesTotal: number;
  prospectingMode: 'SOLO' | 'DUO';
  portes: { id: string; numeroPorte: string; statut: string; passage: number; commentaire: string; nbPassages: number }[];
}

const getImmeubles = async (): Promise<ImmeubleFromApi[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

const getImmeubleDetails = async (id: string): Promise<ImmeubleDetailsFromApi> => {
  const response = await axios.get(`${API_URL}/${id}/details`);
  return response.data;
};

const createImmeuble = async (immeubleData: any) => {
  const response = await axios.post(API_URL, immeubleData);
  return response.data;
};

const updateImmeuble = async (id: string, immeubleData: any) => {
  const response = await axios.patch(`${API_URL}/${id}`, immeubleData);
  return response.data;
};

const deleteImmeuble = async (id: string) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const immeubleService = {
  getImmeubles,
  getImmeubleDetails,
  createImmeuble,
  updateImmeuble,
  deleteImmeuble,
};
