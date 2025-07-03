import { Module } from '@nestjs/common';
import { ImmeubleService } from './immeuble.service';
import { ImmeubleController } from './immeuble.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImmeubleController],
  providers: [ImmeubleService],
})
export class ImmeubleModule {}
