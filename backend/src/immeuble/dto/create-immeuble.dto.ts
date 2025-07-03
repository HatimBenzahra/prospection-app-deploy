import { ImmeubleStatus, ProspectingMode } from '@prisma/client';

export class CreateImmeubleDto {
  adresse: string;
  ville: string;
  codePostal: string;
  status?: ImmeubleStatus;
  nbPortesTotal: number;
  prospectingMode: ProspectingMode;
  dateDerniereVisite?: Date;
  zoneId: string;
  latitude: number;
  longitude: number;
  hasElevator: boolean;
  digicode?: string;
  prospectorsIds?: string[];
}
