import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, Popup, useMap, FeatureGroup } from 'react-leaflet';
import type { FeatureGroup as FeatureGroupType, LatLng } from 'leaflet';
import L from 'leaflet';
import 'leaflet-geosearch/dist/geosearch.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { Button } from '@/components/ui-admin/button';
import { Input } from '@/components/ui-admin/input';
import { Label } from '@/components/ui-admin/label';
import { Check, X, RotateCcw, MousePointerClick } from 'lucide-react';
import type { Zone as ZoneTableType } from './columns';

// --- Patch Leaflet et icônes ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
const searchMarkerIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="hsl(206, 92%, 52%)" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-code"><path d="M15.5 15.5 20 20"/><path d="M9 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="m14 14-2.5 2.5"/><path d="m14 6-2.5-2.5"/><path d="m6 14-2.5 2.5"/><path d="m6 6 2.5-2.5"/></svg>'),
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
});
const zoneCenterIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="hsl(222.2 47.4% 11.2%)" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="6"/></svg>'),
    iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -8],
});

interface ZoneCreatorModalProps {
  onValidate: (data: { id?: string; center: LatLng; radius: number; name: string; color: string; }) => void;
  onClose: () => void;
  existingZones: ZoneTableType[]; 
  zoneToEdit?: ZoneTableType | null;
}

const MapEventsHandler = ({ onMapClick, onMouseMove, step }: any) => {
    useMapEvents({
        click: (e) => { if (step === 1) onMapClick(e.latlng, 2); else if (step === 2) onMapClick(e.latlng, 3); },
        mousemove: (e) => { if (step === 2) onMouseMove(e.latlng); }
    });
    return null;
};
        const SearchControl = () => {
    const map = useMap();
    useEffect(() => {
        const provider = new OpenStreetMapProvider({ params: { countrycodes: 'fr', 'accept-language': 'fr' } });
        // @ts-ignore
        const searchControl = new GeoSearchControl({ provider: provider, style: 'bar', marker: { icon: searchMarkerIcon, draggable: false, }, showPopup: false, autoClose: true, retainZoomLevel: false, animateZoom: true, keepResult: true, searchLabel: 'Entrez une adresse...', updateMap: false, });
        const onLocationFound = (event: any) => { if (event.location && event.location.y && event.location.x) { map.flyTo(new L.LatLng(event.location.y, event.location.x), 14, { animate: true, duration: 1.5 }); } };
        map.addControl(searchControl);
        map.on('geosearch/showlocation', onLocationFound);
        return () => { map.removeControl(searchControl); map.off('geosearch/showlocation', onLocationFound); };
    }, [map]);
    return null;
};

const MapBoundsFitter = ({ featureGroupRef, zones }: { featureGroupRef: React.RefObject<FeatureGroupType | null>; zones: ZoneTableType[] }) => {
    const map = useMap();
    useEffect(() => {
        if (!featureGroupRef.current || zones.length === 0) {
            map.setView([48.8566, 2.3522], 12);
            return;
        }
        const bounds = featureGroupRef.current.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [zones, featureGroupRef, map]); 
    return null;
};

const ZoneMarker = ({ zone }: { zone: { latlng: L.LatLngExpression } }) => {
    const map = useMap();
    const handleDoubleClick = () => { map.flyTo(zone.latlng, 15, { animate: true, duration: 1.5 }); };
    return ( <Marker position={zone.latlng} icon={zoneCenterIcon} eventHandlers={{ dblclick: handleDoubleClick }} /> );
};

export const ZoneCreatorModal = ({ onValidate, onClose, existingZones, zoneToEdit }: ZoneCreatorModalProps) => {
    const isEditMode = !!zoneToEdit;

    const [center, setCenter] = useState<L.LatLng | null>(isEditMode ? L.latLng(zoneToEdit.latlng[0], zoneToEdit.latlng[1]) : null);
    const [radius, setRadius] = useState(isEditMode ? zoneToEdit.radius : 0);
    const [step, setStep] = useState(isEditMode ? 3 : 1);
    const [zoneName, setZoneName] = useState(isEditMode ? zoneToEdit.name : '');
    const [zoneColor, setZoneColor] = useState(isEditMode ? zoneToEdit.color : '#3388ff'); // Default blue
    
    const featureGroupRef = useRef<FeatureGroupType>(null);

    const handleMapClick = (latlng: L.LatLng, nextStep: number) => {
        if (step === 1) setCenter(latlng);
        setStep(nextStep);
    };
    const handleMouseMove = (latlng: L.LatLng) => { if (center) setRadius(center.distanceTo(latlng)); };
    const handleReset = () => { setCenter(null); setRadius(0); setStep(1); setZoneName(''); setZoneColor('#3388ff'); };

    const handleValidate = () => {
        if (center && zoneName) {
            onValidate({
                id: zoneToEdit?.id, center, radius, name: zoneName, color: zoneColor
            });
        }
    };
    
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col p-4 animate-in fade-in-0">
             <div className="flex-1 w-full relative">
                <MapContainer center={center ? [center.lat, center.lng] : [48.8566, 2.3522]} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '0.5rem', cursor: step < 3 ? 'crosshair' : 'default' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
                    <SearchControl />
                    <MapEventsHandler onMapClick={handleMapClick} onMouseMove={handleMouseMove} step={step} />
                    <MapBoundsFitter featureGroupRef={featureGroupRef} zones={existingZones} />
                    <FeatureGroup ref={featureGroupRef}>
                        {existingZones.filter(z => z.id !== zoneToEdit?.id).map(zone => (
                            <React.Fragment key={`existing-${zone.id}`}>
                                <Circle center={zone.latlng} radius={zone.radius} pathOptions={{ color: zone.color, fillColor: zone.color, fillOpacity: 0.2, weight: 2, dashArray: '5, 5' }} >
                                    <Popup><b>{zone.name}</b> (existante)</Popup>
                                </Circle>
                                <ZoneMarker zone={zone} />
                            </React.Fragment>
                        ))}
                    </FeatureGroup>
                    {center && <Marker position={center} />}
                    {center && radius > 0 && <Circle center={center} radius={radius} pathOptions={{ color: 'blue' }} />}
                </MapContainer>
                
                <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-xl w-full max-w-sm">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">
                            {isEditMode ? "Modifier la Zone" : step === 1 ? "Étape 1: Définir le centre" : step === 2 ? "Étape 2: Définir le rayon" : "Étape 3: Nommer la zone"}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={handleReset} title="Recommencer le tracé"><RotateCcw className="h-4 w-4" /></Button>
                    </div>
                    {step < 3 && !isEditMode && <p className="text-sm text-muted-foreground flex items-center gap-2"><MousePointerClick className="h-4 w-4"/>
                        {step === 1 ? 'Cliquez pour placer le centre.' : 'Déplacez, puis cliquez pour fixer le rayon.'}
                    </p>}
                    {step === 3 && (
                        <div className="space-y-3 animate-in fade-in-0">
                            <div className="space-y-1"><Label htmlFor="zone-name">Nom de la zone</Label><Input id="zone-name" value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="Ex: Zone Commerciale Nord"/></div>
                            <div className="space-y-1">
                                <Label htmlFor="zone-color">Couleur de la zone</Label>
                                <Input id="zone-color" type="color" value={zoneColor} onChange={e => setZoneColor(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <Button onClick={handleValidate} className="bg-green-600 text-white hover:bg-green-700" disabled={step !== 3 || !zoneName}>
                        <Check className="mr-2 h-4 w-4" />{isEditMode ? "Enregistrer" : "Valider"}
                    </Button>
                    <Button onClick={onClose} variant="secondary" className="bg-white hover:bg-zinc-100">
                        <X className="mr-2 h-4 w-4" />Fermer
                    </Button>
                </div>
            </div>
        </div>
    );
};