// src/pages/commercial/DashboardCommercialPage.tsx

import { useState, useEffect } from 'react';
// import axios from 'axios'; // Supprimé car nous utilisons des données simulées
import { useAuth } from '@/contexts/AuthContext';
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

// =================================================================
// DÉBUT DES DONNÉES SIMULÉES (MOCK DATA)
// Ces données remplacent les appels API pour le développement en frontend.
// =================================================================

const mockZoneAssignee = {
    nom: 'Paris 17ème - Batignolles',
    latlng: [48.8839, 2.3184] as [number, number],
    radius: 1000, // or any appropriate value
    color: '#3b82f6', // or any appropriate color
};

const mockImmeublesDansZone = [
    { id: 'imm-1', adresse: '123 Rue des Dames', latlng: [48.8855, 2.321] as [number, number] },
    { id: 'imm-2', adresse: '45 Avenue de Clichy', latlng: [48.8865, 2.325] as [number, number] },
    { id: 'imm-3', adresse: '78 Boulevard des Batignolles', latlng: [48.883, 2.319] as [number, number] },
    { id: 'imm-4', adresse: '9 Rue Legendre', latlng: [48.888, 2.315] as [number, number] },
];

const mockAccesRapides = [
    { 
        title: "Démarrer une nouvelle prospection",
        description: "Enregistrer une visite dans un nouvel immeuble.",
        href: "/commercial/prospection/nouvelle",
        icon: PlayCircle 
    },
    { 
        title: "Ajouter un immeuble",
        description: "Enrichir la base de données de votre secteur.",
        href: "/commercial/immeubles/ajouter",
        icon: PlusCircle
    },
    { 
        title: "Voir tous mes rapports",
        description: "Consulter l'historique détaillé de vos visites.",
        href: "/commercial/rapports",
        icon: BarChart2
    }
];

const mockStats = {
    kpis: {
        immeublesVisites: 12,
        portesVisitees: 157,
        contratsSignes: 8,
        tauxDeConversion: 5.1,
        heuresTravaillees: 32, // Ajout pour la carte "Heures Travaillées"
    },
    repartitionStatuts: {
        "RDV Pris": 21,
        "Contrat Signé": 8,
        "Refus Définitif": 45,
        "Pas Intéressé": 63,
        "À Recontacter": 15,
        "Absent": 5,
    }
};

const mockHistory = [
    { id: 'hist-1', adresse: '123 Rue des Dames', ville: 'Paris', dateProspection: '2023-10-26T10:00:00Z', portesProspectees: 40, tauxCouverture: 80, nbRdvPris: 5, nbContratsSignes: 2 },
    { id: 'hist-2', adresse: '45 Avenue de Clichy', ville: 'Paris', dateProspection: '2023-10-25T14:30:00Z', portesProspectees: 60, tauxCouverture: 75, nbRdvPris: 8, nbContratsSignes: 3 },
    { id: 'hist-3', adresse: '78 Boulevard des Batignolles', ville: 'Paris', dateProspection: '2023-10-24T11:00:00Z', portesProspectees: 30, tauxCouverture: 90, nbRdvPris: 4, nbContratsSignes: 1 },
    { id: 'hist-4', adresse: '9 Rue Legendre', ville: 'Paris', dateProspection: '2023-10-23T16:00:00Z', portesProspectees: 27, tauxCouverture: 65, nbRdvPris: 4, nbContratsSignes: 2 },
];

// =================================================================
// FIN DES DONNÉES SIMULÉES
// =================================================================

const CommercialDashboardPage = () => {
    const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSimulatedData = () => {
            if (!user || !user.id) {
                setError('ID du commercial non disponible.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            // Simulation d'un appel API avec un délai de 1 seconde
            setTimeout(() => {
                try {
                    // Ici, nous utilisons nos données simulées au lieu d'une réponse d'API
                    setStats(mockStats);
                    setHistory(mockHistory);
                } catch (err) {
                    console.error('Error processing simulated data:', err);
                    setError('Erreur lors du traitement des données simulées.');
                } finally {
                    setLoading(false);
                }
            }, 1000); // Délai de 1000ms (1 seconde)
        };

        fetchSimulatedData();
    }, [user]);

    // Transformation des données pour GenericLineChart (corrigée pour être plus logique)
    const activitePortesData = history?.map((item: any) => ({
        name: item.adresse, // Utilise l'adresse comme étiquette sur l'axe X
        Portes: item.portesProspectees, // Nombre de portes réellement prospectées
        RDV: item.nbRdvPris, // Nombre de RDV pris
        Contrats: item.nbContratsSignes, // Nombre de contrats signés
    })) || [];

    if (loading) {
        return <div className="text-center py-8">Chargement de vos données...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    // Utilisation des données simulées après le chargement
    const currentStats = stats?.kpis || { immeublesVisites: 0, portesVisitees: 0, contratsSignes: 0, tauxDeConversion: 0, heuresTravaillees: 0 };
    const repartitionStatuts = stats?.repartitionStatuts || {};
    const totalPortes = (Object.values(repartitionStatuts) as number[]).reduce((sum, count) => sum + count, 0);

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
                    <StatCard title="Heures Travaillées" value={currentStats.heuresTravaillees} Icon={Clock} color="text-amber-500" suffix="h" />
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
                                <span className="font-medium">{status}</span>
                                <span className="text-lg font-bold">{((count as number / totalPortes) * 100 || 0).toFixed(1)}%</span>
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.dateProspection).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tauxCouverture}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nbRdvPris}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nbContratsSignes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <GenericLineChart 
                title="Entonnoir de Prospection par Immeuble"
                data={activitePortesData} 
                xAxisDataKey="name" 
                lines={[
                    { dataKey: 'Portes', name: "Portes Prospectées", stroke: 'hsl(var(--winvest-blue-profond))' },
                    { dataKey: 'RDV', name: "RDV Pris", stroke: 'hsl(var(--winvest-blue-moyen))' },
                    { dataKey: 'Contrats', name: "Contrats Signés", stroke: 'hsl(var(--emerald-500))' }
                ]}
            />
        </div>
    );
};

export default CommercialDashboardPage;