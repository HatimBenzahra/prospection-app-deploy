// frontend-shadcn/src/services/commercial.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/commerciaux';

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
  telephone?: string;
  equipeId?: string;
  managerId: string; // Ajout du managerId
};

// AJOUT: Type pour la mise à jour
type UpdateCommercialPayload = Partial<CreateCommercialPayload>;

const getCommerciaux = async (): Promise<CommercialFromAPI[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

const createCommercial = async (data: CreateCommercialPayload): Promise<CommercialFromAPI> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

// AJOUT: Fonction pour mettre à jour un commercial
const updateCommercial = async (id: string, data: UpdateCommercialPayload): Promise<CommercialFromAPI> => {
  const response = await axios.patch(`${API_URL}/${id}`, data);
  return response.data;
};

const deleteCommercial = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
// frontend-shadcn/src/services/commercial.service.ts
// ... (haut du fichier inchangé)

// AJOUT DE LA NOUVELLE FONCTION
const getCommercialDetails = async (id: string): Promise<any> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const commercialService = {
  getCommerciaux,
  getCommercialDetails, // AJOUT
  createCommercial,
  updateCommercial,
  deleteCommercial,
};
