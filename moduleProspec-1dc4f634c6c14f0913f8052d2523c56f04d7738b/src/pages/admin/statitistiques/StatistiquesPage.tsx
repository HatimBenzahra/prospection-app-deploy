// src/pages/admin/statistiques/StatistiquesPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { statisticsService } from '@/services/statistics.service';
import type { PeriodType, StatEntityType } from '@/services/statistics.service';
import { motion } from 'framer-motion';

// --- Imports des Composants ---
import StatCard from '@/components/ui-admin/StatCard';
import { GenericBarChart } from '@/components/charts/GenericBarChart';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { LeaderboardTable } from './LeaderboardTable';
import { Button } from '@/components/ui-admin/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui-admin/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { StatistiquesSkeleton } from './StatistiquesSkeleton';

// --- Imports des Icônes ---
import { 
    BarChart3, Briefcase, FileSignature, Target, X
} from 'lucide-react';
import { managerService } from '@/services/manager.service';
import { equipeService } from '@/services/equipe.service';
import { commercialService } from '@/services/commercial.service';

const StatistiquesPage = () => {
    const [timeFilter, setTimeFilter] = useState<PeriodType>('MONTH');
    const [entityType, setEntityType] = useState<StatEntityType | 'ALL'>('ALL');
    const [entityId, setEntityId] = useState<string | undefined>(undefined);
    
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [entities, setEntities] = useState<{ id: string, nom: string }[]>([]);
    const [loadingEntities, setLoadingEntities] = useState(false);

    useEffect(() => {
        const fetchEntities = async () => {
            if (entityType === 'ALL') {
                setEntities([]);
                setEntityId(undefined);
                return;
            }
            setLoadingEntities(true);
            try {
                let data: any[] = [];
                if (entityType === 'MANAGER') {
                    data = await managerService.getManagers();
                } else if (entityType === 'EQUIPE') {
                    data = await equipeService.getEquipes();
                } else if (entityType === 'COMMERCIAL') {
                    data = await commercialService.getCommerciaux();
                }
                setEntities(data.map((e: any) => ({ id: e.id, nom: e.nom || `${e.prenom} ${e.nom}` })));
            } catch (err) {
                console.error("Failed to fetch entities:", err);
                setEntities([]);
            } finally {
                setLoadingEntities(false);
            }
        };

        fetchEntities();
    }, [entityType]);

    useEffect(() => {
        const fetchStatistics = async () => {
            setLoading(true);
            setError(null);
            try {
                const query = {
                    period: timeFilter,
                    ...(entityType !== 'ALL' && { entityType }),
                    ...(entityType !== 'ALL' && entityId && { entityId }),
                };
                const data = await statisticsService.getStatistics(query);
                setStatsData(data);
            } catch (err) {
                setError("Impossible de charger les statistiques.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, [timeFilter, entityType, entityId]);

    const handleEntityTypeChange = (value: string) => {
        setEntityType(value as StatEntityType | 'ALL');
        setEntityId(undefined); // Reset entityId when type changes
    };

    const handleEntityIdChange = (value: string) => {
        setEntityId(value === 'ALL' ? undefined : value);
    };

    const currentData = useMemo(() => {
        if (!statsData) return null;
        
        const kpis = {
            contratsSignes: statsData.totalContrats ?? 0,
            rdvPris: statsData.totalRdv ?? 0,
            tauxConclusionGlobal: statsData.tauxConclusion ?? 0,
            portesVisitees: statsData.totalPortesVisitees ?? 0,
        };

        const mapToPerformer = (item: any, index: number) => ({
            rank: index + 1,
            name: item.name,
            avatar: item.name.substring(0, 2).toUpperCase(),
            value: item.value,
            change: 0, // La propriété 'change' n'est pas fournie par l'API
        });

        const leaderboards = {
            managers: statsData.leaderboards?.managers.map(mapToPerformer) ?? [],
            equipes: statsData.leaderboards?.equipes.map(mapToPerformer) ?? [],
            commerciaux: statsData.leaderboards?.commerciaux.map(mapToPerformer) ?? [],
        };

        const charts = {
            contratsParEquipe: statsData.contratsParEquipe ?? [],
            repartitionParManager: statsData.repartitionParManager ?? [],
        };

        return { kpis, leaderboards, charts };
    }, [statsData]);

    if (loading) return <StatistiquesSkeleton />;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!currentData) return <div>Aucune donnée disponible.</div>;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 p-8 bg-white min-h-screen font-sans"
        >
            <div className="flex flex-wrap gap-6 justify-between items-center pb-6 border-b border-gray-200">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Tableau de Bord des Statistiques</h1>
                <div className="flex items-center gap-3">
                    {entityType === 'ALL' ? (
                        <Select onValueChange={handleEntityTypeChange} value={entityType}>
                            <SelectTrigger className="w-[200px] h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200">
                                <SelectValue placeholder="Filtrer par type d'entité" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg shadow-lg">
                                <SelectItem value="ALL">Toutes les Entités</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="EQUIPE">Équipe</SelectItem>
                                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Select onValueChange={handleEntityIdChange} value={entityId || 'ALL'} disabled={loadingEntities}>
                                <SelectTrigger className="w-[200px] h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200">
                                    <SelectValue placeholder="Choisir lequel" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg shadow-lg">
                                    <SelectItem value="ALL">Tous</SelectItem>
                                    {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setEntityType('ALL');
                                    setEntityId(undefined);
                                }}
                                className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 flex items-center justify-center p-0"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 p-1 bg-white rounded-xl shadow-sm border border-gray-200">
                    <Button 
                        variant='ghost' 
                        onClick={() => setTimeFilter('WEEK')} 
                        className={cn(
                            "px-5 py-2 rounded-lg text-base font-medium transition-all duration-300", 
                            timeFilter === 'WEEK' 
                                ? 'bg-[hsl(var(--winvest-blue-moyen))] text-white shadow-md hover:bg-[hsl(var(--winvest-blue-moyen))] hover:text-white' 
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                    >Cette semaine</Button>
                    <Button 
                        variant='ghost' 
                        onClick={() => setTimeFilter('MONTH')} 
                        className={cn(
                            "px-5 py-2 rounded-lg text-base font-medium transition-all duration-300", 
                            timeFilter === 'MONTH' 
                                ? 'bg-[hsl(var(--winvest-blue-moyen))] text-white shadow-md hover:bg-[hsl(var(--winvest-blue-moyen))] hover:text-white' 
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                    >Ce mois</Button>
                    <Button 
                        variant='ghost' 
                        onClick={() => setTimeFilter('YEAR')} 
                        className={cn(
                            "px-5 py-2 rounded-lg text-base font-medium transition-all duration-300", 
                            timeFilter === 'YEAR' 
                                ? 'bg-[hsl(var(--winvest-blue-moyen))] text-white shadow-md hover:bg-[hsl(var(--winvest-blue-moyen))] hover:text-white' 
                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                    >Cette année</Button>
                </div>
            </div>

            <section className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Indicateurs Clés de Performance (KPIs)</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Contrats Signés" value={currentData.kpis.contratsSignes} Icon={FileSignature} color="text-emerald-600" />
                    <StatCard title="RDV Pris" value={currentData.kpis.rdvPris} Icon={Briefcase} color="text-sky-600" />
                    <StatCard title="Portes Visitées" value={currentData.kpis.portesVisitees} Icon={BarChart3} color="text-orange-600" />
                    <StatCard title="Taux de Conclusion Global" value={currentData.kpis.tauxConclusionGlobal} Icon={Target} suffix="%" color="text-violet-600" />
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 mt-8">
                {/* Main Content Column (Charts) */}
                <div className="space-y-6">
                    <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
                        <CardHeader className="bg-gray-50 border-b border-gray-200 py-4 px-6">
                            <CardTitle className="text-lg font-semibold text-gray-800">Contrats par Équipe</CardTitle>
                            <CardDescription className="text-sm text-gray-600">Répartition des contrats signés par équipe.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <GenericBarChart
                                title="Contrats par Équipe"
                                data={currentData.charts.contratsParEquipe}
                                xAxisDataKey="name"
                                barDataKey="value"
                                fillColor="hsl(var(--winvest-blue-moyen))"
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
                        <CardHeader className="bg-gray-50 border-b border-gray-200 py-4 px-6">
                            <CardTitle className="text-lg font-semibold text-gray-800">Répartition des Contrats par Manager</CardTitle>
                            <CardDescription className="text-sm text-gray-600">Pourcentage des contrats attribués à chaque manager.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <GenericPieChart
                                title="Répartition des Contrats par Manager"
                                data={currentData.charts.repartitionParManager}
                                dataKey="value"
                                nameKey="name"
                                colors={['hsl(var(--winvest-blue-moyen))', 'hsl(var(--winvest-blue-clair))', 'hsl(var(--winvest-blue-nuit))', 'hsl(var(--winvest-blue-profond))']}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <section className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Classements</h2>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                    <LeaderboardTable title="Top Managers" description="Basé sur le nombre de contrats signés par leurs équipes." data={currentData.leaderboards.managers} unit="Contrats" />
                    <LeaderboardTable title="Top Équipes" description="Basé sur le nombre total de contrats signés." data={currentData.leaderboards.equipes} unit="Contrats" />
                    <LeaderboardTable title="Top Commerciaux" description="Basé sur leurs contrats signés individuels." data={currentData.leaderboards.commerciaux} unit="Contrats" />
                </div>
            </section>
        </motion.div>
    );
};

export default StatistiquesPage;