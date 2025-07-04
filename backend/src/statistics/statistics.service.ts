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
        historiques: {
          include: {
            immeuble: true,
          },
        },
      },
    });

    if (!commercial) {
      throw new NotFoundException(`Commercial with ID ${commercialId} not found`);
    }

    const immeubleIds = commercial.historiques.map((h) => h.immeubleId);

    const statusCounts = await this.prisma.porte.groupBy({
      by: ['statut'],
      where: {
        immeubleId: {
          in: immeubleIds,
        },
      },
      _count: {
        statut: true,
      },
    });

    const repartitionStatuts = statusCounts.reduce((acc, current) => {
      acc[current.statut] = current._count.statut;
      return acc;
    }, {} as Record<PorteStatut, number>);

    const totalPortesVisitees = await this.prisma.porte.count({
      where: {
        immeubleId: {
          in: immeubleIds,
        },
        statut: { not: 'NON_VISITE' },
      },
    });

    const totalContratsSignes = repartitionStatuts.CONTRAT_SIGNE || 0;
    const tauxDeConversion = totalPortesVisitees > 0 ? (totalContratsSignes / totalPortesVisitees) * 100 : 0;

    return {
      commercialInfo: {
        nom: commercial.nom,
        prenom: commercial.prenom,
        email: commercial.email,
      },
      kpis: {
        immeublesVisites: commercial.historiques.length,
        portesVisitees: totalPortesVisitees,
        contratsSignes: totalContratsSignes,
        rdvPris: commercial.historiques.reduce((sum, entry) => sum + entry.nbRdvPris, 0),
        tauxDeConversion: parseFloat(Math.min(tauxDeConversion, 100).toFixed(2)),
      },
      repartitionStatuts,
    };
  }

  async getStatistics(
    period: PeriodType,
    entityType?: StatEntityType,
    entityId?: string,
  ) {
    // This is a placeholder. Real implementation will involve complex Prisma queries
    // to calculate KPIs, leaderboard, history, and performance data based on period and entity filters.
    // For now, returning mock-like data structure.

    const kpis = {
      contratsSignes: { value: 120, change: 10 },
      rdvPris: { value: 300, change: 5 },
      tauxConclusion: { value: 40, change: 2 },
      tauxRepassage: { value: 70, change: -3 },
    };

    const leaderboard = [
      { rank: 1, name: 'Alice Leroy', avatar: 'AL', value: 25, change: 5 },
      { rank: 2, name: 'Paul Bernard', avatar: 'PB', value: 20, change: 3 },
      { rank: 3, name: 'Chloe Petit', avatar: 'CP', value: 18, change: 1 },
    ];

    const history = [
      { name: 'Jan', Contrats: 10, RDV: 30 },
      { name: 'Feb', Contrats: 12, RDV: 35 },
      { name: 'Mar', Contrats: 15, RDV: 40 },
    ];

    const performanceData = [
      { name: 'Alice', contrats: 25, rdv_sans_contrat: 10 },
      { name: 'Paul', contrats: 20, rdv_sans_contrat: 15 },
      { name: 'Chloe', contrats: 18, rdv_sans_contrat: 12 },
    ];

    const performanceParRegion = [
      { name: 'Nord', value: 50 },
      { name: 'Sud', value: 30 },
      { name: 'Est', value: 20 },
    ];

    return {
      kpis,
      leaderboard,
      history,
      performanceData,
      performanceParRegion,
    };
  }
}
