import axios from 'axios';
import { AssignmentType } from '@/types/enums';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/assignment-goals`;

const getAssignedZonesForCommercial = async (commercialId: string): Promise<any[]> => {
  const response = await axios.get(`${API_URL}/commercial/${commercialId}/zones`);
  return response.data;
};

// On inclut les autres fonctions pour que le service soit complet
const assignZone = async (zoneId: string, assigneeId: string, assigneeType: AssignmentType) => {
  const payload = { zoneId, assigneeId, assignmentType: assigneeType };
  const response = await axios.post(`${API_URL}/assign-zone`, payload);
  return response.data;
};

const setMonthlyGoal = async (commercialId: string, goal: number, month: number, year: number) => {
  const payload = { commercialId, goal, month, year };
  const response = await axios.post(`${API_URL}/set-monthly-goal`, payload);
  return response.data;
};

export const assignmentGoalsService = {
  getAssignedZonesForCommercial,
  assignZone,
  setMonthlyGoal,
};