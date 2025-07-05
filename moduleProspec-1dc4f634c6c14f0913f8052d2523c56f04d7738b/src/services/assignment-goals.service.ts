import axios from 'axios';

export enum AssignmentType {
  COMMERCIAL = 'COMMERCIAL',
  MANAGER = 'MANAGER',
}

const API_URL = 'http://localhost:3000/assignment-goals';

const assignZone = async (zoneId: string, assigneeId: string, assignmentType: AssignmentType) => {
  const response = await axios.post(`${API_URL}/assign-zone`, { zoneId, assigneeId, assignmentType });
  return response.data;
};

const setMonthlyGoal = async (commercialId: string, goal: number, month: number, year: number) => {
  const response = await axios.post(`${API_URL}/set-monthly-goal`, { commercialId, goal, month, year });
  return response.data;
};

const getAssignedZonesForManager = async (managerId: string) => {
  const response = await axios.get(`${API_URL}/manager/${managerId}/zones`);
  return response.data;
};

const getAssignedZonesForCommercial = async (commercialId: string) => {
  const response = await axios.get(`${API_URL}/commercial/${commercialId}/zones`);
  return response.data;
};

const getCommercialsInZone = async (zoneId: string) => {
  const response = await axios.get(`${API_URL}/zone/${zoneId}/commercials`);
  return response.data;
};

export const assignmentGoalsService = {
  assignZone,
  setMonthlyGoal,
  getAssignedZonesForManager,
  getAssignedZonesForCommercial,
  getCommercialsInZone,
};