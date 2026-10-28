import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { formatDate } from '../../utils/dateUtils';

export interface TimelineAgendaProps {
  shootDays: any[];
  onCreateShootDay: (dateStr: string) => void;
}

export default function TimelineAgenda({
  shootDays,
  onCreateShootDay
}: TimelineAgendaProps): React.JSX.Element {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    // Adjust for Sunday-Saturday week start
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Saturday

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Map shoot days by date string (YYYY-MM-DD)
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

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'SHOOTING': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'POSTPONED': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'CANCELED': return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
      default: return 'bg-secondary/50 text-foreground border-border'; // DRAFT
    }
  };

  const weekDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden" dir="rtl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground capitalize">
              {formatDate(currentDate, 'MMMM yyyy')}
            </h2>
            <p className="text-xs font-bold text-muted-foreground">خريطة التصوير الزمنية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold bg-secondary/50 hover:bg-secondary text-foreground rounded-lg transition-colors border border-border mr-4"
          >
            اليوم
          </button>
          <div className="flex items-center bg-secondary/30 rounded-lg border border-border p-1">
            <button 
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
              title="الشهر السابق"
            >
              <ChevronRight size={18} />
            </button>
            <button 
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
              title="الشهر التالي"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative z-0">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border bg-secondary/10 sticky top-0 z-10">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-[10px] font-black text-muted-foreground border-l border-border last:border-l-0">
              {day}
            </div>
          ))}
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayShootDays = shootDaysMap[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={day.toString()} 
                onClick={() => {
                  if (dayShootDays.length === 0) {
                    onCreateShootDay(dateStr);
                  }
                }}
                className={`
                  min-h-[100px] border-b border-l border-border p-1.5 flex flex-col gap-1 transition-colors
                  ${!isCurrentMonth ? 'bg-secondary/5 text-muted-foreground/30' : 'bg-background hover:bg-secondary/10'}
                  ${dayShootDays.length === 0 ? 'cursor-pointer' : ''}
                  last:border-l-0
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                    text-xs font-black w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-primary text-primary-foreground shadow-sm' : isCurrentMonth ? 'text-foreground' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
                  {dayShootDays.map((sDay) => {
                    const totalDuration = (sDay.scenes || []).reduce((acc: number, s: any) => acc + (s.estimated_duration || 0), 0);
                    const isOverload = totalDuration > 720; // > 12 hours

                    return (
                      <div 
                        key={sDay.id} 
                        className={`p-1.5 rounded-md border text-[10px] flex flex-col gap-1 shadow-sm cursor-default
                          ${getStatusColor(sDay.status)}
                        `}
                        onClick={(e) => e.stopPropagation()} // Prevent creating a new day when clicking an existing one
                      >
                        <div className="flex items-center justify-between font-black">
                          <span>يوم التصوير {shootDays.findIndex(d => String(d.id) === String(sDay.id)) + 1}</span>
                          <span className="text-[9px] bg-background/50 px-1 rounded">
                            {(sDay.scenes || []).length} مشهد
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[9px] font-bold opacity-80 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Clock size={8} /> {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                          </span>
                          {isOverload && <AlertTriangle size={8} className="text-rose-500" />}
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayShootDays.length === 0 && isCurrentMonth && (
                    <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-[10px] font-bold text-primary/50 flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
                        <span className="text-lg leading-none">+</span> يوم جديد
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
