import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommercialDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  prenom: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsString()
  @IsOptional()
  equipeId?: string;

  @IsString()
  @IsNotEmpty()
  managerId: string;
}
