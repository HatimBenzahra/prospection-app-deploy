
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateCommercialImmeubleDto {
  @IsString()
  @IsNotEmpty()
  adresse: string;

  @IsString()
  @IsNotEmpty()
  ville: string;

  @IsString()
  @IsNotEmpty()
  codePostal: string;

  

  @IsNumber()
  @IsNotEmpty()
  nbEtages: number;

  @IsNumber()
  @IsNotEmpty()
  nbPortesParEtage: number;

  @IsBoolean()
  @IsNotEmpty()
  hasElevator: boolean;

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
