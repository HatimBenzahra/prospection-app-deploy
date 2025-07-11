
import React, { useEffect, useRef } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Make sure to initialize Mapbox access token
// This is likely done in a file like `src/lib/mapbox.ts`
// mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

interface AddressInputProps {
  onSelect: (address: {
    address: string;
    city: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialValue?: string;
}

const AddressInput: React.FC<AddressInputProps> = ({ onSelect, initialValue }) => {
  const geocoderContainerRef = useRef<HTMLDivElement>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null);

  useEffect(() => {
    if (geocoderContainerRef.current && !geocoderRef.current) {
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        countries: 'fr',
        language: 'fr',
        marker: false,
        placeholder: 'Rechercher une adresse...',
      });

      geocoder.addTo(geocoderContainerRef.current);
      geocoderRef.current = geocoder;

      geocoder.on('result', (e) => {
        const { result } = e;
        const address = result.place_name;
        const city = result.context.find((c: any) => c.id.startsWith('place'))?.text || '';
        const postalCode = result.context.find((c: any) => c.id.startsWith('postcode'))?.text || '';
        const [longitude, latitude] = result.center;

        onSelect({
          address,
          city,
          postalCode,
          latitude,
          longitude,
        });
      });
    }

    if (initialValue && geocoderRef.current) {
      geocoderRef.current.setInput(initialValue);
    }
  }, [onSelect, initialValue]);

  return <div ref={geocoderContainerRef} className="w-full" />;
};

export default AddressInput;
