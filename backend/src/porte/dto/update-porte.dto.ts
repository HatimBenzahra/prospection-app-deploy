import { PartialType } from '@nestjs/mapped-types';
import { CreatePorteDto } from './create-porte.dto';

export class UpdatePorteDto extends PartialType(CreatePorteDto) {}
