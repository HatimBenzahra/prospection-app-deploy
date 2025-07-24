
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { statisticsService } from '@/services/statistics.service';
import StatCard from '@/components/ui-admin/StatCard';
import { GenericPieChart } from '@/components/charts/GenericPieChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import { Building, DoorOpen, Handshake, Target, ArrowLeft, User, Phone, Mail, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui-admin/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui-admin/tooltip';
import { commercialService } from '@/services/commercial.service';
import { DataTable } from '@/components/data-table/DataTable';
import { ColumnDef } from "@tanstack/react-table";

// Define columns for the DataTable
const historyColumns: ColumnDef<HistoryEntry>[] = [
  {
    accessorKey: "adresse",
    header: "Adresse",
  },
  {
    accessorKey: "ville",
    header: "Ville",
  },
  {
    accessorKey: "codePostal",
    header: "Code Postal",
  },
  {
    accessorKey: "zoneName",
    header: "Nom de la Zone",
  },
  {
    accessorKey: "dateProspection",
    header: "Date",
  },
  {
    accessorKey: "nbPortesVisitees",
    header: "Portes Visitées",
  },
  {
    accessorKey: "totalNbPortesImmeuble",
    header: "Total Portes Immeuble",
  },
  {
    accessorKey: "nbContratsSignes",
    header: "Contrats Signés",
  },
  {
    accessorKey: "nbRdvPris",
    header: "RDV Pris",
  },
  {
    accessorKey: "nbRefus",
    header: "Refus",
  },
  {
    accessorKey: "nbAbsents",
    header: "Absents",
  },
  {
    accessorKey: "tauxCouverture",
    header: "Taux Couverture (%)",
    cell: info => info.getValue() + "%",
  },
  {
    accessorKey: "commentaire",
    header: "Commentaire",
  },
];

interface CommercialStats {
  commercialInfo: {
    nom: string;
    prenom: string;
    email: string;
  };
  kpis: {
    immeublesVisites: number;
    portesVisitees: number;
    contratsSignes: number;
    rdvPris: number;
    tauxDeConversion: number;
  };
  repartitionStatuts: {
    [key: string]: number;
  };
}

interface HistoryEntry {
  id: string; // ID de l'entrée d'historique
  immeubleId: string; // L'ID de l'immeuble associé à cette entrée d'historique
  adresse: string;
  ville: string;
  codePostal?: string; // Added for postal code
  dateProspection: string;
  nbPortesVisitees: number;
  totalNbPortesImmeuble?: number; // Added for total doors in the building
  nbContratsSignes: number;
  nbRdvPris: number;
  nbRefus: number;
  nbAbsents: number;
  commentaire: string;
  tauxCouverture: number;
  zoneName?: string; // Added for zone name
}

interface CommercialDetails {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  equipe: {
    id: string;
    nom: string;
    manager: {
      id: string;
      nom: string;
      prenom: string;
    };
  };
}

const CommercialDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<CommercialStats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commercial, setCommercial] = useState<CommercialDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [statsData, historyData, commercialData] = await Promise.all([
            statisticsService.getStatsForCommercial(id),
            statisticsService.getCommercialHistory(id),
            commercialService.getCommercialDetails(id),
          ]);

          // Assurez-vous que chaque entrée d'historique a un immeubleId
          const formattedHistory = historyData.map((entry: any) => ({
            ...entry,
            immeubleId: entry.immeubleId || entry.id, // Revert to original logic: Use immeubleId if present, otherwise fallback to entry.id
          }));

          setStats(statsData);
          setHistory(formattedHistory);
          setCommercial(commercialData);
          setError(null);
        } catch (err) {
          setError('Erreur lors de la récupération des données.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  if (loading) {
    return <div>Chargement des données...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!stats || !commercial) {
    return <div>Aucune statistique disponible pour ce commercial.</div>;
  }

  const pieData = Object.entries(stats.repartitionStatuts).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center">
        {location.state?.fromManager ? (
          <div style={{ border: '2px solid #6366f1', borderRadius: '6px', padding: '2px 8px', marginRight: '16px' }}>
            <Button variant="outline" size="icon" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : location.state?.fromEquipe ? (
          <div style={{ border: '2px solid #22c55e', borderRadius: '6px', padding: '2px 8px', marginRight: '16px' }}>
            <Button variant="outline" size="icon" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="icon" className="mr-4" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">
          Statistiques de {stats.commercialInfo.prenom} {stats.commercialInfo.nom}
        </h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <span>{commercial.prenom} {commercial.nom}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-gray-500" />
            <span>{commercial.telephone || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-gray-500" />
            <span>{commercial.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-gray-500" />
            <span>{commercial.equipe ? `${commercial.equipe.manager.prenom} ${commercial.equipe.manager.nom}` : 'N/A'}</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Immeubles Visitées" value={stats.kpis.immeublesVisites} Icon={Building} />
        <StatCard title="Portes Visitées" value={stats.kpis.portesVisitees} Icon={DoorOpen} />
        <StatCard title="Contrats Signés" value={stats.kpis.contratsSignes} Icon={Handshake} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <StatCard title="Taux de Conversion" value={stats.kpis.tauxDeConversion} Icon={Target} suffix="%" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Le taux de conversion représente le rapport entre le nombre de contrats signés et le nombre total de portes visitées. Il mesure l’efficacité du commercial à conclure des ventes.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Statuts</CardTitle>
            <CardDescription>
              Proportion de chaque statut sur l'ensemble des portes prospectées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ height: '400px' }}>
              <GenericPieChart
                title="Répartition des Statuts"
                data={pieData}
                dataKey="value"
                nameKey="name"
                colors={['#22c55e', '#f97316', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique de Prospection</CardTitle>
            <CardDescription>
              Détail des visites et performances par immeuble.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={historyColumns}
              data={history}
              filterColumnId="adresse"
              filterPlaceholder="Filtrer par adresse..."
              title=""
              noCardWrapper={true}
              onRowClick={(row) => navigate(`/admin/immeubles/${row.immeubleId}`)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommercialDetailsPage;
