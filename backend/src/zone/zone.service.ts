import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.zone.findUnique({
      where: { id },
      include: { equipe: true, manager: true, commercial: true },
    });
  }

  async getZoneDetails(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        immeubles: {
          include: {
            historiques: true,
            prospectors: true,
          },
        },
        equipe: true,
        manager: true,
        commercial: true,
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    const stats = zone.immeubles.reduce(
      (acc, immeuble) => {
        acc.nbImmeubles++;
        const immeubleStats = immeuble.historiques.reduce(
          (iAcc, h) => {
            iAcc.contratsSignes += h.nbContratsSignes;
            iAcc.rdvPris += h.nbRdvPris;
            return iAcc;
          },
          { contratsSignes: 0, rdvPris: 0 },
        );
        acc.totalContratsSignes += immeubleStats.contratsSignes;
        acc.totalRdvPris += immeubleStats.rdvPris;
        return acc;
      },
      { nbImmeubles: 0, totalContratsSignes: 0, totalRdvPris: 0 },
    );

    return {
      ...zone,
      stats,
    };
  }

  update(id: string, updateZoneDto: UpdateZoneDto) {
    return this.prisma.zone.update({ where: { id }, data: updateZoneDto });
  }

  remove(id: string) {
    return this.prisma.zone.delete({ where: { id } });
  }
}
