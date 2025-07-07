// src/pages/commercial/DashboardCommercial.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statisticsService } from '@/services/statistics.service'; // Import du service
import StatCard from '@/components/ui-admin/StatCard';
import { Button } from '@/components/ui-admin/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { 
    MapPin, 
    CheckCircle, 
    Percent, 
    DoorOpen, 
    PlayCircle, 
    Clock, 
    PlusCircle,
    BarChart2
} from 'lucide-react';
import { GenericLineChart } from '@/components/charts/GenericLineChart';
import { ZoneFocusMap } from './ZoneFocusMap';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui-admin/skeleton';

// --- MOCK DATA (Gardé pour la carte et les accès rapides qui n'ont pas encore de backend) ---
const mockZoneAssignee = {
    nom: 'Paris 17ème - Batignolles',
    latlng: [48.8839, 2.3184] as [number, number],
    radius: 1000,
    color: '#3b82f6',
};
const mockImmeublesDansZone = [
    { id: 'imm-1', adresse: '123 Rue des Dames', latlng: [48.8855, 2.321] as [number, number] },
    { id: 'imm-2', adresse: '45 Avenue de Clichy', latlng: [48.8865, 2.325] as [number, number] },
];
const mockAccesRapides = [
    { title: "Démarrer une nouvelle prospection", description: "Enregistrer une visite dans un nouvel immeuble.", href: "/commercial/prospecting/nouvelle", icon: PlayCircle },
    { title: "Ajouter un immeuble", description: "Enrichir la base de données de votre secteur.", href: "/commercial/immeubles/ajouter", icon: PlusCircle },
    { title: "Voir tous mes rapports", description: "Consulter l'historique détaillé de vos visites.", href: "/commercial/rapports", icon: BarChart2 }
];

const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[500px] w-full" />
            <Skeleton className="h-[500px] w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
    </div>
);

const CommercialDashboardPage = () => {
    const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]); // Initialisé comme un tableau vide
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !user.id) {
                setError('ID du commercial non disponible.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [statsData, historyData] = await Promise.all([
                    statisticsService.getStatsForCommercial(user.id),
                    statisticsService.getCommercialHistory(user.id),
                ]);
                setStats(statsData);
                setHistory(historyData);
            } catch (err) {
                console.error('Error fetching commercial data:', err);
                setError('Erreur lors du chargement de vos données.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, timeFilter]); // On pourrait ajouter timeFilter ici si l'API le supportait

    const activitePortesData = history.map((item: any) => ({
        name: new Date(item.dateProspection).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        "Portes Visitées": item.nbPortesVisitees,
        "RDV Pris": item.nbRdvPris,
        "Contrats Signés": item.nbContratsSignes,
    })).reverse(); // On inverse pour un ordre chronologique

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }
    
    const currentStats = stats?.kpis || { immeublesVisites: 0, portesVisitees: 0, contratsSignes: 0, tauxDeConversion: 0 };
    const repartitionStatuts = stats?.repartitionStatuts || {};
    const totalPortes = Object.values<number>(repartitionStatuts).reduce((sum, count) => sum + count, 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Tableau de Bord</h1>
                <p className="text-muted-foreground">Bienvenue, {user?.name} ! Voici un résumé de votre activité.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><MapPin className="h-6 w-6 text-primary" /><span>Zone de Prospection Actuelle</span></CardTitle>
                        <CardDescription>Secteur prioritaire pour la semaine en cours.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="text-2xl font-bold text-primary">{mockZoneAssignee.nom}</h3>
                        <p className="text-muted-foreground mt-2">Vous avez {mockImmeublesDansZone.length} immeubles enregistrés dans cette zone.</p>
                        <div className="mt-4 space-y-3">
                            {mockAccesRapides.map(item => (
                                <a href={item.href} key={item.title} className="block">
                                    <Card className="border hover:border-[hsl(var(--winvest-blue-clair))] hover:bg-zinc-50 hover:shadow-sm transition-all group">
                                        <CardHeader className="flex flex-row items-center gap-4 p-3 space-y-0">
                                            <div className="p-2 bg-muted rounded-md"><item.icon className="h-5 w-5 text-primary" /></div>
                                            <div>
                                                <p className="font-semibold group-hover:text-primary transition-colors">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <div className="min-h-[400px]">
                    <ZoneFocusMap zone={mockZoneAssignee} immeubles={mockImmeublesDansZone} />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold">Vos Performances</h2>
                    <div className="flex items-center gap-1 rounded-lg border p-1 bg-white">
                        <Button variant="ghost" onClick={() => setTimeFilter('week')} className={cn("transition-all text-black", timeFilter === 'week' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'hover:bg-zinc-100')}>Cette semaine</Button>
                        <Button variant="ghost" onClick={() => setTimeFilter('month')} className={cn("transition-all text-black", timeFilter === 'month' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'hover:bg-zinc-100')}>Ce mois</Button>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard title="Immeubles Visitées" value={currentStats.immeublesVisites} Icon={MapPin} color="text-blue-500" />
                    <StatCard title="Portes Visitées" value={currentStats.portesVisitees} Icon={DoorOpen} color="text-orange-500" />
                    <StatCard title="Contrats Signés" value={currentStats.contratsSignes} Icon={CheckCircle} color="text-emerald-500" />
                    <StatCard title="Taux de Conversion" value={currentStats.tauxDeConversion} Icon={Percent} color="text-violet-500" suffix="%" />
                    <StatCard title="Heures Travaillées" value={0} Icon={Clock} color="text-amber-500" suffix="h" />
                </div>
            </div>
            
            <GenericLineChart title="Activité de prospection" data={activitePortesData} xAxisDataKey="name" lines={[ { dataKey: 'Portes Visitées', name: "Portes Visitées", stroke: 'hsl(var(--winvest-blue-profond))' }, { dataKey: 'RDV Pris', name: "RDV Pris", stroke: 'hsl(var(--winvest-blue-moyen))' }, { dataKey: 'Contrats Signés', name: "Contrats Signés", stroke: 'hsl(var(--emerald-500))' } ]} />

        </div>
    );
};

export default CommercialDashboardPage;