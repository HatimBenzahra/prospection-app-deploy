// src/pages/admin/DashboardAdmin.tsx

import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from '@/lib/utils';

// --- Imports des Composants ---
import StatCard from '@/components/ui-admin/StatCard';
import { DashboardSkeleton } from './DashboardSkeleton';
import { GenericLineChart } from '@/components/charts/GenericLineChart';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { GenericBarChart } from '@/components/charts/GenericBarChart';
import { GenericRadialBarChart } from '@/components/ui-admin/GenericRadialBarChart';
import { Button } from '@/components/ui-admin/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui-admin/popover";
import { Calendar } from "@/components/ui-admin/calendar";
import { Badge } from "@/components/ui-admin/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-admin/card';
import { Table, TableBody, TableCell, TableRow } from "@/components/ui-admin/table";

// --- Imports des Icônes ---
import { 
    BarChart3, Briefcase, FileSignature, Sparkles, Target, Calendar as CalendarIcon,
    Award, ClipboardCheck, Percent, UserCheck
} from 'lucide-react';

// --- Données simulées enrichies ---
const dashboardData = {
  week: {
    stats: { portesVisitees: 82, rdvPris: 15, contratsSignes: 7, tauxOuverture: 18, tauxRdv: 18.3, tauxSignature: 46.7, perfMoyenne: 78, commerciauxActifs: 23, heuresProspect: 312 },
    managerStats: { meilleurManager: "Mme Martin", tauxConclusionMoyen: 42, rdvMoyen: 18, effectifTotal: 3 },
    objectifMensuel: { value: 7, total: 30, title: "Objectif Contrats (semaine)" },
    activiteRecente: [ { id: 1, commercial: "Alice Leroy", action: "Nouveau contrat", type: "CONTRAT", temps: "il y a 5 min" }, { id: 2, commercial: "Paul Girard", action: "RDV pris", type: "RDV", temps: "il y a 22 min" }, { id: 3, commercial: "Emma Bonnet", action: "Refus client", type: "REFUS", temps: "il y a 1h" }, { id: 4, commercial: "Hugo Moreau", action: "Nouveau contrat", type: "CONTRAT", temps: "il y a 2h" }, ],
    portesTopeesData: [{ name: 'Lun', Visites: 15, RDV: 3, Refus: 2 }, { name: 'Mar', Visites: 20, RDV: 4, Refus: 1 }, { name: 'Mer', Visites: 18, RDV: 2, Refus: 5 }, { name: 'Jeu', Visites: 25, RDV: 5, Refus: 3 }, { name: 'Ven', Visites: 4, RDV: 1, Refus: 1 }],
    repartitionManagersData: [{ name: 'M. Dupont', value: 40 }, { name: 'Mme Martin', value: 35 }, { name: 'M. Bernard', value: 25 }],
    classementManagersGraphData: [{ name: 'Dupont', value: 40 }, { name: 'Martin', value: 35 }, { name: 'Bernard', value: 32 }, { name: 'Robert', value: 28 }],
  },
  month: {
    stats: { portesVisitees: 450, rdvPris: 70, contratsSignes: 25, tauxOuverture: 15.5, tauxRdv: 15.5, tauxSignature: 35.7, perfMoyenne: 85, commerciauxActifs: 28, heuresProspect: 1248 },
    managerStats: { meilleurManager: "M. Dupont", tauxConclusionMoyen: 38, rdvMoyen: 85, effectifTotal: 5 },
    objectifMensuel: { value: 25, total: 100, title: "Objectif Contrats (mois)"},
    activiteRecente: [ { id: 1, commercial: "Sophie Marchand", action: "Nouveau contrat", type: "CONTRAT", temps: "hier" }, { id: 2, commercial: "Nicolas Blanc", action: "RDV pris", type: "RDV", temps: "hier" }, { id: 3, commercial: "Camille Picard", action: "RDV pris", type: "RDV", temps: "mardi" }, { id: 4, commercial: "Axel Garnier", action: "Refus client", type: "REFUS", temps: "mardi" }, ],
    portesTopeesData: [{ name: 'S1', Visites: 100, RDV: 15, Refus: 10 }, { name: 'S2', Visites: 120, RDV: 20, Refus: 15 }, { name: 'S3', Visites: 90, RDV: 18, Refus: 8 }, { name: 'S4', Visites: 140, RDV: 17, Refus: 12 }],
    repartitionManagersData: [{ name: 'M. Dupont', value: 150 }, { name: 'Mme Martin', value: 180 }, { name: 'M. Bernard', value: 120 }],
    classementManagersGraphData: [{ name: 'Martin', value: 180 }, { name: 'Dupont', value: 150 }, { name: 'Bernard', value: 120 }, { name: 'Robert', value: 110 }],
  },
  last_month: {}, year_to_date: {}
};
// @ts-ignore
dashboardData.last_month = dashboardData.month;
// @ts-ignore
dashboardData.year_to_date = dashboardData.month;
// @ts-ignore
dashboardData.last_week = dashboardData.week;

type ActiviteRecenteItem = {
  id: number;
  commercial: string;
  action: string;
  type: string;
  temps: string;
};

const ActivityBadge = ({ type }: { type: string }) => {
    switch (type) {
        case 'CONTRAT': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Contrat</Badge>;
        case 'RDV': return <Badge className="bg-sky-100 text-sky-800 border-sky-300">RDV</Badge>;
        case 'REFUS': return <Badge className="bg-red-100 text-red-800 border-red-300">Refus</Badge>;
        default: return <Badge variant="secondary">{type}</Badge>;
    }
};

const CustomDatePicker = ({ onCancel, onValidate }: { onCancel: () => void; onValidate: (range: {from: Date, to: Date}) => void; }) => {
    const [startDate, setStartDate] = React.useState<Date | undefined>();
    const [endDate, setEndDate] = React.useState<Date | undefined>();
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2 bg-background shadow-sm">
            <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-[200px] font-normal justify-start text-left"><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, 'd LLL y', { locale: fr }) : <span>Date de début</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-[200px] font-normal justify-start text-left"><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, 'd LLL y', { locale: fr }) : <span>Date de fin</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
            </Popover>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onValidate({ from: startDate!, to: endDate! })} disabled={!startDate || !endDate}>Valider</Button>
            <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        </div>
    );
};

const TextStatCard = ({ title, value, Icon, color }: { title: string; value: string; Icon: React.ElementType; color?: string; }) => {
    return (
      <Card className="transition-transform duration-300 hover:scale-[1.03] hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={cn("h-4 w-4 text-muted-foreground", color)} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    );
};


const DashboardAdmin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('week');
    const [activePreset, setActivePreset] = useState('week');
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [displayRangeLabel, setDisplayRangeLabel] = useState<string | null>(null);

    const handleTimeFilterChange = (filterKey: string) => {
        setIsLoading(true);
        setActivePreset(filterKey);
        setDisplayRangeLabel(null);
        // @ts-ignore
        setTimeFilter(dashboardData[filterKey] ? filterKey : 'week');
        setTimeout(() => setIsLoading(false), 600);
    };

    const handleCustomValidate = (range: {from: Date, to: Date}) => {
        const newLabel = `${format(range.from, "d LLL y", { locale: fr })} - ${format(range.to, "d LLL y", { locale: fr })}`;
        setDisplayRangeLabel(newLabel);
        handleTimeFilterChange("year_to_date");
        setIsCustomMode(false);
        setActivePreset("custom");
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) return <DashboardSkeleton />;

    // @ts-ignore
    const currentData = dashboardData[timeFilter] || dashboardData.week;

    return (
        <div className="space-y-8 bg-zinc-50/50 p-4 sm:p-6 rounded-xl">
            <div className="flex flex-wrap gap-4 justify-between items-center animate-in fade-in duration-500 border-b pb-4">
                <h2 className="text-2xl font-semibold flex items-baseline gap-3 text-zinc-900">
                    <BarChart3 className="h-6 w-6 text-primary self-center"/>
                    <span>Statistiques d'ensemble</span>
                    {displayRangeLabel && <span className="text-lg font-normal text-muted-foreground tracking-tight">({displayRangeLabel})</span>}
                </h2>
                {!isCustomMode ? (
                     <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/50">
                        {/* --- CORRECTION ICI --- */}
                        <Button variant='ghost' className={cn("transition-all", activePreset === 'week' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'text-black hover:bg-zinc-100')} onClick={() => handleTimeFilterChange('week')}>Cette semaine</Button>
                        <Button variant='ghost' className={cn("transition-all", activePreset === 'month' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'text-black hover:bg-zinc-100')} onClick={() => handleTimeFilterChange('month')}>Ce mois</Button>
                        <Button variant='ghost' className={cn("transition-all", activePreset === 'last_month' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'text-black hover:bg-zinc-100')} onClick={() => handleTimeFilterChange('last_month')}>Mois dernier</Button>
                        <Button variant='ghost' className={cn("transition-all", activePreset === 'year_to_date' ? 'bg-[hsl(var(--winvest-blue-clair))] text-[hsl(var(--winvest-blue-nuit))] hover:bg-[hsl(var(--winvest-blue-clair))]' : 'text-black hover:bg-zinc-100')} onClick={() => handleTimeFilterChange('year_to_date')}>Cette année</Button>
                        <Button variant="ghost" className="border-l rounded-l-none" onClick={() => setIsCustomMode(true)}>Personnalisé</Button>
                     </div>
                ) : ( <CustomDatePicker onCancel={() => { setIsCustomMode(false); setActivePreset(timeFilter); }} onValidate={handleCustomValidate} /> )}
            </div>

            <section>
                <h3 className="text-lg font-semibold mb-4 text-zinc-900">Indicateurs Commerciaux</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in-0 [animation-delay:100ms] duration-500">
                    <StatCard title="Contrats Signés" value={currentData.stats.contratsSignes} Icon={FileSignature} color="text-emerald-500" />
                    <StatCard title="RDV Pris" value={currentData.stats.rdvPris} Icon={Briefcase} color="text-sky-500" />
                    <StatCard title="Taux de Signature" value={currentData.stats.tauxSignature} Icon={Sparkles} suffix="%" color="text-violet-500" />
                    <StatCard title="Performance Moyenne" value={currentData.stats.perfMoyenne} Icon={Target} suffix="%" color="text-amber-500" />
                </div>
            </section>
            
            <section>
                <h3 className="text-lg font-semibold mb-4 text-zinc-900">Indicateurs Managers</h3>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in-0 [animation-delay:200ms] duration-500">
                    <TextStatCard title="Meilleur Manager" value={currentData.managerStats.meilleurManager} Icon={Award} color="text-yellow-500" />
                    <StatCard title="Taux Conclusion Moyen" value={currentData.managerStats.tauxConclusionMoyen} Icon={Percent} suffix="%" color="text-green-500" />
                    <StatCard title="RDV Moyen / Manager" value={currentData.managerStats.rdvMoyen} Icon={ClipboardCheck} color="text-blue-500" />
                    <StatCard title="Effectif total des managers" value={currentData.managerStats.effectifTotal} Icon={UserCheck} color="text-indigo-500" />
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-0 [animation-delay:300ms] duration-500">
                <GenericRadialBarChart title={currentData.objectifMensuel.title} value={currentData.objectifMensuel.value} total={currentData.objectifMensuel.total} color="fill-emerald-500" />
                <div className="lg:col-span-2">
                    <Card className="h-full"><CardHeader><CardTitle>Flux d'activité récent</CardTitle><CardDescription>Les dernières actions importantes enregistrées.</CardDescription></CardHeader>
                        <CardContent><Table><TableBody>
                            {currentData.activiteRecente.map((item: ActiviteRecenteItem) => (
                                <TableRow key={item.id} className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                                    <TableCell><div className="font-medium">{item.commercial}</div></TableCell>
                                    <TableCell><ActivityBadge type={item.type} /></TableCell>
                                    <TableCell className="text-right text-muted-foreground">{item.temps}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody></Table></CardContent>
                    </Card>
                </div>
            </section>
            
            <section className="animate-in fade-in-0 [animation-delay:400ms] duration-500">
                 <GenericBarChart title="Performances par Manager (Portes Prospectées)" data={currentData.classementManagersGraphData} xAxisDataKey="name" barDataKey="value" fillColor={() => 'hsl(var(--chart-1))'}/>
            </section>

            <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 animate-in fade-in-0 [animation-delay:500ms] duration-500">
                <div className="lg:col-span-4">
                  <GenericLineChart title="Activité de prospection" data={currentData.portesTopeesData} xAxisDataKey="name" lines={[ { dataKey: 'Visites', name: "Visites", stroke: 'hsl(var(--chart-1))' }, { dataKey: 'RDV', name: "RDV", stroke: 'hsl(var(--chart-2))' }, { dataKey: 'Refus', name: "Refus", stroke: 'hsl(var(--chart-3))' } ]}/>
                </div>
                <div className="lg:col-span-3">
                  <GenericPieChart title="Répartition des Visites par Manager" data={currentData.repartitionManagersData} dataKey="value" nameKey="name" colors={['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))']}/>
                </div>
            </section>
        </div>
    );
};

export default DashboardAdmin;