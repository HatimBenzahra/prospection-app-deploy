// frontend-shadcn/src/pages/admin/immeubles/ImmeublesMap.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui-admin/button';
import { type Immeuble } from './columns';
import { type Zone } from '../zones/columns';
import { Eye } from 'lucide-react';



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

interface ImmeublesMapProps {
  zones: Zone[];
  immeubles: Immeuble[];
  immeubleToFocusId: string | null;
  zoneToFocusId: string | null;
  onFocusClear: () => void;
}

export const ImmeublesMap = (props: ImmeublesMapProps) => {
    const { zones, immeubles, immeubleToFocusId, zoneToFocusId, onFocusClear } = props;
    const validZones = zones.filter(z => z.latlng && typeof z.latlng[0] === 'number' && !isNaN(z.latlng[0]) && typeof z.latlng[1] === 'number' && !isNaN(z.latlng[1]));
    const validImmeubles = immeubles.filter(i => i.latlng && typeof i.latlng[0] === 'number' && !isNaN(i.latlng[0]) && typeof i.latlng[1] === 'number' && !isNaN(i.latlng[1]));
    const navigate = useNavigate();
    const mapRef = useRef<MapRef>(null);
    const [selectedImmeuble, setSelectedImmeuble] = useState<Immeuble | null>(null);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (immeubleToFocusId) {
            const immeuble = validImmeubles.find(i => i.id === immeubleToFocusId);
            if (immeuble && immeuble.latlng) {
                setSelectedImmeuble(immeuble);
                map.flyTo({ center: [immeuble.latlng[1], immeuble.latlng[0]], zoom: 17, duration: 1500 });
            }
            onFocusClear();
        } else if (zoneToFocusId) {
            const zone = validZones.find(z => z.id === zoneToFocusId);
            if (zone && zone.latlng) {
                setSelectedImmeuble(null);
                map.flyTo({ center: [zone.latlng[1], zone.latlng[0]], zoom: 14, duration: 1500 });
            }
            onFocusClear();
        } else if (validZones.length > 0 || validImmeubles.length > 0) {
            const allPoints = [
                ...validZones.map(z => [z.latlng[1], z.latlng[0]]),
                ...validImmeubles.map(i => [i.latlng[1], i.latlng[0]])
            ];
            const bounds = allPoints.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new (window as any).mapboxgl.LngLatBounds(allPoints[0], allPoints[0]));
            map.fitBounds(bounds, { padding: 80, animate: true, maxZoom: 16 });
        }
    }, [immeubleToFocusId, zoneToFocusId, mapRef, onFocusClear, validImmeubles, validZones]);

    return (
        <div className="h-[70vh] w-full rounded-lg overflow-hidden">
            <Map
                ref={mapRef}
                // mapboxApiAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                    longitude: 2.3522,
                    latitude: 48.8566,
                    zoom: 12
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
            >
                <NavigationControl position="top-right" />

                {validZones.map(zone => {
                    if (!zone.latlng) return null;
                    const [lat, lng] = zone.latlng;
                    const circle = createGeoJSONCircle([lng, lat], zone.radius);
                    return (
                        <Source key={zone.id} id={`zone-${zone.id}`} type="geojson" data={circle}>
                            <Layer
                                id={`zone-fill-${zone.id}`}
                                type="fill"
                                paint={{ 'fill-color': zone.color, 'fill-opacity': 0.1 }}
                            />
                            <Layer
                                id={`zone-line-${zone.id}`}
                                type="line"
                                paint={{ 'line-color': zone.color, 'line-width': 2 }}
                            />
                        </Source>
                    );
                })}

                {validImmeubles.map(immeuble => {
                    if (!immeuble.latlng) return null;
                    const [lat, lng] = immeuble.latlng;
                    return (
                        <Marker key={immeuble.id} longitude={lng} latitude={lat}>
                            <Popup longitude={lng} latitude={lat}>
                                <div className="space-y-2">
                                    <p className="font-bold">{immeuble.adresse}</p>
                                    <p className="text-sm text-muted-foreground">{immeuble.codePostal} {immeuble.ville}</p>
                                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => navigate(`/admin/immeubles/${immeuble.id}`)}>
                                        <Eye className="mr-2 h-4 w-4" /> Voir les portes
                                    </Button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {selectedImmeuble && selectedImmeuble.latlng && (
                    <Marker longitude={selectedImmeuble.latlng[1]} latitude={selectedImmeuble.latlng[0]} popup={new (window as any).mapboxgl.Popup({ offset: 25 }).setText(`Focus: ${selectedImmeuble.adresse}`)} />
                )}
            </Map>
        </div>
    );
};
