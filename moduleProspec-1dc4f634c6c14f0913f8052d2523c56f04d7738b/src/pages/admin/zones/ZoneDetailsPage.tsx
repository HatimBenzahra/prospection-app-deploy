import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zoneService, type ZoneDetailsFromApi } from '@/services/zone.service';
import { Button } from '@/components/ui-admin/button';
import { ArrowLeft, MapPin, Building, CheckCircle, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui-admin/skeleton';
import StatCard from '@/components/ui-admin/StatCard';
import { ZoneMap } from './ZoneMap'; // Assurez-vous que ce composant peut être réutilisé ou adapté
import type { Zone as ZoneTableType } from './columns';

const ZoneDetailsPage = () => {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const [zoneDetails, setZoneDetails] = useState<ZoneDetailsFromApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (zoneId) {
      setLoading(true);
      zoneService.getZoneDetails(zoneId)
        .then(data => {
          setZoneDetails(data);
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des détails de la zone:', error);
          setZoneDetails(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [zoneId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!zoneDetails) {
    return <div>Zone non trouvée ou erreur de chargement.</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-8">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la liste des zones
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          Zone: {zoneDetails.nom}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Nombre d'immeubles" value={zoneDetails.stats.nbImmeubles} Icon={Building} color="text-blue-500" />
        <StatCard title="Contrats Signés" value={zoneDetails.stats.totalContratsSignes} Icon={CheckCircle} color="text-emerald-500" />
        <StatCard title="RDV Pris" value={zoneDetails.stats.totalRdvPris} Icon={Briefcase} color="text-sky-500" />
      </div>

      <div className="flex-grow flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Carte de la Zone</h2>
        <div className="flex-grow w-full">
          <ZoneMap
            existingZones={[{
              id: zoneDetails.id,
              name: zoneDetails.nom,
              assignedTo: '', // L'assignation n'est pas nécessaire ici
              color: zoneDetails.couleur,
              latlng: [zoneDetails.latitude, zoneDetails.longitude],
              radius: zoneDetails.rayonMetres,
              dateCreation: zoneDetails.createdAt,
            } as ZoneTableType]}
            immeubles={zoneDetails.immeubles.map(imm => ({
              id: imm.id,
              adresse: imm.adresse,
              status: imm.status, // Le statut est déjà une chaîne de caractères
              latlng: [imm.latitude, imm.longitude],
            }))}
            zoneToFocus={zoneDetails.id}
            onFocusClear={() => {}}
            onAddZoneClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default ZoneDetailsPage;
