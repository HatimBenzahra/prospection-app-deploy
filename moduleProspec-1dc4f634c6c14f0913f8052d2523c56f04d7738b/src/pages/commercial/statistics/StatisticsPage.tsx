import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statisticsService } from '@/services/statistics.service';
import StatCard from '@/components/ui-admin/StatCard';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Building, DoorOpen, Handshake, Target, BarChart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui-admin/tooltip';
import { Button } from '@/components/ui-admin/button';

interface CommercialStats {
  kpis: {
    immeublesVisites: number;
    portesVisitees: number;
    contratsSignes: number;
    rdvPris: number;
    tauxDeConversion: number;
  };
  repartitionStatuts: {
    [key: string]: number;
  };
}

interface HistoryEntry {
  id: string;
  adresse: string;
  ville: string;
  dateProspection: string;
  nbPortesVisitees: number;
  nbContratsSignes: number;
  nbRdvPris: number;
  nbRefus: number;
  nbAbsents: number;
  commentaire: string;
  tauxCouverture: number;
}

const CommercialStatisticsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommercialStats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2 rows of 3 cards

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [statsData, historyData] = await Promise.all([
            statisticsService.getStatsForCommercial(user.id),
            statisticsService.getCommercialHistory(user.id),
          ]);
          setStats(statsData);
          setHistory(historyData);
          setError(null);
        } catch (err) {
          setError('Erreur lors de la récupération des données.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const totalPages = Math.ceil(history.length / itemsPerPage);

  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div>Chargement des données...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!stats) {
    return <div>Aucune statistique disponible.</div>;
  }

  const pieData = Object.entries(stats.repartitionStatuts).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  return (
    <div className="container mx-auto p-4 mb-10  mt-4  space-y-6">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart className="h-6 w-6" />
          Vos Statistiques de Performance
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Immeubles Visitées" value={stats.kpis.immeublesVisites} Icon={Building} />
        <StatCard title="Portes Visitées" value={stats.kpis.portesVisitees} Icon={DoorOpen} />
        <StatCard title="Contrats Signés" value={stats.kpis.contratsSignes} Icon={Handshake} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <StatCard title="Taux de Conversion" value={stats.kpis.tauxDeConversion} Icon={Target} suffix="%" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Le taux de conversion représente le rapport entre le nombre de contrats signés et le nombre total de portes visitées.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Statuts</CardTitle>
            <CardDescription>
              Proportion de chaque statut sur l'ensemble des portes prospectées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[550px]">
              <GenericPieChart
                title="Répartition des Statuts"
                data={pieData}
                dataKey="value"
                nameKey="name"
                colors={['#22c55e', '#f97316', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique de Prospection</CardTitle>
            <CardDescription>
              Détail des visites et performances par immeuble.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedHistory.map((item) => (
                <Card key={item.id} className="p-4">
                  <CardTitle className="text-lg mb-2">{item.adresse}, {item.ville}</CardTitle>
                  <p className="text-sm text-gray-600 mb-1">Date Visite: {item.dateProspection ? new Date(item.dateProspection).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-sm text-gray-600 mb-1">Taux Couverture: {item.tauxCouverture}%</p>
                  <p className="text-sm text-gray-600 mb-1">RDV Pris: {item.nbRdvPris}</p>
                  <p className="text-sm text-gray-600">Contrats Signés: {item.nbContratsSignes}</p>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index + 1}
                    variant={currentPage === index + 1 ? "default" : "outline"}
                    onClick={() => handlePageChange(index + 1)}
                    className={currentPage === index + 1 ? "bg-[hsl(var(--winvest-blue-moyen))] text-white hover:bg-[hsl(var(--winvest-blue-moyen))]" : ""}
                  >
                    {index + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommercialStatisticsPage;
