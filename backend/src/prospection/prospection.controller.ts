import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ProspectionService } from './prospection.service';
import { StartProspectionDto } from './dto/start-prospection.dto';
import { HandleProspectionRequestDto } from './dto/handle-prospection-request.dto';

@Controller('prospection')
export class ProspectionController {
  constructor(private readonly prospectionService: ProspectionService) {}

  @Get('latest-immeubles/:commercialId')
  getLatestImmeubles(@Param('commercialId') commercialId: string) {
    return this.prospectionService.getLatestImmeubles(commercialId);
  }

  @Post('start')
  startProspection(@Body() startProspectionDto: StartProspectionDto) {
    return this.prospectionService.startProspection(startProspectionDto);
  }

  @Post('handle-request')
  handleProspectionRequest(@Body() handleProspectionRequestDto: HandleProspectionRequestDto) {
    return this.prospectionService.handleProspectionRequest(handleProspectionRequestDto);
  }
}