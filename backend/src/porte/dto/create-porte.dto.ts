import { PorteStatut } from '@prisma/client';

export class CreatePorteDto {
  numeroPorte: string;
  statut: PorteStatut;
  passage: number;
  commentaire?: string;
  immeubleId: string;
}
