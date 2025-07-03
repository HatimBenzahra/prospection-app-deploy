// src/pages/admin/suivi/SuiviMap.tsx
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Popup, FeatureGroup, Marker } from 'react-leaflet';
import type { Map as LeafletMap, FeatureGroup as FeatureGroupType } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { type Zone, type Commercial } from './types';

// --- Configuration des icônes ---

// Patch pour l'icône par défaut de Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// NOUVEAU : Icône personnalisée pour un commercial non sélectionné
const defaultIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="hsl(222.2 47.4% 11.2%)" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// NOUVEAU : Icône personnalisée pour le commercial sélectionné (plus grosse et colorée)
const selectedIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="hsl(142.1 76.2% 44.1%)" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'),
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});


// --- MODIFICATION des Props ---
interface SuiviMapProps {
  zones: Zone[];
  commercials: Commercial[];
  onMarkerClick: (commercial: Commercial) => void; // Callback pour informer le parent
  selectedCommercialId?: string; // ID du commercial sélectionné pour le style
}

export const SuiviMap = ({ zones, commercials, onMarkerClick, selectedCommercialId }: SuiviMapProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const featureGroupRef = useRef<FeatureGroupType>(null);

  useEffect(() => {
    // Centre la carte sur tous les éléments au chargement
    if (mapRef.current && featureGroupRef.current) {
        const bounds = featureGroupRef.current.getBounds();
        if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }
  }, [zones, commercials]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        ref={mapRef} 
        center={[48.8566, 2.3522]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' 
        />
        <FeatureGroup ref={featureGroupRef}>
          {/* Affichage des zones */}
          {zones.map(zone => (
            <Circle 
              key={zone.id} 
              center={zone.latlng} 
              radius={zone.radius}
              pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.2 }}
            >
              <Popup><b>Zone:</b> {zone.name}</Popup>
            </Circle>
          ))}
          {/* NOUVEAU : Affichage des commerciaux */}
          {commercials.map(commercial => (
            <Marker
              key={commercial.id}
              position={commercial.position}
              icon={selectedCommercialId === commercial.id ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => {
                  onMarkerClick(commercial); // Appel du callback au clic
                },
              }}
              zIndexOffset={selectedCommercialId === commercial.id ? 1000 : 0} // Met le marqueur sélectionné au-dessus
            >
              <Popup><b>{commercial.name}</b><br/>Équipe {commercial.equipe}</Popup>
            </Marker>
          ))}
        </FeatureGroup>
      </MapContainer>
    </div>
  );
};