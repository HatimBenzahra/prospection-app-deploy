import { AssignmentType } from '@prisma/client';

export class CreateZoneDto {
  nom: string;
  latitude: number;
  longitude: number;
  rayonMetres: number;
  couleur: string;
  typeAssignation: AssignmentType;
  equipeId?: string;
  managerId?: string;
  commercialId?: string;
}
