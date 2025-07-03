import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZoneService {
  constructor(private prisma: PrismaService) {}

  create(createZoneDto: CreateZoneDto) {
    return this.prisma.zone.create({ data: createZoneDto });
  }

  findAll() {
    return this.prisma.zone.findMany({
      include: { equipe: true, manager: true, commercial: true },
    });
  }

  findOne(id: string) {
    return this.prisma.zone.findUnique({ where: { id }, include: { equipe: true, manager: true, commercial: true } });
  }

  update(id: string, updateZoneDto: UpdateZoneDto) {
    return this.prisma.zone.update({ where: { id }, data: updateZoneDto });
  }

  remove(id: string) {
    return this.prisma.zone.delete({ where: { id } });
  }
}
