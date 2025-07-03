// frontend-shadcn/src/pages/admin/Managers/ManagerDetailsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RowSelectionState } from "@tanstack/react-table";
import { ArrowLeft, BarChart2, Briefcase, CheckCircle, Target, Trophy, Users } from 'lucide-react';

import { Button } from '@/components/ui-admin/button';
import { Skeleton } from '@/components/ui-admin/skeleton';
import StatCard from '@/components/ui-admin/StatCard';
import { DataTable } from "@/components/data-table/DataTable";
import { GenericLineChart } from '@/components/charts/GenericLineChart';
import { managerService } from '@/services/manager.service';
import type { Commercial } from '../commerciaux/commerciaux-table/columns';
import { createColumns as createCommerciauxColumns } from "../commerciaux/commerciaux-table/columns";
import { createEquipesColumns, type EquipeDuManager } from './managers-table/equipes-columns';

const ManagerDetailsPage = () => {
    const { managerId } = useParams<{ managerId: string }>();
    const navigate = useNavigate();
    
    const [manager, setManager] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    const [selectedTeam, setSelectedTeam] = useState<EquipeDuManager | null>(null);
    const [teamRowSelection, setTeamRowSelection] = React.useState<RowSelectionState>({});

    // Les colonnes des tableaux
    const equipesColumns = useMemo(() => createEquipesColumns(), []);
    // On exclut les colonnes redondantes pour la liste des commerciaux
    const commerciauxColumns = useMemo(() => {
        const allCols = createCommerciauxColumns(false, () => {});
        return allCols.filter(col => col.id !== 'manager' && col.id !== 'equipe');
    }, []);

    // Chargement des données au montage
    useEffect(() => {
        if (managerId) {
            setLoading(true);
            managerService.getManagerDetails(managerId).then(data => {
                // Formater les données des équipes pour la DataTable
                const formattedEquipes = data.equipes.map((e: any) => ({
                    id: e.id,
                    nom: e.nom,
                    nbCommerciaux: e.commerciaux.length,
                    // On stocke les commerciaux directement pour un accès facile
                    commerciaux: e.commerciaux.map((c: any, index: number) => ({
                        ...c,
                        manager: `${data.prenom} ${data.nom}`,
                        managerId: data.id,
                        equipe: e.nom,
                        equipeId: e.id,
                        classement: index + 1, // Classement simple pour l'affichage
                        telephone: c.telephone || '',
                    }))
                }));
                setManager({ ...data, equipes: formattedEquipes });
                setLoading(false);
            }).catch(err => {
                console.error("Erreur de chargement des détails du manager:", err);
                setLoading(false);
            });
        }
    }, [managerId]);

    // Gère le clic sur une ligne d'équipe pour afficher/cacher ses commerciaux
    const handleTeamRowClick = (equipe: EquipeDuManager) => {
        if (selectedTeam?.id === equipe.id) {
            setSelectedTeam(null);
            setTeamRowSelection({});
        } else {
            setSelectedTeam(equipe);
            setTeamRowSelection({ [equipe.id]: true });
        }
    };
    
    // Affichage de chargement
    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28 rounded-lg" /><Skeleton className="h-28 rounded-lg" />
                    <Skeleton className="h-28 rounded-lg" /><Skeleton className="h-28 rounded-lg" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }
    
    // Si le manager n'est pas trouvé
    if (!manager) return <div>Manager non trouvé.</div>;

    // Préparation des données pour les graphiques et stats
    const currentStats = manager.stats || { rdvPris: 0, contratsSignes: 0, tauxConclusion: 0 };
    const perfHistory = [
        { name: 'S-4', perf: 78 }, { name: 'S-3', perf: 80 }, { name: 'S-2', perf: 85 },
        { name: 'S-1', perf: 81 }, { name: 'Cette sem.', perf: currentStats.tauxConclusion }
    ];
    const commerciauxDeLequipeSelectionnee = manager.equipes.find((e: any) => e.id === selectedTeam?.id)?.commerciaux || [];

    return (
        <div className="space-y-8">
            <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Button>
            
            <div className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">{manager.prenom} {manager.nom}</h3>
                <p className="text-sm text-muted-foreground pt-1.5">Informations et statistiques globales de la semaine</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Contrats (Total)" value={currentStats.contratsSignes} Icon={CheckCircle} color="text-emerald-500" />
                <StatCard title="RDV (Total)" value={currentStats.rdvPris} Icon={Briefcase} color="text-sky-500"/>
                <StatCard title="Taux Conclusion" value={currentStats.tauxConclusion} Icon={Target} suffix="%" color="text-amber-500"/>
                <StatCard title="Nb. Équipes" value={manager.equipes.length} Icon={Users} color="text-yellow-500"/>
            </div>

            <GenericLineChart title="Évolution de la Performance Globale" data={perfHistory} xAxisDataKey="name" lines={[{ dataKey: 'perf', stroke: 'hsl(var(--chart-2))', name: 'Performance (%)' }]} />
            
            <div className="space-y-4">
                <DataTable
                    columns={equipesColumns} data={manager.equipes} title="Équipes Managées"
                    filterColumnId="nom" filterPlaceholder="Filtrer par équipe..."
                    onRowClick={handleTeamRowClick} rowSelection={teamRowSelection} setRowSelection={setTeamRowSelection}
                    isDeleteMode={false} onToggleDeleteMode={() => {}} onConfirmDelete={() => {}}
                />
                
                {selectedTeam && (
                    <div className="animate-in fade-in-0 duration-500">
                        <DataTable
                            columns={commerciauxColumns} data={commerciauxDeLequipeSelectionnee}
                            title={`Commerciaux de l'équipe : ${selectedTeam.nom}`}
                            filterColumnId="nom" filterPlaceholder="Filtrer par commercial..."
                            isDeleteMode={false} onToggleDeleteMode={() => {}} rowSelection={{}} setRowSelection={() => {}} onConfirmDelete={() => {}}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManagerDetailsPage;