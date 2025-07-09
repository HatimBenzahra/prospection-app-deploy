import { Module } from '@nestjs/common';
import { ProspectionService } from './prospection.service';
import { ProspectionController } from './prospection.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProspectionController],
  providers: [ProspectionService],
})
export class ProspectionModule {}