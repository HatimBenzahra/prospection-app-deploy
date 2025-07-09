import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class HandleProspectionRequestDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsBoolean()
  @IsNotEmpty()
  accept: boolean;
}