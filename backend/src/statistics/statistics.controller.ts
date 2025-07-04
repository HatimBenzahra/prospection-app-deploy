import { Controller, Get, Query, Param } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PeriodType, StatEntityType } from '@prisma/client';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('commercial/:id/history')
  getCommercialHistory(@Param('id') id: string) {
    return this.statisticsService.getProspectingHistoryForCommercial(id);
  }

  @Get('commercial/:id')
  getCommercialStats(@Param('id') id: string) {
    return this.statisticsService.getStatsForCommercial(id);
  }

  @Get('manager/:id')
  getManagerStats(@Param('id') id: string) {
    return this.statisticsService.getStatsForManager(id);
  }

  @Get()
  getStatistics(
    @Query('period') period: PeriodType,
    @Query('entityType') entityType?: StatEntityType,
    @Query('entityId') entityId?: string,
  ) {
    return this.statisticsService.getStatistics(period, entityType, entityId);
  }
}
