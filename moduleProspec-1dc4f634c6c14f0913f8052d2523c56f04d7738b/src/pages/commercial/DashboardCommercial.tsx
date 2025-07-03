// src/pages/commercial/DashboardCommercialPage.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
// CORRECTION : Rétablissement des chemins d'import spécifiques
import StatCard from '@/components/ui-admin/StatCard';
import { Button } from '@/components/ui-admin/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { 
    MapPin, 
    Briefcase, 
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

// ... (données simulées inchangées)
const CommercialDashboardPage = () => {
    const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = 'http://localhost:3000'; // Assuming backend runs on port 3000

    useEffect(() => {
        const fetchCommercialData = async () => {
            if (!user || !user.id) {
                setError('Commercial ID not available.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const statsResponse = await axios.get(`${API_BASE_URL}/statistics/commercial/${user.id}`);
                setStats(statsResponse.data);

                const historyResponse = await axios.get(`${API_BASE_URL}/statistics/commercial/${user.id}/history`);
                setHistory(historyResponse.data);

            } catch (err) {
                console.error('Error fetching commercial data:', err);
                setError('Failed to load commercial data.');
            } finally {
                setLoading(false);
            }
        };

        fetchCommercialData();
    }, [user]);

    // Transform data for GenericLineChart
    const activitePortesData = history?.map((item: any) => ({
        name: item.adresse, // Or a more appropriate label for the x-axis
        Portes: item.tauxCouverture, // Using tauxCouverture as a proxy for "Portes" for now
        RDV: item.rdvPris,
        Contrats: item.contrats,
    })) || [];

    if (loading) {
        return <div className="text-center py-8">Chargement des données...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    // Use fetched stats and history
    const currentStats = stats?.kpis || { immeublesVisites: 0, portesVisitees: 0, contratsSignes: 0, tauxDeConversion: 0 };
    const repartitionStatuts = stats?.repartitionStatuts || {};

    // Calculate total portes for percentage
    const totalPortes = Object.values(repartitionStatuts).reduce((sum: any, count: any) => sum + count, 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Tableau de Bord</h1>
                <p className="text-muted-foreground">Bienvenue ! Voici un résumé de votre activité.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-primary" />
                            <span>Zone de Prospection Actuelle</span>
                        </CardTitle>
                        <CardDescription>Secteur prioritaire pour la semaine en cours.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="text-2xl font-bold text-primary">{zoneAssignee.nom}</h3>
                        <p className="text-muted-foreground mt-2">Vous avez {immeublesDansZone.length} immeubles enregistrés dans cette zone.</p>
                        <div className="mt-4 space-y-3">
                            {accesRapides.map(item => (
                                <a href={item.href} key={item.title} className="block">
                                    {/* CORRECTION DE LA BORDURE */}
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
                    <ZoneFocusMap zone={zoneAssignee} immeubles={immeublesDansZone} />
                </div>
            </div>

             <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold">Vos Performances</h2>
                    <div className="flex items-center gap-1 rounded-lg border p-1 bg-white">
                        <Button 
                            variant="ghost" 
                            onClick={() => setTimeFilter('week')}
                            className={cn( "transition-all text-black", timeFilter === 'week' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'hover:bg-zinc-100' )}
                        >Cette semaine</Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setTimeFilter('month')}
                            className={cn( "transition-all text-black", timeFilter === 'month' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'hover:bg-zinc-100' )}
                        >Ce mois</Button>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard title="Immeubles Visitées" value={currentStats.immeublesVisites} Icon={MapPin} color="text-blue-500" />
                    <StatCard title="Portes Visitées" value={currentStats.portesVisitees} Icon={DoorOpen} color="text-orange-500" />
                    <StatCard title="Contrats Signés" value={currentStats.contratsSignes} Icon={CheckCircle} color="text-emerald-500" />
                    <StatCard title="Taux de Conversion" value={currentStats.tauxDeConversion} Icon={Percent} color="text-violet-500" suffix="%" />
                    {/* Add a placeholder for Heures Travaillées if needed, or remove if not available from backend */}
                    <StatCard title="Heures Travaillées" value={0} Icon={Clock} color="text-amber-500" suffix="h" />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Répartition des Statuts</CardTitle>
                    <CardDescription>Proportion de chaque statut sur l'ensemble des portes prospectées.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(repartitionStatuts).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between p-3 border rounded-md">
                                <span className="font-medium">{status.replace(/_/g, ' ')}</span>
                                <span className="text-lg font-bold">{((count as number / totalPortes) * 100 || 0).toFixed(2)}%</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historique de Prospection</CardTitle>
                    <CardDescription>Détail des visites et performances par immeuble.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Immeuble</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Dernière Visite</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taux Couverture</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RDV Pris</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrats Signés</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {history?.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.adresse}, {item.ville}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dateDerniereVisite ? new Date(item.dateDerniereVisite).toLocaleDateString() : 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tauxCouverture}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.rdvPris}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.contrats}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <GenericLineChart 
                title="Entonnoir de Prospection"
                data={activitePortesData} 
                xAxisDataKey="name" 
                lines={[
                    { dataKey: 'Portes', name: "Portes Prospectées", stroke: 'hsl(var(--winvest-blue-profond))' },
                    { dataKey: 'RDV', name: "RDV Pris", stroke: 'hsl(var(--winvest-blue-moyen))' },
                    { dataKey: 'Contrats', name: "Contrats Signés", stroke: 'hsl(var(--color-emerald-500))' }
                ]}
            />
        </div>
    );
};

export default CommercialDashboardPage;