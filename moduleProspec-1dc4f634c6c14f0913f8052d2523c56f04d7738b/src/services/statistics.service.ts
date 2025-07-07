// frontend-shadcn/src/services/statistics.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/statistics';

// Définition des types pour les filtres
export type PeriodType = 'WEEK' | 'MONTH' | 'YEAR';
export type StatEntityType = 'COMMERCIAL' | 'EQUIPE' | 'MANAGER';

export interface StatisticsQuery {
  period: PeriodType;
  entityType?: StatEntityType;
  entityId?: string;
}

// Le service pour récupérer les statistiques
const getStatistics = async (query: StatisticsQuery) => {
  // On utilise `params` pour qu'axios formate correctement les query params dans l'URL
  const response = await axios.get(API_URL, { params: query });
  return response.data;
};

const getStatsForCommercial = async (commercialId: string) => {
  const response = await axios.get(`${API_URL}/commercial/${commercialId}`);
  return response.data;
};

const getCommercialHistory = async (commercialId: string) => {
  const response = await axios.get(`${API_URL}/commercial/${commercialId}/history`);
  return response.data;
};

const getStatsForManager = async (managerId: string) => {
  const response = await axios.get(`${API_URL}/manager/${managerId}`);
  return response.data;
};

const getManagerPerformanceHistory = async (managerId: string) => {
  const response = await axios.get(`${API_URL}/manager/${managerId}/history`);
  return response.data;
};

export const statisticsService = {
  getStatistics,
  getStatsForCommercial,
  getCommercialHistory,
  getStatsForManager,
  getManagerPerformanceHistory,
};