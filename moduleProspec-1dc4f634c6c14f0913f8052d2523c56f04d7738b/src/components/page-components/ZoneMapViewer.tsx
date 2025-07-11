import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui-admin/card';
import MapComponent from '@/components/MapComponent';
import { Map, Pin } from 'lucide-react';
import type { Zone } from '@/types/types';

interface ZoneMapViewerProps {
  zones: Zone[];
  focusedZone: Zone | null;
  onMapLoad?: () => void;
}

export const ZoneMapViewer = ({ zones, focusedZone, onMapLoad }: ZoneMapViewerProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-600">
          <Pin className="mr-3 h-6 w-6" /> Visualisation des Zones
        </CardTitle>
        <CardDescription>
          {focusedZone ? `Zone sélectionnée : ${focusedZone.nom}` : 'Vue d\'ensemble des zones'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow rounded-b-lg overflow-hidden p-0">
        <MapComponent
          zones={zones}
          focusedZoneId={focusedZone?.id || null}
          onLoad={onMapLoad}
        />
      </CardContent>
    </Card>
  );
};
