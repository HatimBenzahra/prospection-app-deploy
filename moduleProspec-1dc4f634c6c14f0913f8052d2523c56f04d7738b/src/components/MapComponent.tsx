import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Zone } from '@/types/types';

interface MapComponentProps {
  zones: Zone[];
  focusedZoneId?: string | null;
  onLoad?: () => void;
}

// --- Helper to create a GeoJSON Polygon circle ---
function createGeoJSONCircle(center: [number, number], radiusInMeters: number, points = 64) {
    const coords = {
        latitude: center[1],
        longitude: center[0]
    };

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

    return {
        type: "Feature" as const,
        geometry: {
            type: "Polygon" as const,
            coordinates: [ret]
        },
        properties: {}
    };
};

const MapComponent: React.FC<MapComponentProps> = ({ zones, focusedZoneId, onLoad }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [2.3522, 48.8566], // Paris
        zoom: 10
      });
      mapRef.current.on('load', () => {
        onLoad?.();
      });
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !zones) return;

    // Draw all zones
    zones.forEach(zone => {
      const sourceId = `zone-source-${zone.id}`;
      const fillLayerId = `zone-fill-${zone.id}`;
      const outlineLayerId = `zone-outline-${zone.id}`;

      if (map.getSource(sourceId)) {
        map.removeLayer(fillLayerId);
        map.removeLayer(outlineLayerId);
        map.removeSource(sourceId);
      }

      const circleGeoJSON = createGeoJSONCircle([zone.longitude, zone.latitude], zone.rayonMetres);
      map.addSource(sourceId, { type: 'geojson', data: circleGeoJSON });
      map.addLayer({ id: fillLayerId, type: 'fill', source: sourceId, paint: { 'fill-color': zone.couleur, 'fill-opacity': 0.2 } });
      map.addLayer({ id: outlineLayerId, type: 'line', source: sourceId, paint: { 'line-color': zone.couleur, 'line-width': 2 } });
    });

    // Focus on a specific zone or fit all zones
    if (focusedZoneId) {
      const zone = zones.find(z => z.id === focusedZoneId);
      if (zone) {
        const circleGeoJSON = createGeoJSONCircle([zone.longitude, zone.latitude], zone.rayonMetres);
        const coordinates = circleGeoJSON.geometry.coordinates[0];
        const bounds = new mapboxgl.LngLatBounds(coordinates[0] as mapboxgl.LngLatLike, coordinates[0] as mapboxgl.LngLatLike);
        for (const coord of coordinates) {
          bounds.extend(coord as mapboxgl.LngLatLike);
        }
        map.fitBounds(bounds, { padding: 40, duration: 1000, maxZoom: 15 });
      }
    } else if (zones.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      zones.forEach(zone => {
        const circleGeoJSON = createGeoJSONCircle([zone.longitude, zone.latitude], zone.rayonMetres);
        const coordinates = circleGeoJSON.geometry.coordinates[0];
        for (const coord of coordinates) {
          bounds.extend(coord as mapboxgl.LngLatLike);
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, duration: 1000 });
      }
    }

  }, [zones, focusedZoneId]);

  return <div ref={mapContainerRef} className="h-full w-full rounded-lg shadow-md" />;
};

export default MapComponent;
