import { Module } from '@nestjs/common';
import { AssignmentGoalsService } from './assignment-goals.service';
import { AssignmentGoalsController } from './assignment-goals.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssignmentGoalsController],
  providers: [AssignmentGoalsService],
})
export class AssignmentGoalsModule {}
