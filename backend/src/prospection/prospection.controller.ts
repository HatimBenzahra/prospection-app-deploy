import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ProspectionService } from './prospection.service';
import { StartProspectionDto } from './dto/start-prospection.dto';
import { HandleProspectionRequestDto } from './dto/handle-prospection-request.dto';

@Controller('prospection')
export class ProspectionController {
  constructor(private readonly prospectionService: ProspectionService) {}

  @Post('start')
  startProspection(@Body() startProspectionDto: StartProspectionDto) {
    return this.prospectionService.startProspection(startProspectionDto);
  }

  @Post('handle-request')
  handleProspectionRequest(@Body() handleProspectionRequestDto: HandleProspectionRequestDto) {
    return this.prospectionService.handleProspectionRequest(handleProspectionRequestDto);
  }

  @Get('requests/pending/:commercialId')
  getPendingRequestsForCommercial(@Param('commercialId') commercialId: string) {
    return this.prospectionService.getPendingRequestsForCommercial(commercialId);
  }

  @Get('requests/status/:requestId')
  getRequestStatus(@Param('requestId') requestId: string) {
    return this.prospectionService.getRequestStatus(requestId);
  }
} 