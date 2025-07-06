import { ImmeubleStatus, ProspectingMode } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDate, IsBoolean, IsArray } from 'class-validator';

export class CreateImmeubleDto {
  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsString()
  @IsNotEmpty()
  ville: string;

  @IsString()
  @IsNotEmpty()
  codePostal: string;

  @IsEnum(ImmeubleStatus)
  @IsOptional()
  status?: ImmeubleStatus;

  @IsNumber()
  @IsNotEmpty()
  nbPortesTotal: number;

  @IsEnum(ProspectingMode)
  @IsNotEmpty()
  prospectingMode: ProspectingMode;

  @IsDate()
  @IsOptional()
  dateDerniereVisite?: Date;

  @IsString()
  @IsNotEmpty()
  zoneId: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsBoolean()
  @IsNotEmpty()
  hasElevator: boolean;

  @IsString()
  @IsOptional()
  digicode?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  prospectorsIds?: string[];
}
