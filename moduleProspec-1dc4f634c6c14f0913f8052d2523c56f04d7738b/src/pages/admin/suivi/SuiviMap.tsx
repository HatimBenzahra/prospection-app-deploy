// src/pages/admin/suivi/SuiviMap.tsx
import { useEffect, useRef } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl';
import type { MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { type Zone, type Commercial } from './types';



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

interface SuiviMapProps {
  zones: Zone[];
  commercials: Commercial[];
  onMarkerClick: (commercial: Commercial) => void;
  selectedCommercialId?: string;
}

export const SuiviMap = ({ zones, commercials, onMarkerClick, selectedCommercialId }: SuiviMapProps) => {
  const validZones = zones.filter(z => z.latlng && typeof z.latlng[0] === 'number' && !isNaN(z.latlng[0]) && typeof z.latlng[1] === 'number' && !isNaN(z.latlng[1]));
  const validCommercials = commercials.filter(c => c.position && typeof c.position[0] === 'number' && !isNaN(c.position[0]) && typeof c.position[1] === 'number' && !isNaN(c.position[1]));
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (validZones.length > 0 || validCommercials.length > 0) {
        const allPoints = [
            ...validZones.map(z => [z.latlng[1], z.latlng[0]]),
            ...validCommercials.map(c => [c.position[1], c.position[0]])
        ];
        const bounds = allPoints.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new (window as any).mapboxgl.LngLatBounds(allPoints[0], allPoints[0]));
        map.fitBounds(bounds, { padding: 80, animate: true, maxZoom: 16 });
    }
  }, [validZones, validCommercials]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-md">
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

        {zones.map(zone => {
            const [lat, lng] = zone.latlng;
            const circle = createGeoJSONCircle([lng, lat], zone.radius);
            return (
                <Source key={zone.id} id={`zone-${zone.id}`} type="geojson" data={circle}>
                    <Layer
                        id={`zone-fill-${zone.id}`}
                        type="fill"
                        paint={{ 'fill-color': zone.color, 'fill-opacity': 0.2 }}
                    />
                    <Layer
                        id={`zone-line-${zone.id}`}
                        type="line"
                        paint={{ 'line-color': zone.color, 'line-width': 2 }}
                    />
                </Source>
            );
        })}

        {commercials.map(commercial => {
            const [lat, lng] = commercial.position;
            const color = selectedCommercialId === commercial.id ? '#22c55e' : '#09090B';
            return (
                <Marker
                    key={commercial.id}
                    longitude={lng}
                    latitude={lat}
                    onClick={() => onMarkerClick(commercial)}
                    color={color}
                >
                    <Popup longitude={lng} latitude={lat}>
                        <b>{commercial.name}</b><br/>Équipe {commercial.equipe}
                    </Popup>
                </Marker>
            );
        })}
      </Map>
    </div>
  );
};
