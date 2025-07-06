// frontend-shadcn/src/pages/admin/Equipes/EquipeDetailsPage.tsx

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createColumns as createCommerciauxColumns } from "../commerciaux/commerciaux-table/columns";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui-admin/button";
import { ArrowLeft, Users, CheckCircle, Briefcase, Target, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui-admin/skeleton";
import StatCard from "@/components/ui-admin/StatCard";
import { GenericLineChart } from "@/components/charts/GenericLineChart";
import { equipeService, type EquipeDetailsFromApi } from "@/services/equipe.service";

const EquipeDetailsPage = () => {
  const { equipeId } = useParams<{ equipeId: string }>();
  const navigate = useNavigate();
  const [equipeDetails, setEquipeDetails] = useState<EquipeDetailsFromApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (equipeId) {
      setLoading(true);
      equipeService.getEquipeDetails(equipeId)
        .then(data => {
          setEquipeDetails(data);
        })
        .catch(error => {
          console.error("Erreur lors de la récupération des détails de l'équipe:", error);
          setEquipeDetails(null); // Reset in case of error
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [equipeId]);

  const commerciauxColumns = useMemo(() => {
    const allCols = createCommerciauxColumns(false, () => {}); // Pas de mode suppression
    // On exclut les colonnes 'manager' et 'equipe' car redondantes ici
    return allCols.filter(col => col.id !== 'manager' && col.id !== 'equipe');
  }, []);

  if (loading) {
    return (
        <div className="space-y-6 animate-pulse">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-24 w-full" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
            </div>
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  if (!equipeDetails) {
    return <div>Équipe non trouvée ou erreur de chargement.</div>;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la liste des équipes
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Équipe {equipeDetails.nom}
        </h1>
        <p className="text-muted-foreground">Manager : {equipeDetails.manager}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Contrats Signés" value={equipeDetails.stats.contratsSignes} Icon={CheckCircle} color="text-emerald-500" />
        <StatCard title="RDV Pris" value={equipeDetails.stats.rdvPris} Icon={Briefcase} color="text-sky-500"/>
        <StatCard title="Performance Moyenne" value={equipeDetails.stats.perfMoyenne} Icon={Target} suffix="%" color="text-amber-500"/>
        <StatCard title="Classement Général" value={Number(equipeDetails.stats.classementGeneral)} Icon={Trophy} prefix="#" color="text-yellow-500"/>
      </div>

      <GenericLineChart
        title="Évolution de la Performance de l'Équipe"
        data={equipeDetails.perfHistory}
        xAxisDataKey="name"
        lines={[{ dataKey: 'perf', stroke: 'hsl(var(--chart-2))', name: 'Performance (%)' }]}
      />

      <DataTable 
        columns={commerciauxColumns as any} 
        data={equipeDetails.commerciaux} 
        title={`Membres de l'équipe (${equipeDetails.commerciaux.length})`}
        filterColumnId="nom"
        filterPlaceholder="Filtrer par nom de commercial..."
        isDeleteMode={false}
        onToggleDeleteMode={() => {}}
        rowSelection={{}}
        setRowSelection={() => {}}
        onConfirmDelete={() => {}}
      />
    </div>
  )
}

export default EquipeDetailsPage;