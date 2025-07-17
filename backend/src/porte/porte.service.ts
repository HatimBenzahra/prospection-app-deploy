import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePorteDto } from './dto/create-porte.dto';
import { UpdatePorteDto } from './dto/update-porte.dto';
import { PorteStatut } from '@prisma/client';

@Injectable()
export class PorteService {
  constructor(private prisma: PrismaService) {}

  async create(createPorteDto: CreatePorteDto) {
    const newPorte = await this.prisma.porte.create({ data: createPorteDto });

    // Increment nbPortesTotal in the associated Immeuble
    await this.prisma.immeuble.update({
      where: { id: newPorte.immeubleId },
      data: {
        nbPortesTotal: { increment: 1 },
      },
    });

    return newPorte;
  }

  findAll() {
    return this.prisma.porte.findMany();
  }

  findOne(id: string) {
    return this.prisma.porte.findUnique({ where: { id } });
  }

  async update(id: string, updatePorteDto: UpdatePorteDto) {
    return this.prisma.$transaction(async (prisma) => {
      const existingPorte = await prisma.porte.findUnique({
        where: { id },
        select: { statut: true, immeubleId: true, assigneeId: true },
      });

      if (!existingPorte) {
        throw new NotFoundException(`Porte with ID ${id} not found`);
      }

      const updatedPorte = await prisma.porte.update({
        where: { id },
        data: updatePorteDto,
      });

      // Update historical data if status has changed and it's assigned to a commercial
      if (
        existingPorte.statut !== updatedPorte.statut &&
        existingPorte.assigneeId &&
        existingPorte.immeubleId
      ) {
        const commercialId = existingPorte.assigneeId;
        const immeubleId = existingPorte.immeubleId;
        const dateProspection = new Date();
        dateProspection.setHours(0, 0, 0, 0); // Set to beginning of the day

        let nbPortesVisitees = 0;
        let nbContratsSignes = 0;
        let nbRdvPris = 0;
        let nbRefus = 0;
        let nbAbsents = 0;
        let nbCurieux = 0; // Added nbCurieux

        // Determine changes based on new status
        if (updatedPorte.statut === PorteStatut.VISITE) {
          nbPortesVisitees = 1;
        } else if (updatedPorte.statut === PorteStatut.CONTRAT_SIGNE) {
          nbContratsSignes = 1;
          nbPortesVisitees = 1;
        } else if (updatedPorte.statut === PorteStatut.RDV) {
          nbRdvPris = 1;
          nbPortesVisitees = 1;
        } else if (updatedPorte.statut === PorteStatut.REFUS) {
          nbRefus = 1;
          nbPortesVisitees = 1;
        } else if (updatedPorte.statut === PorteStatut.ABSENT) {
          nbAbsents = 1;
          nbPortesVisitees = 1;
        } else if (updatedPorte.statut === PorteStatut.CURIEUX) { // Handle CURIEUX
          nbCurieux = 1;
          nbPortesVisitees = 1;
        }

        // Find or create HistoriqueProspection for today
        const existingHistorique = await prisma.historiqueProspection.findFirst({
          where: {
            commercialId,
            immeubleId,
            dateProspection,
          },
        });

        if (existingHistorique) {
          await prisma.historiqueProspection.update({
            where: { id: existingHistorique.id },
            data: {
              nbPortesVisitees: existingHistorique.nbPortesVisitees + nbPortesVisitees,
              nbContratsSignes: existingHistorique.nbContratsSignes + nbContratsSignes,
              nbRdvPris: existingHistorique.nbRdvPris + nbRdvPris,
              nbRefus: existingHistorique.nbRefus + nbRefus,
              nbAbsents: existingHistorique.nbAbsents + nbAbsents,
              nbCurieux: existingHistorique.nbCurieux + nbCurieux, // Added nbCurieux
            },
          });
        } else {
          await prisma.historiqueProspection.create({
            data: {
              commercialId,
              immeubleId,
              dateProspection,
              nbPortesVisitees,
              nbContratsSignes,
              nbRdvPris,
              nbRefus,
              nbAbsents,
              nbCurieux, // Added nbCurieux
              commentaire: updatePorteDto.commentaire || null,
            },
          });
        }
      }

      return updatedPorte;
    });
  }

  remove(id: string) {
    return this.prisma.porte.delete({ where: { id } });
  }
}
