import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { statisticsService } from '@/services/statistics.service';
import { assignmentGoalsService } from '@/services/assignment-goals.service';
import { immeubleService, type ImmeubleFromApi } from '@/services/immeuble.service';
import { Button } from '@/components/ui-admin/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// --- Composants UI ---
import StatCard from '@/components/ui-admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { CheckCircle, DoorOpen, MapPin, ZapOff, Percent, BarChart, Building, ArrowRight, History } from 'lucide-react';
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-1/2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Skeleton className="h-[450px] w-full rounded-xl" />
            </div>
            <div className="space-y-6">
                <Skeleton className="h-[210px] w-full rounded-xl" />
                <Skeleton className="h-[210px] w-full rounded-xl" />
            </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
    </div>
);

// --- Composant pour Zone non assignée ---
const NoZoneAssigned = () => (
    <Card className="h-full flex flex-col items-center justify-center text-center p-8 shadow-lg rounded-2xl border-dashed border-2 border-gray-300 bg-white">
        <CardHeader className="pb-4">
            <ZapOff className="mx-auto h-20 w-20 text-gray-400 mb-4" />
            <CardTitle className="text-2xl font-bold text-gray-800">Aucune zone de prospection</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
            <p className="text-gray-600 leading-relaxed max-w-sm">
                Il semble qu'aucune zone ne vous soit assignée pour le moment. Veuillez contacter votre manager pour commencer à prospecter.
            </p>
        </CardContent>
    </Card>
);

const CommercialDashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [assignedZone, setAssignedZone] = useState<ZoneData | null>(null);
    const [immeubles, setImmeubles] = useState<ImmeubleFromApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
                const [statsData, historyData, zonesData, immeublesData] = await Promise.all([
                    statisticsService.getStatsForCommercial(user.id),
                    statisticsService.getCommercialHistory(user.id),
                    assignmentGoalsService.getAssignedZonesForCommercial(user.id),
                    immeubleService.getImmeublesForCommercial(user.id),
                ]);
                setStats(statsData);
                setHistory(historyData);
                setAssignedZone(zonesData.length > 0 ? zonesData[0] : null);
                setImmeubles(immeublesData);
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
    if (error) return <div className="text-center py-10 text-red-600 bg-red-50 h-screen">{error}</div>;

    const currentStats = stats?.kpis || {};

    const QuickAccessButton = ({ to, icon: Icon, text }: { to: string, icon: React.ElementType, text: string }) => (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
            <Button
                variant="outline"
                className="w-full flex items-center justify-between gap-4 px-6 py-8 rounded-xl bg-white hover:bg-gray-100 hover:shadow-lg transition-all duration-300 shadow-md border-gray-200"
                onClick={() => navigate(to)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-base font-semibold text-gray-800">{text}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
            </Button>
        </motion.div>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            <motion.div 
                className="space-y-8 max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* En-tête de page amélioré */}
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                        Tableau de Bord
                    </h1>
                    <p className="mt-3 text-lg text-gray-600">
                        Bienvenue, {user?.name} ! Voici un résumé de votre activité et de vos objectifs.
                    </p>
                </div>

                {/* Grille principale */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Colonne de gauche (Performances Clés) */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <BarChart className="h-8 w-8 text-primary" />
                            Performances Clés
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard title="Immeubles Visitées" value={currentStats.immeublesVisites || 0} Icon={MapPin} color="text-blue-500" />
                            <StatCard title="Portes Visitées" value={currentStats.portesVisitees || 0} Icon={DoorOpen} color="text-orange-500" />
                            <StatCard title="Contrats Signés" value={currentStats.contratsSignes || 0} Icon={CheckCircle} color="text-emerald-500" />
                            <StatCard title="Taux de Conversion" value={currentStats.tauxDeConversion || 0} Icon={Percent} color="text-violet-500" suffix="%" />
                        </div>
                    </div>

                    {/* Colonne de droite (Objectif et Accès Rapide) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:col-span-2">
                        <GoalProgressCard
                            title="Objectif du Mois"
                            description="Progression de votre objectif de contrats mensuel."
                            value={currentStats.contratsSignes || 0}
                            total={currentStats.objectifMensuel || 0}
                        />
                        <Card className="flex-grow flex flex-col rounded-2xl shadow-lg border-none">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-bold text-gray-800">Accès Rapide</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col items-center justify-center gap-4">
                                <QuickAccessButton to="/commercial/prospecting" icon={MapPin} text="Lancer une Prospection" />
                                <QuickAccessButton to="/commercial/history" icon={History} text="Voir mon Historique" />
                                <QuickAccessButton to="/commercial/immeubles" icon={Building} text="Gérer mes Immeubles" />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Carte déplacée en bas */}
                <Card className="h-[500px] w-full overflow-hidden rounded-2xl shadow-lg border-none">
                    {assignedZone ? (
                        <ZoneFocusMap
                            zone={{
                                nom: assignedZone.nom,
                                latlng: [assignedZone.latitude, assignedZone.longitude],
                                radius: assignedZone.rayonMetres,
                                color: assignedZone.couleur,
                            }}
                            immeubles={immeubles}
                        />
                    ) : (
                        <NoZoneAssigned />
                    )}
                </Card>

                {/* Graphique dans une carte */}
                <Card className="rounded-2xl shadow-lg border-none">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-gray-800">Activité de Prospection</CardTitle>
                        <CardDescription>Evolution de vos visites, RDV et contrats sur la période.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
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
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default CommercialDashboardPage;
