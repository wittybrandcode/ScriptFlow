import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Activity, Camera } from 'lucide-react';
import { format, eachDayOfInterval, getMonth } from 'date-fns';
import { formatDate, getMaghrebMonths } from '../../../utils/dateUtils';

export interface YearlyHeatmapProps {
  shootDays: any[];
  onDayClick?: (dayId: string | number) => void;
}

export default function YearlyHeatmap({
  shootDays,
  onDayClick
}: YearlyHeatmapProps): React.JSX.Element {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);
  
  const daysInYear = useMemo(() => {
    return eachDayOfInterval({ start: yearStart, end: yearEnd });
  }, [currentYear]);

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

  const months = getMaghrebMonths();

  const getHeatmapColor = (count: number): string => {
    if (count === 0) return 'bg-secondary/30 hover:bg-secondary/60 border-border/80 text-muted-foreground/70 font-bold';
    if (count === 1) return 'bg-amber-400 border-amber-500 text-amber-950 shadow-md font-black';
    if (count === 2) return 'bg-amber-500 border-amber-600 text-amber-950 shadow-lg scale-[1.03] font-black z-10';
    return 'bg-amber-600 border-amber-700 text-white shadow-xl scale-[1.06] font-black z-20';
  };

  const totalShootingDays = shootDays.length;
  const totalScenes = shootDays.reduce((acc, day) => acc + (day.scenes?.length || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">
              الخريطة الحرارية لعام {currentYear}
            </h2>
            <p className="text-xs font-bold text-muted-foreground">الكثافة الإنتاجية السنوية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setCurrentYear(new Date().getFullYear())}
            className="px-3 py-1.5 text-xs font-bold bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-colors border border-border mr-4"
          >
            السنة الحالية
          </button>
          <div className="flex items-center bg-secondary/30 rounded-lg border border-border p-1">
            <button 
              type="button"
              onClick={() => setCurrentYear(prev => prev + 1)} 
              className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
              title="السنة القادمة"
            >
              <ChevronRight size={18} />
            </button>
            <button 
              type="button"
              onClick={() => setCurrentYear(prev => prev - 1)} 
              className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
              title="السنة السابقة"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-secondary/5">
        <div className="w-full max-w-[2400px] mx-auto space-y-8">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CalendarIcon size={24} />
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground">أيام التصوير المجدولة ({currentYear})</div>
                <div className="text-2xl font-black">{totalShootingDays} يوم</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Camera size={24} />
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground">إجمالي المشاهد المجدولة</div>
                <div className="text-2xl font-black">{totalScenes} مشهد</div>
              </div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex gap-4">
              {/* Months Labels */}
              <div className="flex flex-col gap-3 pt-6">
                {/* Empty space to align with day numbers header */}
                <div className="h-6" />
                {months.map((m: string, i: number) => (
                  <div key={i} className="h-10 md:h-12 text-sm font-black text-muted-foreground flex items-center justify-end w-16 pr-2">
                    {m}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 flex flex-col gap-3 pt-6 overflow-x-auto custom-scrollbar pb-6 relative">
                {/* Day names header (vertical) */}
                <div 
                  className="min-w-max pb-2" 
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(31, minmax(42px, 1fr))', gap: '0.375rem' }}
                >
                  {Array.from({ length: 31 }).map((_, dayIndex) => {
                    const sampleDay = new Date(currentYear, 0, dayIndex + 1); // Using January to get the starting weekday of the year
                    const weekdayName = formatDate(sampleDay, 'EEEE');
                    return (
                      <div key={dayIndex} className="flex items-end justify-center h-16">
                        <span 
                          className="text-[10px] font-black text-muted-foreground/60 select-none whitespace-nowrap tracking-widest"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                          {weekdayName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {Array.from({ length: 12 }).map((_, monthIndex) => {
                  const daysInThisMonth = daysInYear.filter(d => getMonth(d) === monthIndex);
                  
                  return (
                    <div 
                      key={monthIndex} 
                      className="h-10 md:h-12 min-w-max" 
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(31, minmax(42px, 1fr))', gap: '0.375rem' }}
                    >
                      {Array.from({ length: 31 }).map((_, dayIndex) => {
                        const day = daysInThisMonth[dayIndex];
                        
                        // Render empty cell if this month doesn't have this day (e.g., Feb 30th)
                        if (!day) {
                          return <div key={`empty-${dayIndex}`} className="rounded-xl border border-transparent bg-transparent" />;
                        }

                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayNum = format(day, 'd');
                        const dayShootDays = shootDaysMap[dateStr] || [];
                        const count = dayShootDays.length;

                        return (
                          <div 
                            key={dateStr}
                            title={`${formatDate(day, 'EEEE، d MMMM yyyy')}: ${count} مشاهد/أيام تصوير`}
                            onClick={() => {
                              if (count > 0 && onDayClick) {
                                onDayClick(dayShootDays[0].id);
                              }
                            }}
                            className={`relative rounded-xl border transition-all duration-300 flex items-center justify-center group select-none
                              ${count > 0 ? 'cursor-pointer hover:scale-[1.10]' : 'cursor-default'}
                              ${getHeatmapColor(count)}
                            `}
                          >
                            <span className="text-xs md:text-sm tracking-tighter">{dayNum}</span>
                            
                            {/* Hover tooltip hint directly below the number */}
                            {count > 0 && (
                              <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-current opacity-80 shadow-sm" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex items-center justify-end gap-2 text-xs font-bold text-muted-foreground">
              <span>أقل كثافة</span>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-md border bg-secondary/30 border-border/80" />
                <div className="w-6 h-6 rounded-md border bg-amber-400 border-amber-500" />
                <div className="w-6 h-6 rounded-md border bg-amber-500 border-amber-600" />
                <div className="w-6 h-6 rounded-md border bg-amber-600 border-amber-700" />
              </div>
              <span>أكثر كثافة</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
