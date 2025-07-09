import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statisticsService } from '@/services/statistics.service';
import { assignmentGoalsService } from '@/services/assignment-goals.service';
import { Button } from '@/components/ui-admin/button';

// --- Composants UI ---
import StatCard from '@/components/ui-admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { CheckCircle, DoorOpen, MapPin, ZapOff, Percent, BarChart, Building } from 'lucide-react';
import { GenericLineChart } from '@/components/charts/GenericLineChart';
import { ZoneFocusMap } from './ZoneFocusMap';
import { GoalProgressCard } from '@/components/ui-commercial/GoalProgressCard';
import { Skeleton } from '@/components/ui-admin/skeleton';

// --- Types ---
interface ZoneData {
    id: string;
    nom: string;
    latitude: number;
    longitude: number;
    rayonMetres: number;
    couleur: string;
}

// --- Composant Squelette ---
const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
    </div>
);

// --- Composant pour Zone non assignée ---
const NoZoneAssigned = () => (
    <Card className="h-full flex flex-col items-center justify-center text-center">
        <CardHeader>
            <ZapOff className="mx-auto h-16 w-16 text-muted-foreground" />
            <CardTitle>Aucune zone assignée</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Aucune zone de prospection ne vous est actuellement assignée pour ce mois.<br />
                Veuillez contacter votre manager.
            </p>
        </CardContent>
    </Card>
);

const CommercialDashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [assignedZone, setAssignedZone] = useState<ZoneData | null>(null);
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
                const [statsData, historyData, zonesData] = await Promise.all([
                    statisticsService.getStatsForCommercial(user.id),
                    statisticsService.getCommercialHistory(user.id),
                    assignmentGoalsService.getAssignedZonesForCommercial(user.id),
                ]);
                setStats(statsData);
                setHistory(historyData);
                setAssignedZone(zonesData.length > 0 ? zonesData[0] : null);
            } catch (err) {
                console.error('Erreur lors du chargement des données du commercial:', err);
                setError('Erreur lors du chargement de vos données.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const activitePortesData = history
        .map((item: any) => ({
            name: new Date(item.dateProspection).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            'Portes Visitées': item.nbPortesVisitees,
            'RDV Pris': item.nbRdvPris,
            'Contrats Signés': item.nbContratsSignes,
        }))
        .reverse();

    if (loading) return <DashboardSkeleton />;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

    const currentStats = stats?.kpis || {};

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-4">
            <div>
                <h1 className="text-3xl font-bold">Tableau de Bord</h1>
                <p className="text-muted-foreground">Bienvenue, {user?.name} ! Voici un résumé de votre activité.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {assignedZone ? (
                    <ZoneFocusMap
                        zone={{
                            nom: assignedZone.nom,
                            latlng: [assignedZone.latitude, assignedZone.longitude],
                            radius: assignedZone.rayonMetres,
                            color: assignedZone.couleur,
                        }}
                        immeubles={[]}
                    />
                ) : (
                    <NoZoneAssigned />
                )}

                <div className="flex flex-col h-full gap-6">
                    <GoalProgressCard
                        title="Objectif du Mois"
                        description="Progression de votre objectif de contrats mensuel."
                        value={currentStats.contratsSignes || 0}
                        total={currentStats.objectifMensuel || 0}
                        className="flex-grow"
                    />
                    <Card className="flex-grow flex flex-col">
                        <CardHeader className="pb-4">
                            <CardTitle>Accès Rapide</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                variant="unstyled"
                                className="w-full sm:w-auto flex items-center gap-2 px-6 py-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition"
                                onClick={() => navigate('/commercial/prospecting')}
                            >
                                <MapPin className="h-6 w-6" />
                                <span className="text-base font-medium">Prospection</span>
                            </Button>
                            <Button
                                variant="unstyled"
                                className="w-full sm:w-auto flex items-center gap-2 px-6 py-4 rounded-xl bg-green-500 text-white hover:bg-green-600 transition"
                                onClick={() => navigate('/commercial/dashboard')}
                            >
                                <BarChart className="h-6 w-6" />
                                <span className="text-base font-medium">Statistiques</span>
                            </Button>
                            <Button
                                variant="unstyled"
                                className="w-full sm:w-auto flex items-center gap-2 px-6 py-4 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition"
                                onClick={() => navigate('/commercial/immeubles')}
                            >
                                <Building className="h-6 w-6" />
                                <span className="text-base font-medium">Immeubles</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Vos Performances Clés</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Immeubles Visitées" value={currentStats.immeublesVisites || 0} Icon={MapPin} color="text-blue-500" />
                    <StatCard title="Portes Visitées" value={currentStats.portesVisitees || 0} Icon={DoorOpen} color="text-orange-500" />
                    <StatCard title="Contrats Signés" value={currentStats.contratsSignes || 0} Icon={CheckCircle} color="text-emerald-500" />
                    <StatCard title="Taux de Conversion" value={currentStats.tauxDeConversion || 0} Icon={Percent} color="text-violet-500" suffix="%" />
                </div>
            </div>

            <GenericLineChart
                title="Activité de Prospection"
                data={activitePortesData}
                xAxisDataKey="name"
                lines={[
                    { dataKey: 'Portes Visitées', name: 'Portes', stroke: 'hsl(var(--winvest-blue-profond))' },
                    { dataKey: 'RDV Pris', name: 'RDV', stroke: 'hsl(var(--winvest-blue-moyen))' },
                    { dataKey: 'Contrats Signés', name: 'Contrats', stroke: 'hsl(var(--emerald-500))' },
                ]}
            />
        </div>
    );
};

export default CommercialDashboardPage;
