import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { ProspectionService } from './prospection.service';
import { StartProspectionDto } from './dto/start-prospection.dto';
import { HandleProspectionRequestDto } from './dto/handle-prospection-request.dto';

@Controller('prospection')
export class ProspectionController {
  private readonly logger = new Logger(ProspectionController.name);

  constructor(private readonly prospectionService: ProspectionService){}

  @Post('start')
  startProspection(@Body() startProspectionDto: StartProspectionDto) {
    this.logger.log(`Received startProspectionDto: ${JSON.stringify(startProspectionDto)}`);
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