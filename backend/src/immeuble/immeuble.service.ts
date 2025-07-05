import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImmeubleDto } from './dto/create-immeuble.dto';
import { UpdateImmeubleDto } from './dto/update-immeuble.dto';

@Injectable()
export class ImmeubleService {
  constructor(private prisma: PrismaService) {}

  create(createImmeubleDto: CreateImmeubleDto) {
    return this.prisma.immeuble.create({ data: createImmeubleDto });
  }

  findAll() {
    return this.prisma.immeuble.findMany({ include: { zone: true, prospectors: true } });
  }

  findOne(id: string) {
    return this.prisma.immeuble.findUnique({ where: { id }, include: { zone: true, prospectors: true, portes: true } });
  }

  async getImmeubleDetails(immeubleId: string) {
    const immeuble = await this.prisma.immeuble.findUnique({
      where: { id: immeubleId },
      include: {
        prospectors: true,
        portes: true,
        historiques: true,
        zone: true,
      },
    });

    if (!immeuble) {
      throw new NotFoundException(`Immeuble with ID ${immeubleId} not found`);
    }

    const stats = immeuble.historiques.reduce(
      (acc, h) => {
        acc.contratsSignes += h.nbContratsSignes;
        acc.rdvPris += h.nbRdvPris;
        return acc;
      },
      { contratsSignes: 0, rdvPris: 0 },
    );

    let portesAffichees = immeuble.portes;
    if (immeuble.prospectingMode === 'SOLO') {
      // Pour SOLO, on ne filtre que sur le papier, mais on les affiche toutes
      // La logique de filtrage pair/impair sera sur le front si nécessaire
    } else if (immeuble.prospectingMode === 'DUO') {
        // Aucune filtration spécifique ici, on les affiche toutes
    }

    return {
      ...immeuble,
      stats,
      portes: portesAffichees,
    };
  }

  update(id: string, updateImmeubleDto: UpdateImmeubleDto) {
    return this.prisma.immeuble.update({ where: { id }, data: updateImmeubleDto });
  }

  remove(id: string) {
    return this.prisma.immeuble.delete({ where: { id } });
  }
}
