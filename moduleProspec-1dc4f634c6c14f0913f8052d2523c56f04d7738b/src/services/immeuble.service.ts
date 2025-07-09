import axios from 'axios';

const API_URL = 'http://localhost:3000/admin/immeubles';
const COMMERCIAL_API_URL = 'http://localhost:3000/commercial';

export interface ImmeubleFromApi {
  id: string;
  adresse: string;
  ville: string;
  codePostal: string;
  zone: { id: string; nom: string };
  prospectors: { id: string; prenom: string; nom: string }[];
  status: string;
  portes: any[];
  historiques: any[];
  latitude: number;
  longitude: number;
  nbPortesTotal: number;
  hasElevator: boolean;
  digicode: string | null;
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

// Admin functions
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

// Commercial functions
const createImmeubleForCommercial = async (immeubleData: any, commercialId: string) => {
  const response = await axios.post(`${COMMERCIAL_API_URL}/${commercialId}/immeubles`, immeubleData);
  return response.data;
};

const getImmeublesForCommercial = async (commercialId: string): Promise<ImmeubleFromApi[]> => {
  const response = await axios.get(`${COMMERCIAL_API_URL}/${commercialId}/immeubles`);
  return response.data;
};

const getImmeubleByIdForCommercial = async (id: string, commercialId: string): Promise<ImmeubleDetailsFromApi> => {
  const response = await axios.get(`${COMMERCIAL_API_URL}/${commercialId}/immeubles/${id}`);
  return response.data;
};

const updateImmeubleForCommercial = async (id: string, immeubleData: any, commercialId: string) => {
  const response = await axios.patch(`${COMMERCIAL_API_URL}/${commercialId}/immeubles/${id}`, immeubleData);
  return response.data;
};

const deleteImmeubleForCommercial = async (id: string, commercialId: string) => {
  const response = await axios.delete(`${COMMERCIAL_API_URL}/${commercialId}/immeubles/${id}`);
  return response.data;
};

export const immeubleService = {
  // Admin
  getImmeubles,
  getImmeubleDetails,
  createImmeuble,
  updateImmeuble,
  deleteImmeuble,
  // Commercial
  createImmeubleForCommercial,
  getImmeublesForCommercial,
  getImmeubleByIdForCommercial,
  updateImmeubleForCommercial,
  deleteImmeubleForCommercial,
};
