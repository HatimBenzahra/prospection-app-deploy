// src/pages/commercial/ZoneFocusMap.tsx
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMemo } from 'react';
import { MapPin } from 'lucide-react';



// Helper to create a GeoJSON Polygon circle
function createGeoJSONCircle(center: [number, number], radiusInMeters: number, points = 64) {
    const coords = { latitude: center[1], longitude: center[0] };
    const km = radiusInMeters / 1000;
    const ret: [number, number][] = [];
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;
    let theta, x, y;
    for (let i = 0; i < points; i++) {
        theta = (i / points) * (2 * Math.PI);
        x = distanceX * Math.cos(theta);
        y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);
    return { type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [ret] }, properties: {} };
}

interface ZoneFocusMapProps {
  zone: {
    nom: string;
    latlng: [number, number];
    radius: number;
    color: string;
  };
  immeubles: ImmeubleFromApi[];
}

export const ZoneFocusMap = ({ zone, immeubles }: ZoneFocusMapProps) => {
  const googleMapsLink = useMemo(() => {
    const [lat, lng] = zone.latlng;
    const zoneName = encodeURIComponent(zone.nom);
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${zoneName}`;
  }, [zone]);

  const [lat, lng] = (zone.latlng && typeof zone.latlng[0] === 'number' && !isNaN(zone.latlng[0]) && typeof zone.latlng[1] === 'number' && !isNaN(zone.latlng[1])) ? zone.latlng : [0, 0]; // Default to [0,0] or handle error
  const circle = createGeoJSONCircle([lng, lat], zone.radius);

  // Filter immeubles to ensure valid latlng
  const validImmeubles = immeubles.filter(imm => imm.latitude && typeof imm.latitude === 'number' && !isNaN(imm.latitude) && imm.longitude && typeof imm.longitude === 'number' && !isNaN(imm.longitude));

  return (
    <div className="relative z-10 h-full min-h-[500px] w-full rounded-lg overflow-hidden border-2 border-[hsl(var(--winvest-blue-clair))] flex flex-col">
        <Map
            initialViewState={{
                longitude: lng,
                latitude: lat,
                zoom: 14
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
        >
            <NavigationControl position="top-right" />
            <Source id="zone-source" type="geojson" data={circle}>
                <Layer
                    id="zone-fill"
                    type="fill"
                    paint={{ 'fill-color': zone.color, 'fill-opacity': 0.2 }}
                />
                <Layer
                    id="zone-line"
                    type="line"
                    paint={{ 'line-color': zone.color, 'line-width': 2 }}
                />
            </Source>

            {immeubles.map(imm => (
                <Marker key={imm.id} longitude={imm.longitude} latitude={imm.latitude}>
                    <Popup longitude={imm.longitude} latitude={imm.latitude}>{imm.adresse}</Popup>
                </Marker>
            ))}
        </Map>
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-gray-700">
                    Centre de la zone : <strong>{zone.nom}</strong>
                </p>
            </div>
            <a 
                href={googleMapsLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
                Y aller
            </a>
        </div>
    </div>
  );
};

interface ImmeubleFromApi {
  id: string;
  adresse: string;
  latitude: number;
  longitude: number;
}
