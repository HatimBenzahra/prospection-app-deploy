// src/pages/admin/statistiques/StatistiquesPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { statisticsService } from '@/services/statistics.service';
import type { PeriodType, StatEntityType } from '@/services/statistics.service';

// --- Imports des Composants ---
import StatCard from '@/components/ui-admin/StatCard';
import { GenericBarChart } from '@/components/charts/GenericBarChart';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { LeaderboardTable } from './LeaderboardTable';
import { Button } from '@/components/ui-admin/button';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui-admin/select";


// --- Imports des Icônes ---
import { 
    BarChart3, Briefcase, FileSignature, Target
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

    if (loading) return <div>Chargement des statistiques...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!currentData) return <div>Aucune donnée disponible.</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-4 justify-between items-center border-b pb-4">
                <h1 className="text-3xl font-bold tracking-tight">Statistiques Générales</h1>
                <div className="flex items-center gap-2">
                    <Select onValueChange={handleEntityTypeChange} defaultValue="ALL">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrer par type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Général</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="EQUIPE">Équipe</SelectItem>
                            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                        </SelectContent>
                    </Select>

                    {entityType !== 'ALL' && (
                        <Select onValueChange={handleEntityIdChange} value={entityId || 'ALL'} disabled={loadingEntities}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={`Sélectionner ${entityType.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tous</SelectItem>
                                {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="flex items-center gap-1 rounded-lg border p-1 bg-white">
                    <Button variant='ghost' onClick={() => setTimeFilter('WEEK')} className={cn("transition-all", timeFilter === 'WEEK' ? 'bg-blue-100 text-blue-800' : '')}>Cette semaine</Button>
                    <Button variant='ghost' onClick={() => setTimeFilter('MONTH')} className={cn("transition-all", timeFilter === 'MONTH' ? 'bg-blue-100 text-blue-800' : '')}>Ce mois</Button>
                    <Button variant='ghost' onClick={() => setTimeFilter('YEAR')} className={cn("transition-all", timeFilter === 'YEAR' ? 'bg-blue-100 text-blue-800' : '')}>Cette année</Button>
                </div>
            </div>

            <section>
                <h2 className="text-xl font-semibold mb-4 text-zinc-800">Indicateurs de Performance Clés (KPIs)</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Contrats Signés" value={currentData.kpis.contratsSignes} Icon={FileSignature} color="text-emerald-500" />
                    <StatCard title="RDV Pris" value={currentData.kpis.rdvPris} Icon={Briefcase} color="text-sky-500" />
                    <StatCard title="Portes Visitées" value={currentData.kpis.portesVisitees} Icon={BarChart3} color="text-orange-500" />
                    <StatCard title="Taux de Conclusion Global" value={currentData.kpis.tauxConclusionGlobal} Icon={Target} suffix="%" color="text-violet-500" />
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4 text-zinc-800">Classements</h2>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                    <LeaderboardTable title="Top Managers" description="Basé sur le nombre de contrats signés." data={currentData.leaderboards.managers} unit="Contrats" />
                    <LeaderboardTable title="Top Équipes" description="Basé sur le nombre de contrats signés." data={currentData.leaderboards.equipes} unit="Contrats" />
                    <LeaderboardTable title="Top Commerciaux" description="Basé sur le nombre de contrats signés." data={currentData.leaderboards.commerciaux} unit="Contrats" />
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4 text-zinc-800">Visualisations Détaillées</h2>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
                    <div className="lg:col-span-4">
                        <GenericBarChart
                            title="Contrats par Équipe"
                            data={currentData.charts.contratsParEquipe}
                            xAxisDataKey="name"
                            barDataKey="value"
                            fillColor="hsl(var(--primary))"
                        />
                    </div>
                    <div className="lg:col-span-3">
                        <GenericPieChart
                            title="Répartition des Contrats par Manager"
                            data={currentData.charts.repartitionParManager}
                            dataKey="value"
                            nameKey="name"
                            colors={['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))']}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default StatistiquesPage;
