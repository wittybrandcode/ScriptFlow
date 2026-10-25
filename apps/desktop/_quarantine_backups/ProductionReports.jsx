import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Calendar, MapPin, CheckCircle2, Circle, Printer } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useLocationsQuery, useScenesQuery, useProductionTasksQuery } from '../hooks/queries';
import { useTimelineQuery } from '../hooks/queries/useTimeline';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { CallSheetPDFStrategy } from '../services/exportStrategies';
import { formatDate } from '../utils/dateUtils';
import { useToast } from '../hooks/useToast';

export default function ProductionReports() {
  const { activeScenarioId } = useUIStore();
  const { showToast } = useToast();
  const { data: locations = [] } = useLocationsQuery(activeScenarioId);
  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();
  
  const { data: scenes = [], isLoading: loadingScenes } = useScenesQuery(activeScenarioId);
  const { data: tasks = [], isLoading: loadingTasks } = useProductionTasksQuery(activeScenarioId);
  const { data: timelineData, isLoading: loadingTimeline } = useTimelineQuery(activeScenarioId);
  const { data: activeScenario } = useScenarioQuery(activeScenarioId);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const filterDayId = searchParams.get('day') || 'ALL';
  const exportProjectMutation = useExportProjectMutation();

  const loading = loadingScenes || loadingTasks || loadingTimeline;

  useEffect(() => {
    setTopBarConfig({ pageName: 'التقارير وجدول التصوير' });

    if (activeScenarioId) {
      // Data fetching is now handled by React Query hooks
    }
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenarioId]);

  // Register sidebar context
  useEffect(() => {
    setSidebarContext({
      title: 'إحصائيات التقارير',
      stats: [
        { label: 'التقارير المتاحة', value: 3 },
      ],
    });
  }, []);



  // Filter scenes based on selected shoot day
  let filteredScenes = scenes;
  let selectedShootDay = null;

  if (filterDayId !== 'ALL' && timelineData) {
    const shootDay = timelineData.shootDays?.find(d => d.id === filterDayId);
    if (shootDay) {
      selectedShootDay = shootDay;
      filteredScenes = scenes.filter(s => s.shoot_day_id === filterDayId);
    }
  }

  // Group scenes by location
  const scenesByLocation = filteredScenes.reduce((acc, scene) => {
    const locId = scene.location_id || 'unassigned';
    if (!acc[locId]) acc[locId] = [];
    acc[locId].push(scene);
    return acc;
  }, {});

  // Pre-calculate tasks by scene_id to avoid O(N * M) nested filter
  const tasksByScene = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const sceneId = String(task.scene_id);
      if (!acc[sceneId]) acc[sceneId] = [];
      acc[sceneId].push(task);
      return acc;
    }, {});
  }, [tasks]);

  if (!activeScenarioId) {
    return <div className="p-8 text-center text-muted-foreground">الرجاء اختيار مشروع أولاً.</div>;
  }

  const handlePrint = async () => {
    try {
      await exportProjectMutation.mutateAsync({
        scenarioId: activeScenarioId,
        strategy: new CallSheetPDFStrategy({ filterDayId })
      });
    } catch (err) {
      console.error('Failed to export Call Sheet:', err);
      showToast('حدث خطأ أثناء تصدير كشف الاستدعاء.', 'error');
    }
  };

  return (
    <div className="p-4 w-full h-[calc(100vh-80px)] flex flex-col gap-4 print:p-0 print:h-auto print:block bg-background print:bg-white text-foreground print:text-black">
      {/* Print-only Header */}
      <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-black text-center mb-2 uppercase tracking-widest">كشف استدعاء (Call Sheet)</h1>
        <div className="flex justify-between items-end text-sm font-bold">
          <div>
            <div className="text-xl">{activeScenario?.title || 'مشروع بدون عنوان'}</div>
            <div className="text-gray-600">اليوم: {selectedShootDay ? formatDate(selectedShootDay.shoot_date, 'EEEE, d MMMM yyyy') : 'كافة أيام التصوير'}</div>
          </div>
          <div className="text-left" dir="ltr">
            <div>Start: {selectedShootDay?.start_time || '--:--'}</div>
            <div>End: {selectedShootDay?.end_time || '--:--'}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card border border-border p-3 rounded shrink-0 print:hidden">
        <div>
           <h2 className="text-sm font-bold text-foreground">تجميع المشاهد للإنتاج</h2>
           <p className="text-xs text-muted-foreground font-medium">خطط ليوم التصوير بجمع المشاهد ذات الموقع الموحد</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterDayId}
            onChange={(e) => setSearchParams({ day: e.target.value })}
            className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">الكل (كافة المشاهد المجدولة)</option>
            {timelineData?.shootDays?.map(day => (
              <option key={day.id} value={day.id}>
                يوم التصوير: {formatDate(day.shoot_date, 'd MMMM yyyy')}
              </option>
            ))}
          </select>
          <button 
             onClick={handlePrint}
             className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Printer size={14} /> طباعة جدول العمل (Call Sheet)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-6 print:overflow-visible print:p-0 print:space-y-4">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm font-medium print:hidden">جاري معالجة البيانات...</div>
        ) : Object.keys(scenesByLocation).length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm font-medium">لا توجد مشاهد مجدولة بعد.</div>
        ) : (
          Object.keys(scenesByLocation).map(locId => {
            const locScenes = scenesByLocation[locId];
            const locName = locId === 'unassigned' ? 'غير محدد (مواقع متفرقة)' : (locations.find(l => String(l.id) === locId)?.name || 'موقع غير معروف');
            const totalEighths = locScenes.reduce((sum, s) => sum + (s.page_eighths || 0), 0); // Future addition
            
            return (
              <div key={locId} className="bg-card border border-border rounded shadow-sm overflow-hidden break-inside-avoid print:border-black print:shadow-none print:mb-4">
                <div className="bg-secondary/40 border-b border-border p-3 flex items-center gap-2 print:bg-gray-100 print:border-black">
                  <MapPin size={18} className="text-primary" />
                  <h3 className="font-black text-foreground text-sm">{locName}</h3>
                  <span className="text-xs bg-background border border-border px-2 py-0.5 rounded font-bold text-muted-foreground mr-auto">
                    {locScenes.length} مشهد
                  </span>
                </div>
                
                <div className="divide-y divide-border/50 print:divide-black/20">
                  {locScenes.map(scene => {
                    const sceneTasks = tasksByScene[String(scene.id)] || [];
                    let chars = [];
                    try { 
                      chars = JSON.parse(scene.present_characters || '[]'); 
                    } catch(e) {
                      console.warn('Failed to parse present_characters in ProductionReports', e);
                    }

                    return (
                      <div key={scene.id} className="p-3 flex flex-col gap-2 hover:bg-secondary/10 transition-colors print:px-2 print:py-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 flex items-center justify-center bg-primary text-white font-black text-xs rounded-full">
                              {scene.scene_number}
                            </span>
                            <span className="font-bold text-sm text-foreground">{scene.title || 'بدون عنوان'}</span>
                            <span className="text-xs bg-secondary text-muted-foreground px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                              {scene.location_type} • {scene.time_of_day}
                            </span>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${scene.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {scene.status}
                          </span>
                        </div>
                        
                        <div className="flex items-start justify-between text-xs text-muted-foreground pl-8">
                          <div className="max-w-[60%] line-clamp-1">{scene.description || 'لا يوجد وصف للمشهد'}</div>
                          {chars.length > 0 && (
                             <div className="font-bold text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
                               {chars.length} شخصيات حاضرة
                             </div>
                          )}
                        </div>

                        {sceneTasks.length > 0 && (
                          <div className="mt-1 pl-8">
                             <div className="text-xs font-black text-muted-foreground mb-1 uppercase tracking-widest">متطلبات الإنتاج:</div>
                             <div className="flex flex-wrap gap-2">
                               {sceneTasks.map(t => (
                                 <div key={t.id} className="flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded text-xs font-medium text-foreground">
                                   {t.status === 'DONE' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Circle size={10} className="text-muted-foreground" />}
                                   <span>{t.department}: {t.title}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
      

    </div>
  );
}
