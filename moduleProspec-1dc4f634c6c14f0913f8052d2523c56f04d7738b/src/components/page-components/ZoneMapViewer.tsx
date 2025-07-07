import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import MapComponent from '@/components/MapComponent';
import { Zone } from '@/types/types';
import { Map, Pin } from 'lucide-react';

interface ZoneMapViewerProps {
  zone: Zone | null;
}

export const ZoneMapViewer = ({ zone }: ZoneMapViewerProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-600">
          <Pin className="mr-3 h-6 w-6" /> Visualisation de la Zone
        </CardTitle>
        <CardDescription>
          {zone ? `Détails pour la zone : ${zone.nom}` : 'Sélectionnez une zone pour la voir ici.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow rounded-b-lg overflow-hidden p-0">
        {zone ? (
          <MapComponent
            latitude={zone.latitude}
            longitude={zone.longitude}
            zoom={13} 
            radius={zone.rayonMetres}
            key={zone.id} // Important: force le re-rendu de la map quand la zone change
          />
        ) : (
          <div className="h-full bg-gray-100 flex flex-col items-center justify-center text-center p-8">
            <Map className="h-24 w-24 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">Aucune zone sélectionnée</h3>
            <p className="text-gray-500 mt-2">
              Veuillez choisir une zone dans le panneau d'assignation pour afficher sa localisation et son périmètre.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};