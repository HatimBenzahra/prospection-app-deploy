import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ImmeubleService } from './immeuble.service';
import { CreateImmeubleDto } from './dto/create-immeuble.dto';
import { UpdateImmeubleDto } from './dto/update-immeuble.dto';
import { CreateCommercialImmeubleDto } from './dto/create-commercial-immeuble.dto';
import { UpdateCommercialImmeubleDto } from './dto/update-commercial-immeuble.dto';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: any; // or a more specific type if you know it
}

// Admin Controller
@Controller('admin/immeubles')
// @UseGuards(AuthGuard('jwt-admin')) // Protect all routes in this controller for admins
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

// Commercial Controller
@Controller('commercial/immeubles')
export class CommercialImmeubleController {
  constructor(private readonly immeubleService: ImmeubleService) {}

  @Post()
  create(@Body() createDto: CreateCommercialImmeubleDto, @Request() req: AuthenticatedRequest) {
    const commercialId = req.user.id; // Assuming user ID is on the request
    return this.immeubleService.createForCommercial(createDto, commercialId);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    const commercialId = req.user.id;
    return this.immeubleService.findAllForCommercial(commercialId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const commercialId = req.user.id;
    return this.immeubleService.findOneForCommercial(id, commercialId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCommercialImmeubleDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const commercialId = req.user.id;
    return this.immeubleService.updateForCommercial(id, updateDto, commercialId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const commercialId = req.user.id;
    return this.immeubleService.removeForCommercial(id, commercialId);
  }
}
