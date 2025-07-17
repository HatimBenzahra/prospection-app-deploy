import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateImmeubleDto } from './dto/create-immeuble.dto';
import { UpdateImmeubleDto } from './dto/update-immeuble.dto';
import { CreateCommercialImmeubleDto } from './dto/create-commercial-immeuble.dto';
import { UpdateCommercialImmeubleDto } from './dto/update-commercial-immeuble.dto';
import { ImmeubleStatus, ProspectingMode, PorteStatut } from '@prisma/client';

@Injectable()
export class ImmeubleService {
  constructor(private prisma: PrismaService) {}

  // Admin methods
  create(createImmeubleDto: CreateImmeubleDto) {
    const { nbEtages, nbPortesParEtage, prospectorsIds, ...rest } = createImmeubleDto;
    const portesData = [];
    if (nbEtages && nbPortesParEtage) {
      for (let etage = 1; etage <= nbEtages; etage++) {
        for (let porteNum = 1; porteNum <= nbPortesParEtage; porteNum++) {
          portesData.push({
            numeroPorte: `Porte ${porteNum}`,
            etage: etage,
            statut: PorteStatut.NON_VISITE,
            passage: 0,
          });
        }
      }
    }

    return this.prisma.immeuble.create({
      data: {
        ...rest,
        nbEtages: nbEtages,
        nbPortesParEtage: nbPortesParEtage,
        prospectors: {
          connect: prospectorsIds?.map((id) => ({ id })),
        },
        portes: {
          createMany: {
            data: portesData,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.immeuble.findMany({
      include: { zone: true, prospectors: true, portes: true, historiques: true },
    });
  }

  findOne(id: string) {
    return this.prisma.immeuble.findUnique({
      where: { id },
      include: { zone: true, prospectors: true, portes: true, historiques: true },
    });
  }

  update(id: string, updateImmeubleDto: UpdateImmeubleDto) {
    const { prospectorsIds, ...rest } = updateImmeubleDto;
    const data = {
      ...rest,
      ...(prospectorsIds && {
        prospectors: {
          set: prospectorsIds.map((id) => ({ id })),
        },
      }),
    };
    return this.prisma.immeuble.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (prisma) => {
      // First, delete all portes associated with the immeuble
      await prisma.porte.deleteMany({
        where: { immeubleId: id },
      });

      // Delete all historiques associated with the immeuble
      await prisma.historiqueProspection.deleteMany({
        where: { immeubleId: id },
      });

      // Delete all prospection requests associated with the immeuble
      await prisma.prospectionRequest.deleteMany({
        where: { immeubleId: id },
      });

      // Then, delete the immeuble itself
      return prisma.immeuble.delete({
        where: { id },
      });
    });
  }

  // Commercial methods
  async createForCommercial(createDto: Omit<CreateCommercialImmeubleDto, 'commercialId'>, commercialId: string) {
    const commercial = await this.prisma.commercial.findUnique({
      where: { id: commercialId },
    });

    if (!commercial) {
      throw new NotFoundException(`Commercial with ID ${commercialId} not found.`);
    }

    const zone = await this.prisma.zone.findFirst({
      where: { commercialId: commercialId },
    });

    if (!zone) {
      throw new NotFoundException(`No zone found for commercial with ID ${commercialId}. An immeuble must be associated with a zone.`);
    }

    const { nbEtages, nbPortesParEtage, ...rest } = createDto;
    const calculatedNbPortesTotal = (nbEtages || 0) * (nbPortesParEtage || 0);
    const portesData = [];
    if (nbEtages && nbPortesParEtage) {
      for (let etage = 1; etage <= nbEtages; etage++) {
        for (let porteNum = 1; porteNum <= nbPortesParEtage; porteNum++) {
          portesData.push({
            numeroPorte: `Porte ${porteNum}`,
            etage: etage,
            statut: PorteStatut.NON_VISITE,
            passage: 0,
          });
        }
      }
    }

    return this.prisma.immeuble.create({
      data: {
        ...rest,
        nbEtages: nbEtages,
        nbPortesParEtage: nbPortesParEtage,
        nbPortesTotal: calculatedNbPortesTotal,
        zoneId: zone.id,
        prospectingMode: ProspectingMode.SOLO,
        status: ImmeubleStatus.A_VISITER,
        prospectors: {
          connect: { id: commercialId },
        },
        portes: {
          createMany: {
            data: portesData,
          },
        },
      },
    });
  }

  findAllForCommercial(commercialId: string) {
    return this.prisma.immeuble.findMany({
      where: {
        prospectors: {
          some: {
            id: commercialId,
          },
        },
      },
      include: {
        zone: true,
        prospectors: true,
        portes: true, // Include portes here
      },
    });
  }

  async findOneForCommercial(id: string, commercialId: string) {
    const immeuble = await this.prisma.immeuble.findFirst({
      where: {
        id,
        prospectors: {
          some: {
            id: commercialId,
          },
        },
      },
      include: {
        zone: true,
        prospectors: true,
        portes: true,
      },
    });

    if (!immeuble) {
      throw new NotFoundException(`Immeuble with ID ${id} not found or not assigned to you.`);
    }
    return immeuble;
  }

  async updateForCommercial(id: string, updateDto: UpdateCommercialImmeubleDto, commercialId: string) {
    await this.findOneForCommercial(id, commercialId); // Authorization check
    return this.prisma.immeuble.update({
      where: { id },
      data: updateDto,
    });
  }

  async removeForCommercial(id: string, commercialId: string) {
    await this.findOneForCommercial(id, commercialId); // Authorization check

    return this.prisma.$transaction(async (prisma) => {
      // First, delete all portes associated with the immeuble
      await prisma.porte.deleteMany({
        where: { immeubleId: id },
      });

      // Then, delete the immeuble itself
      return prisma.immeuble.delete({
        where: { id },
      });
    });
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

    return {
      ...immeuble,
      stats,
      portes: immeuble.portes,
    };
  }
}
