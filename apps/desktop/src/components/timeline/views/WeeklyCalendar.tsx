import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { formatDate } from '../../../utils/dateUtils';

export interface WeeklyCalendarProps {
  shootDays: any[];
  onCreateShootDay: (dateStr: string) => void;
}

export default function WeeklyCalendar({
  shootDays,
  onCreateShootDay
}: WeeklyCalendarProps): React.JSX.Element {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const daysInWeek = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const shootDaysMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    shootDays.forEach(day => {
      if (!day.shoot_date) return;
      const dateStr = day.shoot_date.split('T')[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(day);
    });
    return map;
  }, [shootDays]);

  const getDayTypeColor = (type?: string): string => {
    switch (type) {
      case 'SHOOT': return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
      case 'REHEARSAL': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'TRAVEL': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'SETUP': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'REST': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'REVIEW': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30';
      default: return 'bg-secondary/50 text-foreground border-border';
    }
  };

  const getDayTypeLabel = (type?: string): string => {
    const labels: Record<string, string> = {
      SHOOT: 'تصوير',
      REHEARSAL: 'بروفة',
      TRAVEL: 'تنقل',
      SETUP: 'تجهيز',
      REST: 'راحة',
      REVIEW: 'مراجعة'
    };
    return (type && labels[type]) ? labels[type] : 'غير محدد';
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground capitalize">
              الأسبوع {formatDate(daysInWeek[0], 'd MMMM')} - {formatDate(daysInWeek[6], 'd MMMM yyyy')}
            </h2>
            <p className="text-xs font-bold text-muted-foreground">جدول الإنتاج الأسبوعي</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-colors border border-border mr-4"
          >
            هذا الأسبوع
          </button>
          <div className="flex items-center bg-secondary/30 rounded-lg border border-border p-1">
            <button 
              type="button"
              onClick={handlePrevWeek} 
              className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
              title="الأسبوع السابق"
            >
              <ChevronRight size={18} />
            </button>
            <button 
              type="button"
              onClick={handleNextWeek} 
              className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
              title="الأسبوع التالي"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex relative z-0">
        {daysInWeek.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayShootDays = shootDaysMap[dateStr] || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div 
              key={dateStr}
              className={`flex-1 min-w-[200px] border-l border-border flex flex-col bg-background last:border-l-0 ${isToday ? 'bg-primary/5' : ''}`}
            >
              <div className="p-3 border-b border-border bg-secondary/10 flex flex-col gap-1 items-center justify-center">
                <span className="text-xs font-black text-muted-foreground uppercase">{formatDate(day, 'EEEE')}</span>
                <span className={`text-lg font-black ${isToday ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-3">
                {dayShootDays.length === 0 ? (
                  <button 
                    type="button"
                    onClick={() => onCreateShootDay(dateStr)}
                    className="w-full py-4 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all opacity-50 hover:opacity-100 group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-125 transition-transform">+</span>
                    <span className="text-[10px] font-bold">إضافة يوم</span>
                  </button>
                ) : (
                  dayShootDays.map((sDay, idx) => {
                    const scenes: any[] = sDay.scenes || [];
                    
                    return (
                      <div key={sDay.id} className={`rounded-xl border shadow-sm flex flex-col overflow-hidden ${getDayTypeColor(sDay.day_type || 'SHOOT')}`}>
                        <div className="p-2 border-b border-inherit bg-background/50 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black">{sDay.title || `يوم التصوير ${idx + 1}`}</span>
                            <span className="text-[9px] font-bold bg-background/80 px-1.5 py-0.5 rounded">{getDayTypeLabel(sDay.day_type || 'SHOOT')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold opacity-80">
                            <span className="flex items-center gap-1"><Clock size={10} /> {sDay.call_time || '07:00'} - {sDay.wrap_time || '20:00'}</span>
                          </div>
                        </div>

                        {scenes.length > 0 ? (
                          <div className="p-2 flex flex-col gap-1.5 bg-background">
                            {scenes.map((scene: any) => (
                              <div key={scene.id} className="p-1.5 bg-secondary/30 rounded border border-border text-[10px] flex items-center justify-between">
                                <span className="font-bold truncate flex-1">{scene.scene_number}. {scene.title}</span>
                                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Clock size={8}/> {scene.estimated_duration || 0}m</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-[10px] font-bold opacity-60 bg-background">لا توجد مشاهد مجدولة</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
