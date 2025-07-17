import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateCommercialImmeubleDto {
  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  codePostal?: string;

  @IsNumber()
  @IsOptional()
  nbPortesTotal?: number;

  @IsNumber()
  @IsOptional()
  nbEtages?: number;

  @IsNumber()
  @IsOptional()
  nbPortesParEtage?: number;

  @IsBoolean()
  @IsOptional()
  hasElevator?: boolean;

  @IsString()
  @IsOptional()
  digicode?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
