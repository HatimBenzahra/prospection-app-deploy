import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RowSelectionState } from "@tanstack/react-table";
import { ArrowLeft, Briefcase, CheckCircle, Target, Users, User, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui-admin/button';
import { Skeleton } from '@/components/ui-admin/skeleton';
import StatCard from '@/components/ui-admin/StatCard';
import { DataTable } from "@/components/data-table/DataTable";
import { GenericLineChart } from '@/components/charts/GenericLineChart';
import { managerService } from '@/services/manager.service';
import type { Commercial } from '../commerciaux/commerciaux-table/columns';
import { createColumns as createCommerciauxColumns } from "../commerciaux/commerciaux-table/columns";
import { createEquipesColumns, type EquipeDuManager } from './managers-table/equipes-columns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-admin/card';

import { statisticsService } from '@/services/statistics.service';

interface ManagerDetails {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  equipes: EquipeDuManager[];
}

interface ManagerStats {
  contratsSignes: number;
  rdvPris: number;
  tauxConclusion: number;
}

interface PerformanceHistoryItem {
  name: string;
  performance: number;
  [key: string]: string | number;
}

const ManagerDetailsPage = () => {
    const { managerId } = useParams<{ managerId: string }>();
    const navigate = useNavigate();
    
    const [manager, setManager] = useState<ManagerDetails | null>(null);
    const [stats, setStats] = useState<ManagerStats | null>(null);
    const [perfHistory, setPerfHistory] = useState<PerformanceHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedTeam, setSelectedTeam] = useState<EquipeDuManager | null>(null);
    const [teamRowSelection, setTeamRowSelection] = React.useState<RowSelectionState>({});

    const equipesColumns = useMemo(() => createEquipesColumns(), []);
    const commerciauxColumns = useMemo(() => {
        const allCols = createCommerciauxColumns(false, () => {}, managerId);
        return allCols.filter(col => col.id !== 'manager' && col.id !== 'equipe');
    }, [managerId]);

    useEffect(() => {
        if (managerId) {
            setLoading(true);
            Promise.all([
                managerService.getManagerDetails(managerId),
                statisticsService.getStatsForManager(managerId),
                statisticsService.getManagerPerformanceHistory(managerId)
            ]).then(([managerData, statsData, historyData]) => {
                const formattedEquipes = managerData.equipes.map((e: any) => ({
                    id: e.id,
                    nom: e.nom,
                    nbCommerciaux: e.commerciaux.length,
                    commerciaux: e.commerciaux.map((c: Commercial, index: number) => ({
                        ...c,
                        manager: `${managerData.prenom} ${managerData.nom}`,
                        managerId: managerData.id,
                        equipe: e.nom,
                        equipeId: e.id,
                        classement: index + 1,
                        telephone: c.telephone || '',
                    }))
                }));
                setManager({ ...managerData, equipes: formattedEquipes });
                setStats(statsData);
                setPerfHistory(historyData);
                setLoading(false);
            }).catch(err => {
                console.error("Erreur de chargement des détails du manager:", err);
                setLoading(false);
            });
        }
    }, [managerId]);

    const handleTeamRowClick = (equipe: EquipeDuManager) => {
        if (selectedTeam?.id === equipe.id) {
            setSelectedTeam(null);
            setTeamRowSelection({});
        } else {
            setSelectedTeam(equipe);
            setTeamRowSelection({ [equipe.id]: true });
        }
    };
    
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
    
    if (!manager) return <div>Manager non trouvé.</div>;

    const currentStats = {
      rdvPris: stats?.rdvPris ?? 0,
      contratsSignes: stats?.contratsSignes ?? 0,
      tauxConclusion: stats?.tauxConclusion ?? 0,
    };
    const commerciauxDeLequipeSelectionnee = manager.equipes.find((e) => e.id === selectedTeam?.id)?.commerciaux || [];

    return (
        <div className="space-y-8">
            <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Button>
            

            <Card>
                <CardHeader>
                    <CardTitle>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <span>{manager.prenom} {manager.nom}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <span>{manager.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Phone className="h-5 w-5 text-gray-500" />
                        <span>{manager.telephone || 'N/A'}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Contrats (Total)" value={currentStats.contratsSignes} Icon={CheckCircle} color="text-emerald-500" />
                <StatCard title="RDV (Total)" value={currentStats.rdvPris} Icon={Briefcase} color="text-sky-500"/>
                <StatCard title="Taux Conclusion" value={currentStats.tauxConclusion} Icon={Target} suffix="%" color="text-amber-500"/>
                <StatCard title="Nb. Équipes" value={manager.equipes.length} Icon={Users} color="text-yellow-500"/>
            </div>

            <GenericLineChart 
                title="Évolution de la Performance Globale"
                data={perfHistory} 
                xAxisDataKey="name" 
                lines={[{ dataKey: 'performance', stroke: '#3b82f6', name: 'Performance (%)' }]} 
            />
            
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