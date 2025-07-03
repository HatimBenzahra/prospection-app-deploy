// frontend-shadcn/src/services/equipe.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/equipes';

export type EquipeFromAPI = {
  id: string;
  nom: string;
  managerId: string;
};

type CreateEquipePayload = {
  nom: string;
  managerId: string;
};

// AJOUT: Type pour la mise à jour
type UpdateEquipePayload = Partial<CreateEquipePayload>;

const getEquipes = async (): Promise<EquipeFromAPI[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

const createEquipe = async (data: CreateEquipePayload): Promise<EquipeFromAPI> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

// AJOUT: Fonction pour mettre à jour une équipe
const updateEquipe = async (id: string, data: UpdateEquipePayload): Promise<EquipeFromAPI> => {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
};

const deleteEquipe = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

export const equipeService = {
  getEquipes,
  createEquipe,
  updateEquipe, // AJOUT
  deleteEquipe,
};