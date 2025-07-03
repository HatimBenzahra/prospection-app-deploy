// src/pages/admin/commerciaux/CommercialDetailsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, BarChart2, Briefcase, CheckCircle, Target, Building, Trophy,
    Zap, TrendingUp, Shuffle, Clock, XCircle
} from 'lucide-react';

import { Button } from '@/components/ui-admin/button';
import { Skeleton } from '@/components/ui-admin/skeleton';
import StatCard from '@/components/ui-admin/StatCard';
import { GenericLineChart } from '@/components/charts/GenericLineChart';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { commercialService } from '@/services/commercial.service';
import { PeriodType } from '@/types/enums';
import { cn } from '@/lib/utils'; // N'oubliez pas d'importer 'cn'

const CommercialDetailsPage = () => {
    const { commercialId } = useParams<{ commercialId: string }>();
    const navigate = useNavigate();
    const [commercial, setCommercial] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activePreset, setActivePreset] = useState('week');
    const [currentStats, setCurrentStats] = useState<any>(null);

    useEffect(() => {
        if (commercialId) {
            setLoading(true);
            commercialService.getCommercialDetails(commercialId)
                .then(data => {
                    setCommercial(data);
                    setCurrentStats(data.stats?.WEEKLY || {});
                })
                .catch(err => {
                    console.error("Erreur chargement détails commercial:", err);
                    setCommercial(null);
                })
                .finally(() => setLoading(false));
        }
    }, [commercialId]);
    
    const handlePresetClick = (preset: string) => {
        setActivePreset(preset);
        if (!commercial?.stats) return;

        if (preset === 'week') setCurrentStats(commercial.stats.WEEKLY || {});
        if (preset === 'month') setCurrentStats(commercial.stats.MONTHLY || {});
        if (preset === 'year') setCurrentStats(commercial.stats.YEARLY || {});
    };

    const rdvContratsHistory = useMemo(() => [
        { name: 'S-4', rdv: 5, contrats: 1 },
        { name: 'Actuel', rdv: currentStats?.rdvPris || 0, contrats: currentStats?.contratsSignes || 0 }
    ], [currentStats]);
    
    const pieChartData = useMemo(() => {
        if (!currentStats) return [];
        const rdvSansContrat = (currentStats.rdvPris || 0) - (currentStats.contratsSignes || 0);
        return [
            { name: 'Contrats Signés', value: currentStats.contratsSignes || 0 },
            { name: 'RDV sans contrat', value: rdvSansContrat < 0 ? 0 : rdvSansContrat }
        ];
    }, [currentStats]);


    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2"><Skeleton className="h-96 rounded-lg" /><Skeleton className="h-96 rounded-lg" /></div>
            </div>
        )
    }
    if (!commercial || !currentStats) return <div className="p-6">Données du commercial non trouvées.</div>;
    
    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>
            
            <div className="rounded-lg border bg-card text-card-foreground p-6 shadow">
                <h3 className="text-2xl font-semibold">{commercial.prenom} {commercial.nom}</h3>
                <p className="text-sm text-muted-foreground pt-1.5">Équipe : {commercial.equipe.nom} | Manager : {commercial.manager.prenom} {commercial.manager.nom}</p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-4 justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-semibold flex items-baseline gap-3"><BarChart2 className="h-6 w-6 text-primary self-center" /><span>Statistiques de performance</span></h2>
                <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/50">
                    {/* --- CORRECTION DES BOUTONS ICI --- */}
                    <Button 
                        variant='ghost' 
                        className={cn("transition-all", activePreset === 'week' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'text-black hover:bg-zinc-100')} 
                        onClick={() => handlePresetClick('week')}
                    >Cette semaine</Button>
                    <Button 
                        variant='ghost' 
                        className={cn("transition-all", activePreset === 'month' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'text-black hover:bg-zinc-100')} 
                        onClick={() => handlePresetClick('month')}
                    >Ce mois</Button>
                    <Button 
                        variant='ghost' 
                        className={cn("transition-all", activePreset === 'year' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'text-black hover:bg-zinc-100')} 
                        onClick={() => handlePresetClick('year')}
                    >Cette année</Button>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="RDV Pris" value={currentStats.rdvPris || 0} Icon={Briefcase} />
                <StatCard title="Contrats Signés" value={currentStats.contratsSignes || 0} Icon={CheckCircle} />
                <StatCard title="Taux Conclusion" value={currentStats.tauxConclusion || 0} Icon={Target} suffix="%" />
                <StatCard title="Classement Équipe" value={currentStats.classementEquipe || 0} Icon={Trophy} prefix="#" />
                <StatCard title="Taux Transfo." value={currentStats.tauxTransformationPorteRdv || 0} Icon={Shuffle} suffix="%" />
                <StatCard title="Portes Prospectées" value={currentStats.portesProspectees || 0} Icon={Building} />
                <StatCard title="Refus" value={currentStats.refusEnregistres || 0} Icon={XCircle} />
                <StatCard title="Heures Prospect." value={currentStats.heuresProspectees || 0} Icon={Clock} suffix="h" />
                <StatCard title="RDV / Heure" value={currentStats.rdvParHeure || 0} Icon={Zap} />
                <StatCard title="Contrats / Jour" value={0} Icon={TrendingUp} />
            </div>

             <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                 <GenericLineChart title="Historique RDV vs Contrats" data={rdvContratsHistory} xAxisDataKey="name" lines={[{ dataKey: 'rdv', name: "RDV Pris", stroke: "hsl(var(--chart-1))" }, { dataKey: 'contrats', name: "Contrats Signés", stroke: "hsl(var(--chart-5))" }]} />
                 <GenericPieChart title="Répartition des Résultats de RDV" data={pieChartData} dataKey="value" nameKey="name" colors={['hsl(var(--chart-5))', 'hsl(var(--chart-1))']} />
            </div>
        </div>
    );
};

export default CommercialDetailsPage;