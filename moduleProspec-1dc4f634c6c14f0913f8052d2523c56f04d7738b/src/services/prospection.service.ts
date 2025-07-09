import axios from 'axios';

const API_URL = 'http://localhost:3000/prospection';

interface ImmeubleForProspection {
  id: string;
  adresse: string;
  ville: string;
  codePostal: string;
  nbPortesTotal: number;
  prospectingMode: 'SOLO' | 'DUO';
}

interface StartProspectionDto {
  commercialId: string;
  immeubleId: string;
  mode: 'SOLO' | 'DUO';
  partnerId?: string;
}

interface HandleProspectionRequestDto {
  requestId: string;
  accept: boolean;
}

interface ProspectionRequest {
  id: string;
  immeubleId: string;
  requesterId: string;
  partnerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REFUSED';
  createdAt: string;
}

const getLatestImmeubles = async (commercialId: string): Promise<ImmeubleForProspection[]> => {
  const response = await axios.get(`${API_URL}/latest-immeubles/${commercialId}`);
  return response.data;
};

const startProspection = async (dto: StartProspectionDto) => {
  const response = await axios.post(`${API_URL}/start`, dto);
  return response.data;
};

const handleProspectionRequest = async (dto: HandleProspectionRequestDto) => {
  const response = await axios.post(`${API_URL}/handle-request`, dto);
  return response.data;
};

const getAllProspectionRequests = async (): Promise<ProspectionRequest[]> => {
  const response = await axios.get(`${API_URL}/requests`);
  return response.data;
};

export const prospectionService = {
  getLatestImmeubles,
  startProspection,
  handleProspectionRequest,
  getAllProspectionRequests,
};
