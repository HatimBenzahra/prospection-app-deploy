// src/pages/commercial/ZoneFocusMap.tsx
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Patch pour les icônes Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
const buildingIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#09090B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>'),
    iconSize: [28, 28],
});

interface ZoneFocusMapProps {
  zone: {
    nom: string;
    latlng: [number, number];
    radius: number;
    color: string;
  };
  immeubles: {
    id: string;
    adresse: string;
    latlng: [number, number];
  }[];
}

export const ZoneFocusMap = ({ zone, immeubles }: ZoneFocusMapProps) => {
  return (
    // --- MODIFICATION ICI ---
    <div className="relative z-10 h-full min-h-[500px] w-full rounded-lg overflow-hidden border-2 border-[hsl(var(--winvest-blue-clair))]">
        <MapContainer 
            center={zone.latlng} 
            zoom={14} 
            style={{ height: '100%', width: '100%' }}
            dragging={true}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
        >
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Circle 
                center={zone.latlng} 
                radius={zone.radius}
                pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.2 }}
            >
                <Popup>{zone.nom}</Popup>
            </Circle>

            {immeubles.map(imm => (
                <Marker key={imm.id} position={imm.latlng} icon={buildingIcon}>
                    <Popup>{imm.adresse}</Popup>
                </Marker>
            ))}
        </MapContainer>
    </div>
  );
};