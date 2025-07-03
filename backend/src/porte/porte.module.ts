import { Module } from '@nestjs/common';
import { PorteService } from './porte.service';
import { PorteController } from './porte.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PorteController],
  providers: [PorteService],
})
export class PorteModule {}
