import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  zoom: number;
  radius?: number; // Optional radius for drawing a circle
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, zoom, radius }) => {
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Effect for map initialization and cleanup
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array: runs once on mount, cleans up on unmount

  // Effect for updating map layers and view
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return; // Ensure map is initialized before proceeding

    // Remove existing circle if any
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    // Add new circle and fit bounds if radius is provided
    if (radius) {
      const center = L.latLng(latitude, longitude);
      const circle = L.circle(center, { radius: radius, color: 'blue', fillColor: '#30f', fillOpacity: 0.2 });
      circle.addTo(map);
      map.fitBounds(circle.getBounds());
      circleRef.current = circle;
    } else {
      // If no radius, just set view
      map.setView([latitude, longitude], zoom);
    }
  }, [mapRef.current, latitude, longitude, zoom, radius]); // Dependencies: map instance and props that affect view/layers

  return <div id="map-container" ref={mapContainerRef} className="h-full w-full rounded-lg shadow-md"></div>;
};

export default MapComponent;
