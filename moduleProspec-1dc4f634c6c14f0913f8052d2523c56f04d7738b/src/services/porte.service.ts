import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/portes`;

export type PorteFromAPI = {
  id: string;
  numeroPorte: string;
  statut: string; // Changed 'status' to 'statut'
  nbPassages: number;
  commentaire: string | null;
  immeubleId: string;
};

type CreatePortePayload = {
  numeroPorte: string;
  statut: string;
  nbPassages?: number;
  commentaire?: string;
  repassage?: boolean;
  immeubleId: string;
};

type UpdatePortePayload = Partial<CreatePortePayload>;

const getPortes = async (): Promise<PorteFromAPI[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

const getPorteDetails = async (id: string): Promise<PorteFromAPI> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

const createPorte = async (data: CreatePortePayload): Promise<PorteFromAPI> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

const updatePorte = async (id: string, data: UpdatePortePayload): Promise<PorteFromAPI> => {
  const response = await axios.patch(`${API_URL}/${id}`, data);
  return response.data;
};

const deletePorte = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

export const porteService = {
  getPortes,
  getPorteDetails,
  createPorte,
  updatePorte,
  deletePorte,
};