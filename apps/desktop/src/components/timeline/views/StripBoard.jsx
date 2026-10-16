import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, MapPin, AlignJustify, Printer, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { formatDate } from '../../../utils/dateUtils';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { exportToPDF } from '../../../utils/exportPDF';

export default function StripBoard({ shootDays, characters = [], scenario = null, episodes = [] }) {
  const getStripColor = (locationType, timeOfDay) => {
    // Industry standard strip board colors
    const isInt = locationType === 'INT';
    const isDay = timeOfDay === 'DAY' || timeOfDay === 'MORNING' || timeOfDay === 'AFTERNOON';
    
    if (isInt && isDay) return 'bg-yellow-50 text-yellow-900 border-yellow-200';
    if (!isInt && isDay) return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    if (isInt && !isDay) return 'bg-blue-50 text-blue-900 border-blue-200';
    if (!isInt && !isDay) return 'bg-slate-800 text-slate-100 border-slate-700'; // Or purple
    
    return 'bg-secondary text-foreground border-border';
  };

  const getCastString = (scene) => {
    try {
      const charIds = JSON.parse(scene.present_characters || '[]');
      return charIds.length;
    } catch(e) {
      return 0;
    }
  };

  const getSmartDuration = (val) => {
    if (!val) return 0;
    // Legacy importer stored duration in seconds (e.g., 240 for 4 pages).
    // SmartEditor stores in minutes (e.g., 4).
    // If value is > 30, it's definitely seconds.
    if (val > 30) {
      return Math.round(val / 60);
    }
    return val;
  };

  const getSmartEighths = (scene) => {
    if (scene.page_eighths && scene.page_eighths > 0) return scene.page_eighths;
    if (scene.page_count && scene.page_count > 0) return Math.ceil(scene.page_count * 8);
    // لا نقوم باختراع أرقام من المدة، إذا لم تكن مسجلة نعيد 0
    return 0;
  };

  const calculateDayStats = (scenes) => {
    if (!scenes || !Array.isArray(scenes)) return { totalEighths: 0, duration: 0 };
    let totalEighths = 0;
    let duration = 0;
    scenes.forEach(s => {
      totalEighths += getSmartEighths(s);
      duration += getSmartDuration(s.estimated_duration);
    });
    return { totalEighths, duration };
  };

  const formatPages = (eighths) => {
    if (!eighths || eighths === 0) return '—';
    const pages = eighths / 8;
    return `${Number.isInteger(pages) ? pages : pages.toFixed(1)} صفحة`;
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <AlignJustify size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">
              لوحة الشرائط (Strip Board)
            </h2>
            <p className="text-xs font-bold text-muted-foreground">التنظيم المتسلسل للمشاهد</p>
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-50 text-yellow-900 border border-yellow-200">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div> داخلي نهار
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div> خارجي نهار
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div> داخلي ليل
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 text-slate-100 border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div> خارجي ليل
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 custom-scrollbar bg-secondary/5">
        <div className="min-w-[1200px] w-full max-w-[2400px] mx-auto flex flex-col gap-1 pb-10">
          
          {/* Header Row */}
          <div className="flex items-center gap-2 p-2 px-4 text-[10px] font-black text-muted-foreground uppercase sticky top-0 bg-background z-20 border-b border-border shadow-sm">
            <div className="w-24">المشهد / الحلقة</div>
            <div className="flex-1 min-w-[150px]">عنوان المشهد</div>
            <div className="flex-1 min-w-[200px]">المكان والزمان</div>
            <div className="w-32">الشخصيات</div>
            <div className="w-24 text-center">الوزن (صفحات)</div>
            <div className="w-20 text-center">المدة</div>
            <div className="w-10 text-center"></div>
          </div>



          {/* Scheduled Days */}
          {shootDays.map((day, dIdx) => {
            return (
              <DayStripGroup 
                key={day.id}
                day={day}
                dIdx={dIdx}
                calculateDayStats={calculateDayStats}
                formatPages={formatPages}
                getStripColor={getStripColor}
                getCastString={getCastString}
                getSmartDuration={getSmartDuration}
                getSmartEighths={getSmartEighths}
                characters={characters}
                scenario={scenario}
                episodes={episodes}
              />
            );
          })}

        </div>
      </div>
    </div>
  );
}

function DayStripGroup({ day, dIdx, calculateDayStats, formatPages, getStripColor, getCastString, getSmartDuration, getSmartEighths, characters, scenario, episodes }) {
  const stats = calculateDayStats(day.scenes);
  const sceneIds = (day.scenes || []).map(s => s.id.toString());
  
  const { setNodeRef } = useDroppable({
    id: `day-drop-${day.id}`,
    data: { type: 'DayDropZone', day }
  });

  const handlePrintCallSheet = async () => {
    if (!day.scenes || day.scenes.length === 0) return;
    
    try {
      await exportToPDF({
        scenario,
        scenes: day.scenes,
        characters,
        episodes: []
      }, {
        exportType: 'CALL_SHEET',
        exportSettings: {
          enableCallSheet: true,
          callSheetDate: day.shoot_date,
          callSheetDayNumber: dIdx + 1,
          callSheetTitle: day.title
        }
      });
    } catch (err) {
      console.error("Failed to export Call Sheet:", err);
      alert("فشل في استخراج تقرير اليوم.");
    }
  };

  return (
    <div className="mt-4 mb-2" ref={setNodeRef}>
      <div className="bg-slate-900 text-white font-black text-xs py-2 px-4 rounded-md shadow-sm border border-slate-700 mb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">يوم {dIdx + 1}</span>
          <span>{day.title || `يوم التصوير`}</span>
          {day.shoot_date && <span className="opacity-70 font-normal">{formatDate(new Date(day.shoot_date), 'EEEE، d MMMM yyyy')}</span>}
        </div>
        <div className="flex items-center gap-6 opacity-90 font-bold">
          <span className="flex items-center gap-1"><AlignJustify size={12}/> {day.scenes?.length || 0} مشاهد</span>
          <span className="flex items-center gap-1 opacity-80"><Users size={12}/> {formatPages(stats.totalEighths)}</span>
          <span className="flex items-center gap-1 opacity-80"><Clock size={12}/> {stats.duration} دقيقة</span>
          
          <div className="w-px h-4 bg-slate-700 mx-1"></div>
          
          <button 
            onClick={handlePrintCallSheet}
            className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/40 text-primary-foreground px-3 py-1 rounded transition-colors"
            title="طباعة كشف الاستدعاء لهذا اليوم"
          >
            <Printer size={12} />
            <span className="text-[10px]">طباعة كشف الاستدعاء</span>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5 min-h-[40px]">
        <SortableContext items={sceneIds} strategy={verticalListSortingStrategy}>
          {(day.scenes || []).map(scene => (
            <StripRow key={scene.id} scene={scene} getStripColor={getStripColor} getCastString={getCastString} episodes={episodes} formatPages={formatPages} getSmartDuration={getSmartDuration} getSmartEighths={getSmartEighths} />
          ))}
        </SortableContext>
        {(!day.scenes || day.scenes.length === 0) && (
          <div className="p-2 text-center text-xs font-bold text-muted-foreground border border-dashed border-border rounded-md bg-secondary/20">
            لا توجد مشاهد مجدولة في هذا اليوم
          </div>
        )}
      </div>
    </div>
  );
}

function StripRow({ scene, getStripColor, getCastString, formatPages, getSmartDuration, getSmartEighths, episodes = [] }) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: scene.id.toString(),
    data: {
      type: 'Scene',
      scene
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : undefined,
    scale: isDragging ? '1.02' : '1'
  };

  const getEpisodeString = (scene) => {
    if (!scene.episode_id) return '';
    const ep = episodes.find(e => e.id === scene.episode_id);
    return ep ? `الحلقة ${ep.episode_number}` : '';
  };

  const colorClass = getStripColor(scene.location_type, scene.time_of_day);
  const epStr = getEpisodeString(scene);
  const locationType = scene.location_type === 'INT' ? 'داخلي' : 'خارجي';
  const timeOfDay = scene.time_of_day === 'DAY' ? 'نهار' : scene.time_of_day === 'NIGHT' ? 'ليل' : scene.time_of_day;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-2 px-4 text-xs font-bold rounded shadow-sm border transition-all hover:-translate-y-px hover:shadow-md cursor-grab active:cursor-grabbing ${colorClass} ${isDragging ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}`}
    >
      <div className="w-24 font-black flex flex-col justify-center">
        <span className="text-sm leading-none flex items-center gap-1">
          <span className="text-[10px] opacity-70 font-normal">مشهد</span> {scene.scene_number}
        </span>
        {epStr && <span className="text-[9px] opacity-70 mt-0.5">{epStr}</span>}
      </div>
      
      <div className="flex-1 min-w-[150px] truncate flex flex-col justify-center pr-2 border-r border-current/10">
        <span className="truncate">{scene.title || 'بدون عنوان'}</span>
      </div>
      
      <div className="flex-1 min-w-[200px] flex items-center gap-2 pr-2 border-r border-current/10">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black bg-current/10`}>{locationType}</span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-current/10">{timeOfDay}</span>
        <span className="truncate text-[11px] opacity-90"><MapPin size={10} className="inline mr-0.5 -mt-0.5"/> {scene.location_name || 'موقع غير محدد'}</span>
      </div>
      
      <div className="w-32 flex items-center gap-1 opacity-80 text-[10px] pr-2 border-r border-current/10">
        <Users size={12}/> {getCastString(scene)} ممثلين
      </div>
      
      <div className="w-24 text-center font-bold opacity-80 pr-2 border-r border-current/10 text-[10px]">
        {formatPages(getSmartEighths(scene))}
      </div>
      
      <div className="w-20 text-center flex justify-center items-center gap-1 opacity-80 pr-2 border-r border-current/10">
        <Clock size={12}/> {getSmartDuration(scene.estimated_duration)} دقيقة
      </div>
      
      <div className="w-10 flex items-center justify-center">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); navigate(`/scene/${scene.id}`); }}
          className="p-1.5 rounded-md hover:bg-current/10 transition-colors opacity-70 hover:opacity-100"
          title="تعديل المشهد"
        >
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}
