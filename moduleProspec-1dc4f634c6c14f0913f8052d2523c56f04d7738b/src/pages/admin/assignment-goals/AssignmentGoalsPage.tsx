import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Services
import { commercialService } from '@/services/commercial.service';
import { zoneService } from '@/services/zone.service';
import { managerService } from '@/services/manager.service';
import { assignmentGoalsService } from '@/services/assignment-goals.service';

// Types
import { AssignmentType } from '@/types/enums';
import type { Commercial, Manager, Zone } from '@/types/types';

// Composants enfants
import { ZoneAssignmentCard } from '@/components/page-components/ZoneAssignmentCard';
import { GoalSettingCard } from '@/components/page-components/GoalSettingCard';
import { ZoneMapViewer } from '@/components/page-components/ZoneMapViewer';

/* -------------------- Helpers -------------------- */
type AssignmentData = {
  commercials: Commercial[];
  managers: Manager[];
  zones: Zone[];
};

function mapApiZonesToUiZones(zones: any[]): Zone[] {
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.nom,
    assignedTo: '',
    color: zone.couleur,
    latlng: [zone.longitude, zone.latitude] as [number, number],
    radius: zone.rayonMetres,
    dateCreation: zone.createdAt,
    nbImmeubles: 0,
    totalContratsSignes: 0,
    totalRdvPris: 0,
  }));
}

const AssignmentGoalsPage = () => {
  const [data, setData] = useState<AssignmentData>({
    commercials: [],
    managers: [],
    zones: [],
  });
  const { commercials, managers, zones } = data;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [commercialsData, zonesData, managersData] = await Promise.all([
          commercialService.getCommerciaux(),
          zoneService.getZones(),
          managerService.getManagers(),
        ]);

        setData({
          commercials: commercialsData,
          managers: managersData,
          zones: mapApiZonesToUiZones(zonesData),
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Impossible de charger les données. Veuillez rafraîchir la page.";
        console.error('Failed to fetch initial data:', err);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignZone = async (
    zoneId: string,
    assigneeId: string,
    assigneeType: AssignmentType
  ) => {
    try {
      await assignmentGoalsService.assignZone(zoneId, assigneeId, assigneeType);
      toast.success('Zone assignée avec succès!', {
        description: `La zone a été assignée à l'${assigneeType}.`,
      });
    } catch (err) {
      console.error('Erreur lors de l’assignation de la zone:', err);
      toast.error("Erreur lors de l'assignation de la zone.");
    }
  };

  const handleSetGoal = async (commercialId: string, goal: number) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    try {
      await assignmentGoalsService.setMonthlyGoal(
        commercialId,
        goal,
        currentMonth,
        currentYear
      );
      toast.success('Objectif mensuel défini avec succès!', {
        description: `L'objectif de ${goal} contrats a été fixé.`,
      });
    } catch (err) {
      console.error("Erreur lors de la définition de l'objectif:", err);
      toast.error("Erreur lors de la définition de l'objectif.");
    }
  };

  const handleSelectZone = (zoneId: string) =>
    setSelectedZone(zones.find((z) => z.id === zoneId) ?? null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <AlertCircle className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold">Une erreur est survenue</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Assignations et Objectifs
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Gérez les zones de prospection et fixez les objectifs de vos équipes.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <ZoneAssignmentCard
            zones={zones}
            commercials={commercials}
            managers={managers}
            onAssign={handleAssignZone}
            onZoneSelect={handleSelectZone}
          />
          <GoalSettingCard
            commercials={commercials}
            onSetGoal={handleSetGoal}
          />
        </div>

        <div className="lg:col-span-2">
          <ZoneMapViewer zones={zones} focusedZone={selectedZone} />
        </div>
      </div>
    </div>
  );
};

export default AssignmentGoalsPage;
