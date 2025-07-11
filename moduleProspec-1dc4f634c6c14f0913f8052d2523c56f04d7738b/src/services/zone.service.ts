import axios from 'axios';
import { AssignmentType } from '@/types/enums';

const API_URL = 'http://localhost:3000/zones';

export interface ZoneFromApi {
  id: string;
  nom: string;
  couleur: string;
  latitude: number;
  longitude: number;
  rayonMetres: number;
  createdAt: string;
}

export interface ZoneDetailsFromApi extends ZoneFromApi {
  stats: {
    nbImmeubles: number;
    totalContratsSignes: number;
    totalRdvPris: number;
  };
  immeubles: any[]; // Pour l'instant, on garde any pour la simplicité
  typeAssignation?: AssignmentType;
  equipeId?: string;
  managerId?: string;
  commercialId?: string;
}

const getZones = async (): Promise<ZoneFromApi[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

const getZoneDetails = async (id: string): Promise<ZoneDetailsFromApi> => {
  const response = await axios.get(`${API_URL}/${id}/details`);
  return response.data;
};

const createZone = async (zoneData: any) => {
  const response = await axios.post(API_URL, zoneData);
  return response.data;
};

const updateZone = async (id: string, zoneData: any) => {
  const response = await axios.patch(`${API_URL}/${id}`, zoneData);
  return response.data;
};

const deleteZone = async (id: string) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const zoneService = {
  getZones,
  getZoneDetails,
  createZone,
  updateZone,
  deleteZone,
};
