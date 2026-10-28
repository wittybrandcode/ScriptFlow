import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Clock, Users, Camera, Cloud, Info } from 'lucide-react';
import { isSameDay } from 'date-fns';
import { formatDate } from '../../../utils/dateUtils';
import type { ICharacter } from '@scriptflow/core';

export interface DailyViewProps {
  shootDays: any[];
  characters: ICharacter[] | any[];
  initialSelectedDayId?: string | number | null;
  onDayChange?: (id: any) => void;
}

export default function DailyView({
  shootDays,
  characters = [],
  initialSelectedDayId,
  onDayChange
}: DailyViewProps): React.JSX.Element | null {
  const [selectedDayId, setSelectedDayId] = useState<string | number | null>(
    initialSelectedDayId || (shootDays.length > 0 ? shootDays[0].id : null)
  );

  useEffect(() => {
    if (initialSelectedDayId !== undefined && initialSelectedDayId !== null) {
      setSelectedDayId(initialSelectedDayId);
    }
  }, [initialSelectedDayId]);

  const handleSelectDay = (id: string | number) => {
    setSelectedDayId(id);
    if (onDayChange) onDayChange(id);
  };

  const selectedDay = useMemo(
    () => shootDays.find(d => String(d.id) === String(selectedDayId)),
    [shootDays, selectedDayId]
  );

  // Handle case when shootDays is empty
  if (shootDays.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background h-full text-center">
        <Info size={48} className="text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-black text-foreground mb-2">لا توجد أيام تصوير مجدولة</h2>
        <p className="text-sm font-bold text-muted-foreground">قم بإضافة أيام تصوير من العرض الشهري أو الأسبوعي.</p>
      </div>
    );
  }

  // Handle case when a day is deleted and selection becomes invalid
  if (!selectedDay && shootDays.length > 0) {
    setSelectedDayId(shootDays[0].id);
    return null;
  }

  const currentIndex = shootDays.findIndex(d => String(d.id) === String(selectedDayId));
  const handlePrevDay = () => {
    if (currentIndex > 0) handleSelectDay(shootDays[currentIndex - 1].id);
  };
  const handleNextDay = () => {
    if (currentIndex < shootDays.length - 1) handleSelectDay(shootDays[currentIndex + 1].id);
  };

  const scenes: any[] = selectedDay?.scenes || [];

  // Aggregate required cast
  const requiredCast = useMemo(() => {
    const castSet = new Set<string | number>();
    scenes.forEach(scene => {
      try {
        const charIds = JSON.parse(scene.present_characters || '[]');
        if (Array.isArray(charIds)) {
          charIds.forEach(id => castSet.add(id));
        }
      } catch (_e) {
        // Ignore parse error
      }
    });
    return (characters as any[]).filter(c => castSet.has(c.id));
  }, [scenes, characters]);

  // Aggregate locations
  const locations = useMemo(() => {
    const locSet = new Set<string>();
    scenes.forEach(scene => {
      if (scene.location_name) locSet.add(scene.location_name);
    });
    return Array.from(locSet);
  }, [scenes]);

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden" dir="rtl">
      {/* Day Selector Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-secondary/30 rounded-lg border border-border p-1">
            <button 
              onClick={handlePrevDay} 
              disabled={currentIndex === 0}
              className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              title="اليوم السابق"
            >
              <ChevronRight size={18} />
            </button>
            <span className="text-xs font-black px-4 text-foreground">
              يوم التصوير {currentIndex + 1} من {shootDays.length}
            </span>
            <button 
              onClick={handleNextDay} 
              disabled={currentIndex === shootDays.length - 1}
              className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              title="اليوم التالي"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        {selectedDay?.shoot_date && (
          <div className="text-lg font-black text-foreground capitalize flex items-center gap-2">
            {formatDate(new Date(selectedDay.shoot_date), 'EEEE, d MMMM yyyy')}
            {isSameDay(new Date(selectedDay.shoot_date), new Date()) && (
              <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">اليوم</span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-secondary/5">
        <div className="w-full max-w-[2400px] mx-auto space-y-6">
          
          {/* Top Info Banner */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex">
            <div className="bg-primary w-2 shrink-0" />
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-foreground mb-1">
                    {selectedDay?.title || `يوم التصوير ${currentIndex + 1}`}
                  </h1>
                  <p className="text-sm font-bold text-muted-foreground">
                    {selectedDay?.day_type || 'SHOOT'} | {selectedDay?.production_phase || 'PRODUCTION'} | أسبوع {selectedDay?.week_number || 1}
                  </p>
                </div>
                <div className="text-left" dir="ltr">
                  <div className="text-xl font-black text-primary">CALL: {selectedDay?.call_time || '07:00'}</div>
                  <div className="text-sm font-bold text-muted-foreground">WRAP: {selectedDay?.wrap_time || '20:00'}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm font-bold bg-secondary/50 px-3 py-1.5 rounded-lg text-foreground">
                  <Clock size={16} className="text-muted-foreground" />
                  تصوير: {selectedDay?.start_time || '08:00'} - {selectedDay?.end_time || '20:00'}
                </div>
                {selectedDay?.weather_forecast && (
                  <div className="flex items-center gap-2 text-sm font-bold bg-secondary/50 px-3 py-1.5 rounded-lg text-foreground">
                    <Cloud size={16} className="text-muted-foreground" />
                    الطقس: {selectedDay.weather_forecast}
                  </div>
                )}
                {locations.length > 0 && (
                  <div className="flex items-center gap-2 text-sm font-bold bg-secondary/50 px-3 py-1.5 rounded-lg text-foreground">
                    <MapPin size={16} className="text-muted-foreground" />
                    {locations.join('، ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column: Schedule */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera size={18} className="text-primary" />
                <h3 className="text-lg font-black">جدول المشاهد ({scenes.length})</h3>
              </div>
              
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                {scenes.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground font-bold text-sm">
                    لا توجد مشاهد مجدولة في هذا اليوم
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {scenes.map((scene, i) => (
                      <div key={scene.id} className="p-4 hover:bg-secondary/20 transition-colors flex gap-4">
                        <div className="w-8 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${scene.location_type === 'INT' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                            {scene.scene_number}
                          </div>
                          {i < scenes.length - 1 && <div className="w-px h-full bg-border mt-2" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-black text-sm truncate">{scene.title || 'بدون عنوان'}</h4>
                            <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock size={10} /> {scene.estimated_duration || 0}m
                            </span>
                          </div>
                          <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 mb-2">
                            <span>{scene.location_type === 'INT' ? 'داخلي' : 'خارجي'}</span> • 
                            <span>{scene.time_of_day === 'DAY' ? 'نهار' : scene.time_of_day === 'NIGHT' ? 'ليل' : scene.time_of_day}</span> •
                            <span className="truncate">{scene.location_name || 'موقع غير محدد'}</span>
                          </div>
                          {scene.description && (
                            <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2">
                              {scene.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Cast & Notes */}
            <div className="col-span-1 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-primary" />
                  <h3 className="text-sm font-black">الممثلون المطلوبون ({requiredCast.length})</h3>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                  {requiredCast.length === 0 ? (
                    <div className="text-center text-xs font-bold text-muted-foreground py-4">لا يوجد ممثلين مطلوبين</div>
                  ) : (
                    requiredCast.map(char => (
                      <div key={char.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                        {char.image_url ? (
                          <img src={char.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                            {(char.name || '?')[0]}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-black text-foreground">{char.name}</div>
                          <div className="text-[10px] font-bold text-muted-foreground truncate max-w-[120px]">
                            {char.actor_name || '—'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {selectedDay?.notes && (
                <div>
                  <h3 className="text-sm font-black mb-3 text-muted-foreground">ملاحظات إنتاجية</h3>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-medium text-amber-700/80 leading-relaxed whitespace-pre-wrap">
                      {selectedDay.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
