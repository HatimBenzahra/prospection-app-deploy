// src/pages/commercial/ZoneFocusMap.tsx
import Map, { Marker, Popup, Source, Layer, NavigationControl, FullscreenControl, useControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Building, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import type { MapRef } from 'react-map-gl';

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

const ThreeDControl = ({ onClick, position }: { onClick: () => void, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  useControl(() => {
    class CustomControl {
      _map: any;
      _container!: HTMLDivElement;

      onAdd(map: any) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

        const button = document.createElement('button');
        button.className = 'mapboxgl-ctrl-icon';
        button.type = 'button';
        button.title = 'Toggle 3D Buildings';
        button.style.width = '29px';
        button.style.height = '29px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.fontFamily = 'sans-serif';
        button.style.fontWeight = 'bold';
        button.textContent = '3D';
        button.onclick = onClick;

        this._container.appendChild(button);
        return this._container;
      }

      onRemove() {
        this._container.parentNode?.removeChild(this._container);
        this._map = undefined;
      }
    }
    return new CustomControl();
  }, { position });

  return null;
};

interface ZoneFocusMapProps {
  zone: {
    nom: string;
    latlng: [number, number];
    radius: number;
    color: string;
  };
  immeubles: ImmeubleFromApi[];
  className?: string;
}

export const ZoneFocusMap = ({ zone, immeubles, className }: ZoneFocusMapProps) => {
  const [selectedImmeuble, setSelectedImmeuble] = useState<ImmeubleFromApi | null>(null);
  const [show3D, setShow3D] = useState(false);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (mapRef.current) {
        if (show3D) {
            mapRef.current.easeTo({ pitch: 60, duration: 1000 });
        } else {
            mapRef.current.easeTo({ pitch: 0, duration: 1000 });
        }
    }
  }, [show3D]);

  const handleGoToZone = () => {
    const [destLat, destLng] = zone.latlng;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    window.open(url, '_blank');
  };

  const [lat, lng] = (zone.latlng && typeof zone.latlng[0] === 'number' && !isNaN(zone.latlng[0]) && typeof zone.latlng[1] === 'number' && !isNaN(zone.latlng[1])) ? zone.latlng : [0, 0]; // Default to [0,0] or handle error
  const circle = createGeoJSONCircle([lng, lat], zone.radius);

  // Filter immeubles to ensure valid latlng
  const validImmeubles = immeubles.filter(imm => imm.latitude && typeof imm.latitude === 'number' && !isNaN(imm.latitude) && imm.longitude && typeof imm.longitude === 'number' && !isNaN(imm.longitude));

  return (
    <>

      <div className={cn("relative z-10 h-full min-h-[500px] w-full rounded-lg overflow-hidden border-2 border-[hsl(var(--winvest-blue-clair))] flex flex-col", className)}>
          <Map
              ref={mapRef}
              initialViewState={{
                  longitude: lng,
                  latitude: lat,
                  zoom: 13
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              onClick={() => setSelectedImmeuble(null)}
          >
              <NavigationControl position="top-right" />
              <FullscreenControl position="top-right" />
              <ThreeDControl position="top-right" onClick={() => setShow3D(s => !s)} />
              {show3D && (
                  <Source
                      id="mapbox-dem"
                      type="raster-dem"
                      url="mapbox://mapbox.mapbox-terrain-dem-v1"
                      tileSize={512}
                      maxzoom={14}
                  />
              )}
              {show3D && (
                    <Layer
                      id="3d-buildings"
                      source="composite"
                      source-layer="building"
                      filter={['==', 'extrude', 'true']}
                      type="fill-extrusion"
                      minzoom={15}
                      paint={{
                          'fill-extrusion-color': '#aaa',
                          'fill-extrusion-height': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              15,
                              0,
                              15.05,
                              ['get', 'height']
                          ],
                          'fill-extrusion-base': [
                              'interpolate',
                              ['linear'],
                              ['zoom'],
                              15,
                              0,
                              15.05,
                              ['get', 'min_height']
                          ],
                          'fill-extrusion-opacity': 0.6
                      }}
                  />
              )}
              <Source id="zone-source" type="geojson" data={circle}>
                  <Layer
                      id="zone-fill"
                      type="fill"
                      paint={{ 'fill-color': zone.color, 'fill-opacity': 0.2 }}
                  />
                  <Layer
                      id="zone-line"
                      type="line"
                      paint={{ 'line-color': zone.color, 'line-width': 2 }}
                  />
              </Source>

              {validImmeubles.map(imm => (
                  <Marker key={imm.id} longitude={imm.longitude} latitude={imm.latitude}>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedImmeuble(imm); }} className="transform hover:scale-110 transition-transform">
                          <Building className="h-6 w-6 text-blue-600" />
                      </button>
                  </Marker>
              ))}

              {selectedImmeuble && (
                  <Popup
                      longitude={selectedImmeuble.longitude}
                      latitude={selectedImmeuble.latitude}
                      onClose={() => setSelectedImmeuble(null)}
                      closeOnClick={false}
                      offset={30}
                  >
                      <div>
                          <h3 className="font-bold">{selectedImmeuble.adresse}</h3>
                          <p>Statut: {selectedImmeuble.status}</p>
                      </div>
                  </Popup>
              )}
          </Map>
          <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-gray-700">
                      Centre de la zone : <strong>{zone.nom}</strong>
                  </p>
              </div>
              <button
                  onClick={handleGoToZone}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                  Y aller
              </button>
          </div>
      </div>
    </>
  );
};

interface ImmeubleFromApi {
  id: string;
  adresse: string;
  latitude: number;
  longitude: number;
  status: string;
}