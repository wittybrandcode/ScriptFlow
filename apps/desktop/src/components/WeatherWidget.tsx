import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets } from 'lucide-react';

export interface WeatherData {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature?: number;
  is_day: number;
  precipitation?: number;
  rain?: number;
  showers?: number;
  snowfall?: number;
  weather_code: number;
  cloud_cover?: number;
  wind_speed_10m: number;
}

export interface WeatherWidgetProps {
  latitude?: number | null;
  longitude?: number | null;
}

export default function WeatherWidget({ latitude, longitude }: WeatherWidgetProps): React.JSX.Element | null {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    let active = true;
    const controller = new AbortController();
    const { signal } = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        // Use free Open-Meteo API (No API key required)
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m&timezone=auto`,
          { signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setWeather(data.current);
          }
        } else {
          if (active) {
            setError("تعذر تحميل الطقس (تأكد من الاتصال بالإنترنت)");
          }
        }
      } catch (err: unknown) {
        if (active && (err as Error).name !== 'AbortError') {
          console.error("Failed to fetch weather data:", err);
          setError("تعذر تحميل الطقس (تأكد من الاتصال بالإنترنت)");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 800);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) return null;
  if (loading) return <div className="text-xs text-muted-foreground animate-pulse p-2 bg-secondary/30 rounded-lg">جاري تحميل حالة الطقس...</div>;
  
  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-3 text-xs font-bold flex items-center gap-2 font-sans">
        <Cloud size={16} className="text-rose-500 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!weather) return null;

  // Map WMO weather codes to readable text and icons
  const getWeatherInfo = (code: number, isDay: number) => {
    if (code === 0) return { text: 'صافي', icon: isDay ? <Sun size={18} className="text-amber-400" /> : <Sun size={18} className="text-slate-300" /> };
    if (code >= 1 && code <= 3) return { text: 'غائم جزئياً', icon: <Cloud size={18} className="text-slate-400" /> };
    if (code >= 51 && code <= 67) return { text: 'ممطر', icon: <CloudRain size={18} className="text-blue-400" /> };
    if (code >= 71 && code <= 77) return { text: 'ثلوج', icon: <CloudRain size={18} className="text-white" /> };
    return { text: 'متقلب', icon: <Cloud size={18} className="text-slate-500" /> };
  };

  const info = getWeatherInfo(weather.weather_code, weather.is_day);

  return (
    <div className="bg-secondary/40 border border-border/50 rounded-xl p-3 flex flex-wrap items-center gap-4 shadow-sm animate-in fade-in duration-500">
      <div className="flex items-center gap-2 border-l border-border/50 pl-4">
        <div className="bg-background rounded-full p-1.5 shadow-sm">
          {info.icon}
        </div>
        <div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">الطقس الحالي</div>
          <div className="text-sm font-black text-foreground flex items-center gap-1">
            {Math.round(weather.temperature_2m)}°C 
            <span className="text-xs font-medium text-muted-foreground">({info.text})</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground flex-1">
        <div className="flex items-center gap-1" title="سرعة الرياح">
          <Wind size={14} className="text-blue-300" />
          <span>{weather.wind_speed_10m} كم/س</span>
        </div>
        <div className="flex items-center gap-1" title="الرطوبة">
          <Droplets size={14} className="text-teal-400" />
          <span>{weather.relative_humidity_2m}%</span>
        </div>
      </div>
      
      <div className="text-[9px] text-muted-foreground/60 w-full mt-1">
        بيانات الطقس المباشرة مقدمة من Open-Meteo
      </div>
    </div>
  );
}
