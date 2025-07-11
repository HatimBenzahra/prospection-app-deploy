import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  zoom: number;
  radius?: number;
  color?: string;
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


const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, zoom, radius, color = 'blue', onLoad }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude],
        zoom: zoom
      });
      mapRef.current.on('load', () => {
        if (onLoad) {
          onLoad();
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'zone-circle-source';
    const fillLayerId = 'zone-circle-fill-layer';
    const outlineLayerId = 'zone-circle-outline-layer';

    // Clean up previous layers and source
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (radius && latitude && longitude) {
      const center: [number, number] = [longitude, latitude];
      const circleGeoJSON = createGeoJSONCircle(center, radius);

      map.addSource(sourceId, {
        type: 'geojson',
        data: circleGeoJSON
      });

      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': color,
          'fill-opacity': 0.2
        }
      });

      map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 2
        }
      });

      // Fit map to the circle bounds
      const coordinates = circleGeoJSON.geometry.coordinates[0];
      const bounds = new mapboxgl.LngLatBounds(
        coordinates[0] as mapboxgl.LngLatLike,
        coordinates[0] as mapboxgl.LngLatLike
      );
      for (const coord of coordinates) {
        bounds.extend(coord as mapboxgl.LngLatLike);
      }
      map.fitBounds(bounds, { padding: 40, duration: 1000, maxZoom: 15 });

    } else {
        // If no radius, just center the map with default zoom
        map.setCenter([longitude, latitude]);
        map.setZoom(zoom);
    }
  }, [latitude, longitude, zoom, radius, color]);

  return <div ref={mapContainerRef} className="h-full w-full rounded-lg shadow-md" />;
};

export default MapComponent;
''