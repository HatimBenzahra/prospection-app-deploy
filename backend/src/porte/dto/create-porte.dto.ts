import { PorteStatut } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePorteDto {
  @IsString()
  @IsNotEmpty()
  numeroPorte: string;

  @IsNumber()
  @IsNotEmpty()
  etage: number;

  @IsEnum(PorteStatut)
  @IsNotEmpty()
  statut: PorteStatut;

  @IsNumber()
  @IsNotEmpty()
  passage: number;

  @IsString()
  @IsOptional()
  commentaire?: string;

  @IsString()
  @IsNotEmpty()
  immeubleId: string;
}
