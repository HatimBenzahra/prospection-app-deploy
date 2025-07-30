// frontend-shadcn/src/services/commercial.service.ts
import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/commerciaux`;

export type CommercialFromAPI = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  equipeId?: string;
  managerId: string;
  historiques: { nbContratsSignes: number }[];
};

type CreateCommercialPayload = {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  equipeId?: string;
  managerId: string;
};

type UpdateCommercialPayload = Partial<CreateCommercialPayload>;

// Renommée pour éviter la confusion, mais la fonctionnalité est la même
const getCommerciaux = async (): Promise<CommercialFromAPI[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Récupérer les commerciaux avec leurs données GPS pour le suivi
const getCommerciauxWithGPS = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/gps-tracking`);
    return response.data;
  } catch (error) {
    console.warn('Endpoint GPS non disponible, utilisation des données de base');
    // Fallback vers l'endpoint normal
    const response = await axios.get(API_URL);
    return response.data.map((c: any) => ({
      ...c,
      lastPosition: null,
      lastSeen: null,
      lastSpeed: 0,
      lastHeading: null
    }));
  }
};

const createCommercial = async (data: CreateCommercialPayload): Promise<CommercialFromAPI> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

const updateCommercial = async (id: string, data: UpdateCommercialPayload): Promise<CommercialFromAPI> => {
  const response = await axios.patch(`${API_URL}/${id}`, data);
  return response.data;
};

const deleteCommercial = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

const getCommercialDetails = async (id: string): Promise<any> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const commercialService = {
  getCommerciaux,
  getCommercialDetails,
  createCommercial,
  updateCommercial,
  deleteCommercial,
};