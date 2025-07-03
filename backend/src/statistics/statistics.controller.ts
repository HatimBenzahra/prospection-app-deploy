import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PeriodType, StatEntityType } from '@prisma/client';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  getStatistics(
    @Query('period') period: PeriodType,
    @Query('entityType') entityType?: StatEntityType,
    @Query('entityId') entityId?: string,
  ) {
    return this.statisticsService.getStatistics(period, entityType, entityId);
  }
}
