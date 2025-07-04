import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PeriodType, StatEntityType, PorteStatut } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getProspectingHistoryForCommercial(commercialId: string) {
    const historyEntries = await this.prisma.historiqueProspection.findMany({
      where: {
        commercialId: commercialId,
      },
      include: {
        immeuble: true, // Include related Immeuble data
      },
      orderBy: {
        dateProspection: 'desc',
      },
    });

    if (!historyEntries.length) {
      return [];
    }

    return historyEntries.map(entry => ({
      id: entry.id,
      adresse: entry.immeuble.adresse,
      ville: entry.immeuble.ville,
      dateProspection: entry.dateProspection,
      nbPortesVisitees: entry.nbPortesVisitees,
      nbContratsSignes: entry.nbContratsSignes,
      nbRdvPris: entry.nbRdvPris,
      nbRefus: entry.nbRefus,
      nbAbsents: entry.nbAbsents,
      commentaire: entry.commentaire,
      // Calculate tauxCouverture based on nbPortesVisitees and immeuble.nbPortesTotal
      tauxCouverture: entry.immeuble.nbPortesTotal > 0 ? Math.min((entry.nbPortesVisitees / entry.immeuble.nbPortesTotal) * 100, 100) : 0,
    }));
  }

  async getStatsForCommercial(commercialId: string) {
    const commercial = await this.prisma.commercial.findUnique({
      where: { id: commercialId },
      include: {
        historiques: true,
      },
    });

    if (!commercial) {
      throw new NotFoundException(`Commercial with ID ${commercialId} not found`);
    }

    const aggregatedStats = commercial.historiques.reduce(
      (acc, history) => {
        acc.immeublesVisites.add(history.immeubleId);
        acc.portesVisitees += history.nbPortesVisitees;
        acc.contratsSignes += history.nbContratsSignes;
        acc.rdvPris += history.nbRdvPris;
        acc.refus += history.nbRefus;
        acc.absents += history.nbAbsents;
        return acc;
      },
      {
        immeublesVisites: new Set<string>(),
        portesVisitees: 0,
        contratsSignes: 0,
        rdvPris: 0,
        refus: 0,
        absents: 0,
      },
    );

    const tauxDeConversion =
      aggregatedStats.portesVisitees > 0
        ? (aggregatedStats.contratsSignes / aggregatedStats.portesVisitees) * 100
        : 0;

    const repartitionStatuts = {
      [PorteStatut.CONTRAT_SIGNE]: aggregatedStats.contratsSignes,
      [PorteStatut.REFUS]: aggregatedStats.refus,
      [PorteStatut.ABSENT]: aggregatedStats.absents,
    };

    return {
      commercialInfo: {
        nom: commercial.nom,
        prenom: commercial.prenom,
        email: commercial.email,
      },
      kpis: {
        immeublesVisites: aggregatedStats.immeublesVisites.size,
        portesVisitees: aggregatedStats.portesVisitees,
        contratsSignes: aggregatedStats.contratsSignes,
        rdvPris: aggregatedStats.rdvPris,
        tauxDeConversion: parseFloat(Math.min(tauxDeConversion, 100).toFixed(2)),
      },
      repartitionStatuts,
    };
  }

  async getStatsForManager(managerId: string) {
    const managerWithEquipesAndCommerciaux = await this.prisma.manager.findUnique({
      where: { id: managerId },
      include: {
        equipes: {
          include: {
            commerciaux: {
              include: {
                historiques: true,
              },
            },
          },
        },
      },
    });

    if (!managerWithEquipesAndCommerciaux) {
      throw new NotFoundException(`Manager with ID ${managerId} not found`);
    }

    const commercials = managerWithEquipesAndCommerciaux.equipes.flatMap(
      (equipe) => equipe.commerciaux,
    );

    if (!commercials.length) {
      return {
        kpis: {
          contratsSignes: 0,
          rdvPris: 0,
          tauxConclusion: 0,
        },
      };
    }

    const stats = commercials.reduce(
      (acc, commercial) => {
        const commercialStats = commercial.historiques.reduce(
          (commAcc, h) => {
            commAcc.contratsSignes += h.nbContratsSignes;
            commAcc.rdvPris += h.nbRdvPris;
            return commAcc;
          },
          { contratsSignes: 0, rdvPris: 0 },
        );
        acc.totalContratsSignes += commercialStats.contratsSignes;
        acc.totalRdvPris += commercialStats.rdvPris;
        return acc;
      },
      { totalContratsSignes: 0, totalRdvPris: 0 },
    );

    const tauxConclusion =
      stats.totalRdvPris > 0
        ? (stats.totalContratsSignes / stats.totalRdvPris) * 100
        : 0;

    return {
      kpis: {
        contratsSignes: stats.totalContratsSignes,
        rdvPris: stats.totalRdvPris,
        tauxConclusion: parseFloat(tauxConclusion.toFixed(2)),
      },
    };
  }

  async getManagerPerformanceHistory(managerId: string) {
    const histories = await this.prisma.historiqueProspection.findMany({
      where: {
        commercial: {
          equipe: {
            managerId: managerId,
          },
        },
      },
      orderBy: {
        dateProspection: 'asc',
      },
    });

    const monthlyStats = new Map<string, { contrats: number; rdv: number }>();

    histories.forEach((h) => {
      const month = h.dateProspection.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyStats.has(month)) {
        monthlyStats.set(month, { contrats: 0, rdv: 0 });
      }
      const current = monthlyStats.get(month)!;
      current.contrats += h.nbContratsSignes;
      current.rdv += h.nbRdvPris;
    });

    const perfHistory = Array.from(monthlyStats.entries())
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .map(([month, data]) => ({
        name: month,
        perf: data.rdv > 0 ? (data.contrats / data.rdv) * 100 : 0,
      }));

    return perfHistory;
  }

  async getStatistics(
    period: PeriodType,
    entityType?: StatEntityType,
    entityId?: string,
  ) {


  }
}
