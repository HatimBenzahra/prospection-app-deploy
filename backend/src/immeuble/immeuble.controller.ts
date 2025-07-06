import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ImmeubleService } from './immeuble.service';
import { CreateImmeubleDto } from './dto/create-immeuble.dto';
import { UpdateImmeubleDto } from './dto/update-immeuble.dto';

@Controller('immeubles')
export class ImmeubleController {
  constructor(private readonly immeubleService: ImmeubleService) {}

  @Post()
  create(@Body() createImmeubleDto: CreateImmeubleDto) {
    return this.immeubleService.create(createImmeubleDto);
  }

  @Get()
  findAll() {
    return this.immeubleService.findAll();
  }

  @Get(':id/details')
  getImmeubleDetails(@Param('id') id: string) {
    return this.immeubleService.getImmeubleDetails(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.immeubleService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateImmeubleDto: UpdateImmeubleDto,
  ) {
    return this.immeubleService.update(id, updateImmeubleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.immeubleService.remove(id);
  }
}
