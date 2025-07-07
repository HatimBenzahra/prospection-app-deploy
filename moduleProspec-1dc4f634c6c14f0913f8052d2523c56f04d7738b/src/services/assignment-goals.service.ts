import axios from 'axios';
import { AssignmentType } from '@/types/enums';

const API_URL = 'http://localhost:3000/assignment-goals';

interface AssignZonePayload {
  zoneId: string;
  assigneeId: string;
  assigneeType: AssignmentType;
}

interface SetMonthlyGoalPayload {
  commercialId: string;
  goal: number;
  month: number;
  year: number;
}

const assignZone = async (zoneId: string, assigneeId: string, assigneeType: AssignmentType) => {
  const payload: AssignZonePayload = {
    zoneId,
    assigneeId,
    assigneeType,
  };
  const response = await axios.post(`${API_URL}/assign-zone`, payload);
  return response.data;
};

const setMonthlyGoal = async (commercialId: string, goal: number, month: number, year: number) => {
  const payload: SetMonthlyGoalPayload = {
    commercialId,
    goal,
    month,
    year,
  };
  const response = await axios.post(`${API_URL}/set-monthly-goal`, payload);
  return response.data;
};

export const assignmentGoalsService = {
  assignZone,
  setMonthlyGoal,
};
