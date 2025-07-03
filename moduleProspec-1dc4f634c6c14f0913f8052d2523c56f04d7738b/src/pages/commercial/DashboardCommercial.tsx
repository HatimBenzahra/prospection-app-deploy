// src/pages/commercial/DashboardCommercialPage.tsx

import { useState } from 'react';
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
const commercialData = {
  week: {
    stats: { rdvPris: 12, contratsSignes: 3, tauxConclusion: 25, portesProspectees: 85, heuresTravaillees: 38 },
    activitePortes: [
      { name: 'Lun', Portes: 15, RDV: 3, Contrats: 1 }, { name: 'Mar', Portes: 22, RDV: 4, Contrats: 1 }, { name: 'Mer', Portes: 18, RDV: 2, Contrats: 0 }, { name: 'Jeu', Portes: 25, RDV: 3, Contrats: 1 }, { name: 'Ven', Portes: 5, RDV: 0, Contrats: 0 },
    ],
  },
  month: {
    stats: { rdvPris: 48, contratsSignes: 11, tauxConclusion: 22.9, portesProspectees: 340, heuresTravaillees: 152 },
    activitePortes: [
      { name: 'S1', Portes: 80, RDV: 10, Contrats: 3 }, { name: 'S2', Portes: 95, RDV: 15, Contrats: 4 }, { name: 'S3', Portes: 75, RDV: 11, Contrats: 2 }, { name: 'S4', Portes: 90, RDV: 12, Contrats: 2 },
    ],
  },
};
const zoneAssignee = {
  nom: "Opéra - Grands Boulevards",
  latlng: [48.872, 2.34] as [number, number],
  radius: 1200,
  color: "hsl(var(--winvest-blue-moyen))"
};
const immeublesDansZone = [
    { id: 'imm-1', adresse: '10 Rue de la Paix', latlng: [48.87, 2.335] as [number, number] },
    { id: 'imm-2', adresse: '25 Bd des Capucines', latlng: [48.871, 2.33] as [number, number] },
];
const accesRapides = [
    { title: "Démarrer une prospection", description: "Lancez l'interface d'écoute.", href: "/commercial/prospecting", icon: PlayCircle },
    { title: "Ajouter un immeuble", description: "Enregistrez un nouveau bâtiment.", href: "/commercial/add-immeuble", icon: PlusCircle },
    { title: "Voir mes statistiques", description: "Analysez vos performances en détail.", href: "/commercial/stats", icon: BarChart2 },
];


const CommercialDashboardPage = () => {
    const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');
    const currentData = commercialData[timeFilter];

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
                    <StatCard title="Contrats Signés" value={currentData.stats.contratsSignes} Icon={CheckCircle} color="text-emerald-500" />
                    <StatCard title="RDV Pris" value={currentData.stats.rdvPris} Icon={Briefcase} color="text-sky-500" />
                    <StatCard title="Taux de Conclusion" value={currentData.stats.tauxConclusion} Icon={Percent} color="text-violet-500" suffix="%" />
                    <StatCard title="Portes Prospectées" value={currentData.stats.portesProspectees} Icon={DoorOpen} color="text-orange-500" />
                    <StatCard title="Heures Travaillées" value={currentData.stats.heuresTravaillees} Icon={Clock} color="text-amber-500" suffix="h" />
                </div>
            </div>

            <GenericLineChart 
                title="Entonnoir de Prospection"
                data={currentData.activitePortes} 
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