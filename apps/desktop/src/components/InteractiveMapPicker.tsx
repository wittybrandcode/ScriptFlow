import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LatLngLiteral } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, WifiOff } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// 100% Offline-Safe SVG Marker Icon
const customOfflineIcon = L.divIcon({
  html: renderToStaticMarkup(<MapPin color="#ef4444" fill="#ef4444" size={32} />),
  className: 'custom-offline-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Override default marker icon globally
L.Marker.prototype.options.icon = customOfflineIcon;

export interface CoordinatesChange {
  latitude: number | null;
  longitude: number | null;
}

export interface InteractiveMapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onChange?: (coords: CoordinatesChange) => void;
}

interface LocationMarkerProps {
  position: LatLngLiteral | null;
  setPosition: (pos: LatLngLiteral) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps): React.JSX.Element | null {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function InteractiveMapPicker({ 
  latitude, 
  longitude, 
  onChange 
}: InteractiveMapPickerProps): React.JSX.Element {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [position, setPosition] = useState<LatLngLiteral | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  const [latInput, setLatInput] = useState<string | number>(latitude || '');
  const [lngInput, setLngInput] = useState<string | number>(longitude || '');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSetPosition = (newPos: LatLngLiteral) => {
    setPosition(newPos);
    if (newPos) {
      setLatInput(newPos.lat);
      setLngInput(newPos.lng);
      if (onChange) {
        onChange({ latitude: newPos.lat, longitude: newPos.lng });
      }
    }
  };

  const handleManualChange = (latVal: string | number, lngVal: string | number) => {
    const lat = typeof latVal === 'string' ? parseFloat(latVal) : latVal;
    const lng = typeof lngVal === 'string' ? parseFloat(lngVal) : lngVal;
    if (!isNaN(lat) && !isNaN(lng)) {
      const newPos = { lat, lng };
      setPosition(newPos);
      if (onChange) {
        onChange({ latitude: lat, longitude: lng });
      }
    } else {
      if (onChange) {
        onChange({ 
          latitude: !isNaN(lat) ? lat : null, 
          longitude: !isNaN(lng) ? lng : null 
        });
      }
    }
  };

  const defaultCenter: LatLngLiteral = { lat: 36.7538, lng: 3.0588 }; // Algiers default

  return (
    <div className="w-full space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <MapPin size={14} className="text-primary" />
          تحديد الموقع الجغرافي
        </label>
        {position && (
          <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </span>
        )}
      </div>

      {!isOnline ? (
        <div className="bg-secondary/40 border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
              <WifiOff size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">وضع عدم الاتصال بالإنترنت</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                الخريطة التفاعلية غير متوفرة بدون اتصال بالإنترنت. يمكنك إدخال إحداثيات الموقع يدوياً أدناه لحفظها.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">خط العرض (Latitude)</span>
              <input
                type="number"
                step="any"
                placeholder="مثال: 36.7538"
                value={latInput}
                onChange={(e) => {
                  setLatInput(e.target.value);
                  handleManualChange(e.target.value, lngInput);
                }}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">خط الطول (Longitude)</span>
              <input
                type="number"
                step="any"
                placeholder="مثال: 3.0588"
                value={lngInput}
                onChange={(e) => {
                  setLngInput(e.target.value);
                  handleManualChange(latInput, e.target.value);
                }}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[300px] w-full rounded-2xl overflow-hidden border-2 border-border focus-within:border-primary transition-colors relative z-0">
          <MapContainer 
            center={position || defaultCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={handleSetPosition} />
          </MapContainer>
          
          {!position && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
              <div className="bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md">
                انقر على الخريطة لتحديد الموقع
              </div>
            </div>
          )}
        </div>
      )}

      {isOnline && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">خط العرض (Latitude)</span>
            <input
              type="number"
              step="any"
              placeholder="36.7538"
              value={latInput}
              onChange={(e) => {
                setLatInput(e.target.value);
                handleManualChange(e.target.value, lngInput);
              }}
              className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">خط الطول (Longitude)</span>
            <input
              type="number"
              step="any"
              placeholder="3.0588"
              value={lngInput}
              onChange={(e) => {
                setLngInput(e.target.value);
                handleManualChange(latInput, e.target.value);
              }}
              className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">تستخدم هذه الإحداثيات لحساب مسار الإنتاج والطقس لاحقاً. هذه الخريطة مجانية وتعمل بدون مفاتيح API.</p>
    </div>
  );
}
