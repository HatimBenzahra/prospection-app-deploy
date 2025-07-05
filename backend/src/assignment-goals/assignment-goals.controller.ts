import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AssignmentGoalsService } from './assignment-goals.service';
import { AssignmentType } from '@prisma/client';

@Controller('assignment-goals')
export class AssignmentGoalsController {
  constructor(private readonly assignmentGoalsService: AssignmentGoalsService) {}

  @Post('assign-zone')
  assignZone(
    @Body('zoneId') zoneId: string,
    @Body('assigneeId') assigneeId: string,
    @Body('assignmentType') assignmentType: AssignmentType,
  ) {
    return this.assignmentGoalsService.assignZone(zoneId, assigneeId, assignmentType);
  }

  @Post('set-monthly-goal')
  setMonthlyGoal(
    @Body('commercialId') commercialId: string,
    @Body('goal') goal: number,
    @Body('month') month: number,
    @Body('year') year: number,
  ) {
    return this.assignmentGoalsService.setMonthlyGoal(commercialId, goal);
  }

  @Get('manager/:managerId/zones')
  getAssignedZonesForManager(@Param('managerId') managerId: string) {
    return this.assignmentGoalsService.getAssignedZonesForManager(managerId);
  }

  @Get('commercial/:commercialId/zones')
  getAssignedZonesForCommercial(@Param('commercialId') commercialId: string) {
    return this.assignmentGoalsService.getAssignedZonesForCommercial(commercialId);
  }

  @Get('zone/:zoneId/commercials')
  getCommercialsInZone(@Param('zoneId') zoneId: string) {
    return this.assignmentGoalsService.getCommercialsInZone(zoneId);
  }
}