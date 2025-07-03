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

// --- MOCK DATA ---
const allEquipesDetails = {
    "eq-alpha": {
        id: "eq-alpha", nom: "Alpha", manager: "Dupont Jean",
        stats: { contratsSignes: 45, rdvPris: 130, perfMoyenne: 85, classementGeneral: 1, nbCommerciaux: 8 },
        perfHistory: [{ name: 'S-4', perf: 78 }, { name: 'S-3', perf: 80 }, { name: 'S-2', perf: 85 }, { name: 'S-1', perf: 81 }, { name: 'Actuelle', perf: 85 }],
        commerciaux: [
            { id: "com-001", nom: "Leroy", prenom: "Alice", email: "alice.leroy@example.com", manager: "Dupont Jean", equipe: "Alpha", classement: 1 },
            { id: "com-003", nom: "Fournier", prenom: "Chloé", email: "chloe.fournier@example.com", manager: "Dupont Jean", equipe: "Alpha", classement: 3 },
            { id: "com-006", nom: "Roux", prenom: "Hugo", email: "hugo.roux@example.com", manager: "Dupont Jean", equipe: "Alpha", classement: 6 },
            { id: "com-010", nom: "Blanc", prenom: "Nicolas", email: "nicolas.blanc@example.com", manager: "Dupont Jean", equipe: "Alpha", classement: 10 },
            { id: "com-014", nom: "Collet", prenom: "Maxime", email: "maxime.collet@example.com", manager: "Dupont Jean", equipe: "Alpha", classement: 14 },
        ]
    },
    // ... ajouter d'autres équipes si nécessaire
};

async function getEquipeDetails(equipeId: string): Promise<any> {
    // @ts-ignore
    return new Promise(resolve => setTimeout(() => resolve(allEquipesDetails[equipeId] || null), 500));
}

const EquipeDetailsPage = () => {
  const { equipeId } = useParams<{ equipeId: string }>();
  const navigate = useNavigate();
  const [equipeDetails, setEquipeDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (equipeId) {
      setLoading(true);
      getEquipeDetails(equipeId).then(data => {
        setEquipeDetails(data);
        setLoading(false);
      });
    }
  }, [equipeId]);

  const commerciauxColumns = useMemo(() => {
    const allCols = createCommerciauxColumns(false); // Pas de mode suppression
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
    return <div>Équipe non trouvée.</div>;
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
        <StatCard title="Classement Général" value={equipeDetails.stats.classementGeneral} Icon={Trophy} prefix="#" color="text-yellow-500"/>
      </div>

      <GenericLineChart
        title="Évolution de la Performance de l'Équipe"
        data={equipeDetails.perfHistory}
        xAxisDataKey="name"
        lines={[{ dataKey: 'perf', stroke: 'hsl(var(--chart-2))', name: 'Performance (%)' }]}
      />

      <DataTable 
        columns={commerciauxColumns} 
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