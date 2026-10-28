import React, { useMemo } from 'react';
import { CalendarDays, Clock, AlertCircle, Target } from 'lucide-react';

export interface TimelineStatsProps {
  shootDays?: any[];
  unscheduledScenes?: any[];
}

export default function TimelineStats({ 
  shootDays = [], 
  unscheduledScenes = [] 
}: TimelineStatsProps): React.JSX.Element {
  const stats = useMemo(() => {
    let scheduled = 0;
    let missingLocation = 0;
    let totalEstimatedDuration = 0; // minutes
    let completedDays = 0;

    shootDays.forEach(day => {
      const dayScenes = (day.scenes as any[]) || [];
      scheduled += dayScenes.length;
      
      if (day.status === 'COMPLETED') completedDays++;

      dayScenes.forEach(s => {
        if (!s.location_id) missingLocation++;
        totalEstimatedDuration += (s.estimated_duration || 0);
      });
    });

    const unscheduled = unscheduledScenes.length;
    
    unscheduledScenes.forEach(s => {
      if (!s.location_id) missingLocation++;
      totalEstimatedDuration += (s.estimated_duration || 0);
    });

    const totalScenes = scheduled + unscheduled;
    const progressPercent = totalScenes === 0 ? 0 : Math.round((scheduled / totalScenes) * 100);
    const totalHours = Math.round(totalEstimatedDuration / 60);

    return {
      days: shootDays.length,
      scheduled,
      unscheduled,
      missingLocation,
      totalScenes,
      progressPercent,
      totalHours,
      completedDays
    };
  }, [shootDays, unscheduledScenes]);

  return (
    <div className="bg-card border-b border-border p-3 flex flex-wrap items-center gap-4 z-30 shrink-0 shadow-sm relative">
      
      {/* Global Progress */}
      <div className="flex-1 min-w-[250px] bg-secondary/30 px-4 py-2.5 rounded-xl border border-border/50 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
            <Target size={12} /> تقدم الجدولة
          </span>
          <span className="text-xs font-black text-primary">{stats.progressPercent}%</span>
        </div>
        <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] font-bold text-muted-foreground">
          <span>{stats.scheduled} مجدول</span>
          <span>من أصل {stats.totalScenes}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Days */}
        <div className="flex items-center gap-3 bg-secondary/30 px-3 py-2 rounded-xl border border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <CalendarDays size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground">أيام التصوير</p>
            <p className="text-sm font-black text-foreground">{stats.completedDays} / {stats.days}</p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-3 bg-secondary/30 px-3 py-2 rounded-xl border border-border/50">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground">إجمالي الساعات</p>
            <p className="text-sm font-black text-foreground">{stats.totalHours} س</p>
          </div>
        </div>
      </div>

      {/* Missing Location Warning */}
      {stats.missingLocation > 0 && (
        <div className="flex items-center gap-3 bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 flex items-center justify-center">
            <AlertCircle size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-600/70">بدون مواقع تصوير</p>
            <p className="text-sm font-black text-rose-600">{stats.missingLocation} مشهد</p>
          </div>
        </div>
      )}
    </div>
  );
}
