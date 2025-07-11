import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statisticsService } from '@/services/statistics.service';
import StatCard from '@/components/ui-admin/StatCard';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Building, DoorOpen, Handshake, Target, BarChart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui-admin/tooltip';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui-admin/table';

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
    <div className="container mx-auto p-4 space-y-6">
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
            <div style={{ height: '400px' }}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Immeuble</TableHead>
                  <TableHead>Date Visite</TableHead>
                  <TableHead className="text-center">Taux Couverture</TableHead>
                  <TableHead className="text-center">RDV Pris</TableHead>
                  <TableHead className="text-center">Contrats Signés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.adresse}, {item.ville}</TableCell>
                    <TableCell>{item.dateProspection ? new Date(item.dateProspection).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-center">{item.tauxCouverture}%</TableCell>
                    <TableCell className="text-center">{item.nbRdvPris}</TableCell>
                    <TableCell className="text-center">{item.nbContratsSignes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommercialStatisticsPage;
