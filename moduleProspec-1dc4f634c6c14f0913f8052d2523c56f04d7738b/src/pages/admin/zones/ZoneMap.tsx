// frontend-shadcn/src/pages/admin/zones/ZoneMap.tsx

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap, FeatureGroup, Marker } from 'react-leaflet';
import type { FeatureGroup as FeatureGroupType } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { Maximize, Shrink } from 'lucide-react';
import { Button } from '@/components/ui-admin/button';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

// --- Patch et icônes ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const zoneCenterIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="hsl(222.2 47.4% 11.2%)" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="6"/></svg>'),
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
});

const searchMarkerIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="hsl(206, 92%, 52%)" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-code"><path d="M15.5 15.5 20 20"/><path d="M9 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="m14 14-2.5 2.5"/><path d="m14 6-2.5-2.5"/><path d="m6 14-2.5 2.5"/><path d="m6 6 2.5-2.5"/></svg>'),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});


interface Zone {
  id: string;
  name: string;
  assignedTo: string;
  color: string;
  latlng: L.LatLngExpression;
  radius: number;
}

interface Immeuble {
  id: string;
  adresse: string;
  latlng: L.LatLngExpression;
  status: string;
}

interface ZoneMapProps {
  existingZones: Zone[];
  immeubles?: Immeuble[]; // Rendre les immeubles optionnels
  onAddZoneClick: () => void;
  zoneToFocus: string | null;
  onFocusClear: () => void;
}

const SearchControl = () => {
    const map = useMap();
    useEffect(() => {
        const provider = new OpenStreetMapProvider({
            params: { countrycodes: 'fr', 'accept-language': 'fr' },
        });
        // @ts-ignore
        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar',
            marker: { icon: searchMarkerIcon, draggable: false },
            showPopup: false, autoClose: true, retainZoomLevel: false,
            animateZoom: true, keepResult: true, searchLabel: 'Entrez une adresse en France...', updateMap: false, 
        });
        const onLocationFound = (event: any) => {
            const { location } = event;
            if (location && location.y && location.x) {
                map.flyTo(new L.LatLng(location.y, location.x), 14, { animate: true, duration: 1.5 }); 
            }
        };
        map.addControl(searchControl);
        map.on('geosearch/showlocation', onLocationFound);
        return () => { map.removeControl(searchControl); map.off('geosearch/showlocation', onLocationFound); };
    }, [map]);
    return null;
};

const MapBoundsFitter = ({ featureGroupRef, zones }: { featureGroupRef: React.RefObject<FeatureGroupType | null>; zones: Zone[] }) => {
    const map = useMap();
    useEffect(() => {
        console.log("MapBoundsFitter received zones:", zones);
        if (!featureGroupRef.current || zones.length === 0) {
            if (zones.length > 0) {
                map.setView(zones[0].latlng, 12); // Center on the first zone if available
            } else {
                map.setView([48.8566, 2.3522], 12); // Default to Paris
            }
            return;
        }
        const bounds = featureGroupRef.current.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (zones.length > 0) {
            // Fallback if bounds are not valid (e.g., single point or all zones at same coordinate)
            map.setView(zones[0].latlng, 15);
        }
    }, [zones, featureGroupRef, map]); 
    return null;
};

const ZoneDisplay = ({ zone }: { zone: Zone }) => {
    const map = useMap();
    const handleDoubleClick = () => {
        map.flyTo(zone.latlng, 15, { animate: true, duration: 1.5 });
    };
    return (
        <>
            <Circle key={`circle-${zone.id}`} center={zone.latlng} radius={zone.radius} pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.2 }}>
                <Popup><b>{zone.name}</b></Popup>
            </Circle>
            <Marker key={`marker-${zone.id}`} position={zone.latlng} icon={zoneCenterIcon} eventHandlers={{ dblclick: handleDoubleClick, }}/>
        </>
    );
};

const MapFocusController = ({ zones, zoneToFocus, onFocusClear }: { zones: Zone[], zoneToFocus: string | null, onFocusClear: () => void }) => {
    const map = useMap();
    useEffect(() => {
        if (zoneToFocus) {
            const zone = zones.find(z => z.id === zoneToFocus);
            if (zone) {
                map.flyTo(zone.latlng, 15, { animate: true, duration: 1.5 });
                onFocusClear(); 
            }
        }
    }, [zoneToFocus, zones, map, onFocusClear]);
    return null;
}

export const ZoneMap = ({ existingZones, immeubles = [], zoneToFocus, onFocusClear }: ZoneMapProps) => {
    const featureGroupRef = useRef<FeatureGroupType>(null);
    const [isModalFullscreen, setIsModalFullscreen] = useState(false);

  return (
    <div className={cn( 'relative h-full w-full', isModalFullscreen && 'fixed inset-0 z-[2000] bg-black/80 p-4' )}>
      <div className={cn( 'relative h-full w-full', isModalFullscreen && 'rounded-lg overflow-hidden' )}>
        
        <div className="absolute top-4 right-4 z-[1001] flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="shadow-lg bg-white hover:bg-slate-100 text-slate-800"
                onClick={() => setIsModalFullscreen(!isModalFullscreen)}>
                {isModalFullscreen ? <Shrink className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
        </div>

        {/* MODIFICATION : La hauteur est maintenant toujours '100%' et la carte est toujours interactive */}
        <MapContainer 
            key={String(isModalFullscreen)}
            center={[48.8566, 2.3522]} zoom={10} 
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            scrollWheelZoom={true}
            dragging={true}
            touchZoom={true}
            className={cn(!isModalFullscreen && "rounded-lg")}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'/>
            <SearchControl />
            <MapBoundsFitter featureGroupRef={featureGroupRef} zones={existingZones} />
            <MapFocusController zones={existingZones} zoneToFocus={zoneToFocus} onFocusClear={onFocusClear} />

            <FeatureGroup ref={featureGroupRef}>
                {existingZones.map(zone => (
                    <ZoneDisplay key={zone.id} zone={zone} />
                ))}
                {immeubles.map(immeuble => (
                    <Marker key={immeuble.id} position={immeuble.latlng}>
                        <Popup>
                            <b>{immeuble.adresse}</b><br />
                            Statut: {immeuble.status}
                        </Popup>
                    </Marker>
                ))}
            </FeatureGroup>
        </MapContainer>
      </div>
    </div>
  );
};