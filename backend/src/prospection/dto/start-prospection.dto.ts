import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ProspectingMode } from '@prisma/client';

export class StartProspectionDto {
  @IsString()
  @IsNotEmpty()
  commercialId: string;

  @IsString()
  @IsNotEmpty()
  immeubleId: string;

  @IsEnum(ProspectingMode)
  @IsNotEmpty()
  mode: ProspectingMode;

  @IsString()
  @IsOptional()
  partnerId?: string;
}