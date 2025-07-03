// frontend-shadcn/src/pages/admin/immeubles/ImmeublesMap.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Popup, Marker, FeatureGroup } from 'react-leaflet';
import type { Map as LeafletMap, FeatureGroup as FeatureGroupType } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui-admin/button';
import { type Immeuble } from './columns';
import { type Zone } from '../zones/columns';
import { Eye } from 'lucide-react';

// --- (Icon setup and Leaflet patch) ---
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
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
});
const focusIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="hsl(142.1 76.2% 44.1%)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'),
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
});

interface ImmeublesMapProps {
  zones: Zone[];
  immeubles: Immeuble[];
  immeubleToFocusId: string | null;
  zoneToFocusId: string | null;
  onFocusClear: () => void;
}

export const ImmeublesMap = (props: ImmeublesMapProps) => {
    const { zones, immeubles, immeubleToFocusId, zoneToFocusId, onFocusClear } = props;
    const navigate = useNavigate();
    const [map, setMap] = useState<LeafletMap | null>(null);
    const featureGroupRef = useRef<FeatureGroupType>(null);
    const [selectedImmeuble, setSelectedImmeuble] = useState<Immeuble | null>(null);

    useEffect(() => {
        if (!map) return;

        if (immeubleToFocusId) {
            const immeuble = immeubles.find(i => i.id === immeubleToFocusId);
            if (immeuble) {
                setSelectedImmeuble(immeuble);
                map.flyTo(immeuble.latlng, 17, { animate: true, duration: 1.5 });
            }
            onFocusClear();
        } 
        else if (zoneToFocusId) {
            const zone = zones.find(z => z.id === zoneToFocusId);
            if (zone) {
                setSelectedImmeuble(null);
                map.flyTo(zone.latlng, 14, { animate: true, duration: 1.5 });
            }
            onFocusClear();
        }
    }, [immeubleToFocusId, zoneToFocusId, map, onFocusClear, immeubles, zones]);

    useEffect(() => {
        if (map && featureGroupRef.current) {
            const timer = setTimeout(() => {
                if (featureGroupRef.current && featureGroupRef.current.getLayers().length > 0) {
                     const bounds = featureGroupRef.current.getBounds();
                     if(bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                     }
                } else if (zones.length === 0 && immeubles.length === 0) {
                     map.setView([48.8566, 2.3522], 12);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [map, zones, immeubles]);

    return (
        <div className="h-[70vh] w-full rounded-lg overflow-hidden">
            <MapContainer ref={setMap} center={[48.8566, 2.3522]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                
                <FeatureGroup ref={featureGroupRef}>
                    {zones.map(zone => (
                        <Circle key={zone.id} center={zone.latlng} radius={zone.radius} pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.1, weight: 2 }}>
                             <Popup><b>Zone:</b> {zone.name}<br/><b>Assignée à:</b> {zone.assignedTo}</Popup>
                        </Circle>
                    ))}
                    {immeubles.map(immeuble => (
                        <Marker key={immeuble.id} position={immeuble.latlng} icon={buildingIcon}>
                            <Popup>
                                <div className="space-y-2">
                                    <p className="font-bold">{immeuble.adresse}</p>
                                    <p className="text-sm text-muted-foreground">{immeuble.codePostal} {immeuble.ville}</p>
                                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => navigate(`/admin/immeubles/${immeuble.id}`)}>
                                        <Eye className="mr-2 h-4 w-4" /> Voir les portes
                                    </Button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </FeatureGroup>

                {selectedImmeuble && (
                    <Marker position={selectedImmeuble.latlng} icon={focusIcon} zIndexOffset={1000}>
                        <Popup>
                            <p className="font-bold">Focus: {selectedImmeuble.adresse}</p>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};