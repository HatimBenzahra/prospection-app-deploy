import { PartialType } from '@nestjs/mapped-types';
import { CreateImmeubleDto } from './create-immeuble.dto';

export class UpdateImmeubleDto extends PartialType(CreateImmeubleDto) {}
