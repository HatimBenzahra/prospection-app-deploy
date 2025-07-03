// frontend-shadcn/src/pages/admin/commerciaux/CommercialDetailsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, BarChart2, Briefcase, CheckCircle, Target, Building, Trophy,
    Zap, TrendingUp, Shuffle, Clock, XCircle, Calendar as CalendarIcon
} from 'lucide-react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from '@/components/ui-admin/button';
import { Skeleton } from '@/components/ui-admin/skeleton';
import StatCard from '@/components/ui-admin/StatCard';
import { GenericLineChart } from '@/components/charts/GenericLineChart';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { commercialService } from '@/services/commercial.service';
// --- IMPORTATION DES NOUVEAUX COMPOSANTS ---
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui-admin/popover";
import { Calendar } from "@/components/ui-admin/calendar";


// --- DÉPLACER LE COMPOSANT DATEPICKER ICI (OU L'IMPORTER) ---
interface CustomDatePickerProps {
  onCancel: () => void;
  onValidate: (range: { from: Date; to: Date }) => void;
}

const CustomDatePicker = ({ onCancel, onValidate }: CustomDatePickerProps) => {
    const [startDate, setStartDate] = React.useState<Date | undefined>();
    const [endDate, setEndDate] = React.useState<Date | undefined>();

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2 bg-background shadow-sm">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] font-normal justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'd LLL y', { locale: fr }) : <span>Date de début</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={fr} />
                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] font-normal justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'd LLL y', { locale: fr }) : <span>Date de fin</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={fr} />
                </PopoverContent>
            </Popover>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => onValidate({ from: startDate!, to: endDate! })} disabled={!startDate || !endDate}>
                Valider
            </Button>
            <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        </div>
    );
};

// --- LE COMPOSANT PRINCIPAL ---
const CommercialDetailsPage = () => {
    const { commercialId } = useParams<{ commercialId: string }>();
    const navigate = useNavigate();
    const [commercial, setCommercial] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activePreset, setActivePreset] = useState('week');
    const [currentStats, setCurrentStats] = useState<any>(null);

    // --- NOUVEAUX ÉTATS POUR GÉRER L'AFFICHAGE ---
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [displayRangeLabel, setDisplayRangeLabel] = useState<string | null>(null);

    useEffect(() => {
        if (commercialId) {
            setLoading(true);
            commercialService.getCommercialDetails(commercialId)
                .then(data => {
                    setCommercial(data);
                    setCurrentStats(data?.stats?.WEEKLY || {});
                })
                .catch(err => {
                    console.error("Erreur chargement détails commercial:", err);
                    setCommercial(null);
                })
                .finally(() => setLoading(false));
        }
    }, [commercialId]);
    
    // --- GESTION DES CLICS SUR LES PRÉRÉGLAGES ---
    const handlePresetClick = (preset: 'week' | 'month' | 'year') => {
        setActivePreset(preset);
        setIsCustomMode(false); // On quitte le mode personnalisé
        setDisplayRangeLabel(null); // On efface le label de la période perso
        if (!commercial?.stats) return;

        if (preset === 'week') setCurrentStats(commercial.stats.WEEKLY || {});
        if (preset === 'month') setCurrentStats(commercial.stats.MONTHLY || {});
        if (preset === 'year') setCurrentStats(commercial.stats.YEARLY || {});
    };

    // --- GESTION DE LA VALIDATION DE LA PÉRIODE PERSONNALISÉE ---
    const handleCustomValidate = (range: { from: Date; to: Date }) => {
        const newLabel = `${format(range.from, "d LLL", { locale: fr })} - ${format(range.to, "d LLL yyyy", { locale: fr })}`;
        setDisplayRangeLabel(newLabel);
        
        // Ici, vous devriez appeler votre service API avec les dates `range.from` et `range.to`
        // Pour la démo, on va simuler en affichant les stats de l'année.
        console.log("Période personnalisée sélectionnée:", range);
        setCurrentStats(commercial.stats.YEARLY || {});

        setIsCustomMode(false);
        setActivePreset("custom");
    };

    // ... (les useMemo pour les graphiques ne changent pas)
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
        // ... (skeleton inchangé)
        return (
            <div className="space-y-6 animate-pulse p-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2"><Skeleton className="h-96 rounded-lg" /><Skeleton className="h-96 rounded-lg" /></div>
            </div>
        )
    }
    if (!commercial) return <div className="p-6">Données du commercial non trouvées.</div>;
    
    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>
            
            <div className="rounded-lg border bg-card text-card-foreground p-6 shadow">
                <h3 className="text-2xl font-semibold">{commercial.prenom} {commercial.nom}</h3>
                <p className="text-sm text-muted-foreground pt-1.5">Équipe : {commercial.equipe.nom} | Manager : {commercial.manager.prenom} {commercial.manager.nom}</p>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-4 justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-semibold flex items-baseline gap-3">
                    <BarChart2 className="h-6 w-6 text-primary self-center" />
                    <span>Statistiques de performance</span>
                    {/* AFFICHE LE LABEL DE LA PÉRIODE PERSONNALISÉE */}
                    {displayRangeLabel && <span className="text-lg font-normal text-muted-foreground tracking-tight">({displayRangeLabel})</span>}
                </h2>
                
                {/* --- LOGIQUE D'AFFICHAGE CONDITIONNELLE --- */}
                {!isCustomMode ? (
                    <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/50">
                        <Button variant={activePreset === 'week' ? 'default' : 'ghost'} className={activePreset === 'week' ? 'bg-black text-white hover:bg-black/90' : ''} onClick={() => handlePresetClick('week')}>Cette semaine</Button>
                        <Button variant={activePreset === 'month' ? 'default' : 'ghost'} className={activePreset === 'month' ? 'bg-black text-white hover:bg-black/90' : ''} onClick={() => handlePresetClick('month')}>Ce mois</Button>
                        <Button variant={activePreset === 'year' ? 'default' : 'ghost'} className={activePreset === 'year' ? 'bg-black text-white hover:bg-black/90' : ''} onClick={() => handlePresetClick('year')}>Cette année</Button>
                        {/* Ce bouton passe en mode personnalisé */}
                        <Button variant={activePreset === 'custom' ? "secondary" : "ghost"} className="border-l rounded-l-none" onClick={() => setIsCustomMode(true)}>Personnalisé</Button>
                    </div>
                ) : (
                    <CustomDatePicker 
                        onCancel={() => { setIsCustomMode(false); }} 
                        onValidate={handleCustomValidate} 
                    />
                )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                 {/* ... (Les StatCard ne changent pas) ... */}
                 <StatCard title="RDV Pris" value={currentStats?.rdvPris || 0} Icon={Briefcase} />
                <StatCard title="Contrats Signés" value={currentStats?.contratsSignes || 0} Icon={CheckCircle} />
                <StatCard title="Taux Conclusion" value={currentStats?.tauxConclusion || 0} Icon={Target} suffix="%" />
                <StatCard title="Classement Équipe" value={currentStats?.classementEquipe || 0} Icon={Trophy} prefix="#" />
                <StatCard title="Taux Transfo." value={currentStats?.tauxTransformationPorteRdv || 0} Icon={Shuffle} suffix="%" />
                <StatCard title="Portes Prospectées" value={currentStats?.portesProspectees || 0} Icon={Building} />
                <StatCard title="Refus" value={currentStats?.refusEnregistres || 0} Icon={XCircle} />
                <StatCard title="Heures Prospect." value={currentStats?.heuresProspectees || 0} Icon={Clock} suffix="h" />
                <StatCard title="RDV / Heure" value={currentStats?.rdvParHeure || 0} Icon={Zap} />
                <StatCard title="Contrats / Jour" value={currentStats?.contratsParJour || 0} Icon={TrendingUp} />
            </div>

             <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                 {/* ... (Les graphiques ne changent pas) ... */}
                 <GenericLineChart title="Historique RDV vs Contrats" data={rdvContratsHistory} xAxisDataKey="name" lines={[{ dataKey: 'rdv', name: "RDV Pris", stroke: "hsl(var(--chart-1))" }, { dataKey: 'contrats', name: "Contrats Signés", stroke: "hsl(var(--chart-5))" }]} />
                 <GenericPieChart title="Répartition des Résultats de RDV" data={pieChartData} dataKey="value" nameKey="name" colors={['hsl(var(--chart-5))', 'hsl(var(--chart-1))']} />
            </div>
        </div>
    );
};

export default CommercialDetailsPage;