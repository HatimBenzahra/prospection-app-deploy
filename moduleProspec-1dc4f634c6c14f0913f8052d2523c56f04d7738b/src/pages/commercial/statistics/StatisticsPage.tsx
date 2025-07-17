import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statisticsService } from '@/services/statistics.service';
import StatCard from '@/components/ui-admin/StatCard';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Building, DoorOpen, Handshake, BarChart, Phone, Percent } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui-admin/tooltip';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui-admin/skeleton';

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

const PageSkeleton = () => (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="space-y-8 animate-pulse max-w-screen-xl mx-auto">
            <Skeleton className="h-12 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Skeleton className="h-[500px] w-full rounded-2xl" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-[500px] w-full rounded-2xl" />
                </div>
            </div>
        </div>
    </div>
);

const statusColors: { [key: string]: string } = {
    CONTRAT: '#22c55e',      // green-500
    RDV: '#f59e0b',            // amber-500
    ABSENT: '#6b7280',         // gray-500
    REFUS: '#ef4444',          // red-500
    CURIEUX: '#8b5cf6',        // violet-500
    NON_VISITE: '#a1a1aa',     // zinc-400
};

const CommercialStatisticsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommercialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const statsData = await statisticsService.getStatsForCommercial(user.id);
          setStats(statsData);
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

  const pieData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.repartitionStatuts)
        .map(([name, value]) => ({ name, value: value as number }))
        .filter(item => item.value > 0); // Ne pas afficher les statuts à 0
  }, [stats]);

  const pieColors = useMemo(() => {
    return pieData.map(item => statusColors[item.name] || '#cccccc');
  }, [pieData]);

  if (loading) return <PageSkeleton />;
  if (error) return <div className="text-red-500 text-center p-4 bg-red-50 h-screen">{error}</div>;
  if (!stats) return <div className="text-center py-20 bg-white rounded-2xl shadow-lg">Aucune statistique disponible.</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
        <motion.div 
            className="space-y-8 max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8 pb-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 flex items-center gap-4">
                    <BarChart className="h-10 w-10 text-primary"/>
                    Statistiques de Performance
                </h1>
                <p className="mt-2 text-lg text-gray-600">Analysez vos résultats et suivez votre progression.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Immeubles Visitées" value={stats.kpis.immeublesVisites} Icon={Building} color="text-blue-500" />
                <StatCard title="Portes Visitées" value={stats.kpis.portesVisitees} Icon={DoorOpen} color="text-orange-500" />
                <StatCard title="Contrats Signés" value={stats.kpis.contratsSignes} Icon={Handshake} color="text-green-500" />
                <StatCard title="RDV Pris" value={stats.kpis.rdvPris} Icon={Phone} color="text-yellow-500" />
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="cursor-help">
                                <StatCard title="Taux de Conversion" value={stats.kpis.tauxDeConversion} Icon={Percent} suffix="%" color="text-violet-500" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Rapport entre contrats signés et portes visitées.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <Card className="rounded-2xl shadow-lg border-none">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-800">Répartition des Statuts</CardTitle>
                    <CardDescription>
                        Visualisez la proportion de chaque statut sur l'ensemble de vos portes prospectées.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pieData.length > 0 ? (
                        <div className="h-[450px] w-full">
                            <GenericPieChart
                                title=""
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                colors={pieColors}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-lg font-semibold text-gray-700">Aucune donnée de répartition</p>
                            <p className="text-gray-500">Commencez la prospection pour voir vos statistiques.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    </div>
  );
};

export default CommercialStatisticsPage;

