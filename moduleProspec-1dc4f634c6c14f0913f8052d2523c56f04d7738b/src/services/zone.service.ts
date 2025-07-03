// frontend-shadcn/src/services/zone.service.ts
import axios from 'axios';
// ...
import { AssignmentType } from '../types/enums'; // <-- CORRECTION
// ...

// Ce que l'API renvoie
export type ZoneFromAPI = {
  id: string;
  nom: string;
  couleur: string | null;
  latitude: number;
  longitude: number;
  rayonMetres: number;
  typeAssignation: AssignmentType;
  equipeId: string | null;
  managerId: string | null;
  commercialId: string | null;
  createdAt: string; // Les dates sont des strings en JSON
};

// Ce qu'on envoie pour créer une zone
type CreateZonePayload = {
  nom: string;
  latitude: number;
  longitude: number;
  rayonMetres: number;
  couleur?: string;
  typeAssignation: AssignmentType;
  assigneeId: string;
};

// Ce qu'on envoie pour mettre à jour
type UpdateZonePayload = {
  nom?: string;
  couleur?: string;
  typeAssignation?: AssignmentType;
  assigneeId?: string;
};


const API_URL = 'http://localhost:3000/zones';

const getZones = async (): Promise<ZoneFromAPI[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

const createZone = async (data: CreateZonePayload): Promise<ZoneFromAPI> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

const updateZone = async (id: string, data: UpdateZonePayload): Promise<ZoneFromAPI> => {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
};

const deleteZone = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

export const zoneService = {
  getZones,
  createZone,
  updateZone,
  deleteZone,
};