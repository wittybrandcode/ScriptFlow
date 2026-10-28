import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in leaflet with react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/react/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapDisplayProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export default function MapDisplay({ latitude, longitude, address }: MapDisplayProps): React.JSX.Element {
  if (!latitude || !longitude) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-secondary text-muted-foreground">
        <span className="font-bold">الموقع الجغرافي غير متوفر</span>
        {address && <span className="text-xs mt-1">العنوان: {address}</span>}
      </div>
    );
  }

  const position: LatLngExpression = { lat: latitude, lng: longitude };

  return (
    <div className="w-full h-full z-0 relative">
      <MapContainer 
        center={position} 
        zoom={15} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} />
      </MapContainer>
    </div>
  );
}
