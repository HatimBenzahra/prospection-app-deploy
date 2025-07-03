import axios from 'axios';

const API_URL = 'http://localhost:3000/portes';

export type PorteFromAPI = {
  id: string;
  numeroPorte: string;
  status: string; // Assuming string for now, can be refined with an enum if available
  nbPassages: number;
  commentaire: string | null;
  immeubleId: string;
};

type CreatePortePayload = {
  numeroPorte: string;
  status: string;
  nbPassages?: number;
  commentaire?: string;
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
