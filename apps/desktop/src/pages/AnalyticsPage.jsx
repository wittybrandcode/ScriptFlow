import React, { useEffect, useMemo, useState } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useEpisodesQuery } from '../hooks/queries/useEpisodes';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, BarChart3 } from 'lucide-react';
import {
  QuickStatsRow, RhythmDNAWidget, DialogueActionBalanceWidget,
  ProductionComplexityWidget, CharacterDialogueShareWidget,
  LocationDistributionWidget, ToneSpectrumWidget, DeepInsightsCards,
  SceneHeatmapWidget, DayNightWidget, InteractionMatrixWidget,
  DepartmentWorkloadWidget
} from '../components/analytics/AnalyticsWidgets';

/**
 * AnalyticsPage - صفحة التحليلات المتقدمة الكاملة
 * تعرض بصمة الإيقاع، توزيع الشخصيات، المواقع، حالة المشاهد، وتعقيد الإنتاج
 * كل البيانات تُحسب تلقائياً من المحتوى الموجود
 */
export default function AnalyticsPage() {
  const { activeScenarioId } = useUIStore();
  const [selectedEpisode, setSelectedEpisode] = useState('ALL');
  const { data: activeScenario } = useScenarioQuery(activeScenarioId);
  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId);
  const { data: stats } = useScenarioStatsQuery(activeScenarioId, selectedEpisode);
  const navigate = useNavigate();

  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();

  useEffect(() => {
    // Stats are automatically fetched by useScenarioStatsQuery
  }, [activeScenarioId]);

  useEffect(() => {
    setTopBarConfig({ pageName: 'التحليلات المتقدمة' });
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    dna,
    charStats,
    locStats,
    toneStats,
    dayNightRatio,
    totalDayNight,
    interactionMatrix,
    departmentWorkload,
    totalDialogueWords,
    totalActionWords,
    dialogueToActionRatio,
    complexitySummary,
    totalWords,
    totalProduction,
    avgWordsPerScene,
    heaviestScene,
    mostDialogueScene,
    maxDialogues,
    maxChars,
    maxProd,
    maxWords
  } = useMemo(() => {
    const dna = stats?.rhythmDNA || [];
    const charStats = stats?.characterStats || [];
    const locStats = stats?.locationStats || [];
    const toneStats = stats?.toneDistribution || [];
    
    const dayNightRatio = stats?.dayNightRatio || { day: 0, night: 0 };
    const totalDayNight = dayNightRatio.day + dayNightRatio.night;
    const interactionMatrix = stats?.interactionMatrix || [];
    const departmentWorkload = stats?.departmentWorkload || [];

    const totalDialogueWords = stats?.totalDialogueWords || 0;
    const totalActionWords = stats?.totalActionWords || 0;
    const dialogueToActionRatio = stats?.dialogueToActionRatio || { dialoguePercentage: 0, actionPercentage: 0 };
    const complexitySummary = stats?.complexitySummary || { simple: 0, moderate: 0, complex: 0 };

    const totalWords = dna.reduce((sum, s) => sum + s.words, 0);
    const totalProduction = dna.reduce((sum, s) => sum + s.production, 0);

    const avgWordsPerScene = dna.length > 0 ? Math.round(totalWords / dna.length) : 0;
    const heaviestScene = dna.length > 0 ? dna.reduce((max, s) => s.words > max.words ? s : max, dna[0]) : null;
    const mostDialogueScene = dna.length > 0 ? dna.reduce((max, s) => s.dialogues > max.dialogues ? s : max, dna[0]) : null;

    const maxDialogues = Math.max(...dna.map(s => s.dialogues), 1);
    const maxChars = Math.max(...dna.map(s => s.characters), 1);
    const maxProd = Math.max(...dna.map(s => s.production), 1);
    const maxWords = Math.max(...dna.map(s => s.words), 1);

    return {
      dna, charStats, locStats, toneStats,
      dayNightRatio, totalDayNight, interactionMatrix, departmentWorkload,
      totalDialogueWords, totalActionWords, dialogueToActionRatio, complexitySummary,
      totalWords, totalProduction,
      avgWordsPerScene, heaviestScene, mostDialogueScene,
      maxDialogues, maxChars, maxProd, maxWords
    };
  }, [stats]);

  // Register sidebar context
  useEffect(() => {
    if (stats && stats.isProjectSpecific) {
      setSidebarContext({
        title: 'ملخص التحليلات',
        stats: [
          { label: 'الزمن المقدر', value: `~${Math.max(1, Math.ceil(totalWords / 150))} د` },
          { label: 'نبرات مميزة', value: toneStats.length || 0 },
        ],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, totalWords, toneStats.length]);

  // 2. If no project is active at all
  if (!activeScenarioId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center">
            <BarChart3 size={36} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-2xl font-black">لا يوجد مشروع نشط</h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            يجب اختيار مشروع (سيناريو) من مكتبة المشاريع أولاً لعرض التحليلات المتقدمة.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            فتح مكتبة المشاريع
          </button>
        </div>
      </div>
    );
  }

  // 3. If loading stats for the active project
  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground font-bold animate-pulse">جاري تحميل التحليلات المتقدمة للمشروع...</p>
        </div>
      </div>
    );
  }


  // Max values are now computed via useMemo

  return (
    <div className="p-4 lg:p-8 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {stats?.hasError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl text-xs font-bold space-y-2 mb-6">
          <div>⚠️ حدث خطأ أثناء حساب الإحصائيات من قاعدة البيانات:</div>
          <pre className="bg-destructive/5 p-3 rounded-lg overflow-x-auto text-[10px] font-mono tabular-nums leading-relaxed text-left" style={{ direction: 'ltr' }}>
            {stats.errorMessage}
            {stats.errorStack && `\n\n${stats.errorStack}`}
          </pre>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/insights')}
            className="p-3 rounded-2xl bg-secondary hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">التحليلات المتقدمة</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              {activeScenario?.title} — تحليل ذاتي شامل للمحتوى والبنية الدرامية
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          <select
            value={selectedEpisode}
            onChange={(e) => setSelectedEpisode(e.target.value)}
            className="px-4 py-2 bg-secondary border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[200px]"
          >
            <option value="ALL">الكل (كافة الحلقات)</option>
            {episodes.map(ep => (
              <option key={ep.id} value={ep.id}>
                {ep.title} {ep.episode_number ? `(حلقة ${ep.episode_number})` : ''}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground bg-secondary px-5 py-2.5 rounded-full whitespace-nowrap">
            <Activity size={14} className="text-primary shrink-0" />
            {dna.length} مشهد • {totalWords} كلمة • {charStats.length} شخصية
          </div>
        </div>
      </header>

      {/* Section 1: Quick Stats Row */}
      <QuickStatsRow stats={stats} totalWords={totalWords} totalProduction={totalProduction} />

      {/* Section 2: Rhythm DNA (Full Width) */}
      <RhythmDNAWidget dna={dna} maxDialogues={maxDialogues} maxChars={maxChars} maxProd={maxProd} maxWords={maxWords} />

      {/* Section 2.5: Dramatic & Production Balance */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DialogueActionBalanceWidget dialogueToActionRatio={dialogueToActionRatio} totalDialogueWords={totalDialogueWords} totalActionWords={totalActionWords} />
        <ProductionComplexityWidget complexitySummary={complexitySummary} dnaLength={dna.length} />
      </section>


      {/* Section 3: Character + Location Side by Side */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CharacterDialogueShareWidget charStats={charStats} />
        <LocationDistributionWidget locStats={locStats} totalScenes={stats.totalScenes} />
      </section>

      {/* Section 3.5: Tone Spectrum */}
      <ToneSpectrumWidget toneStats={toneStats} />

      {/* Section 4: Deep Insights Cards */}
      <DeepInsightsCards heaviestScene={heaviestScene} mostDialogueScene={mostDialogueScene} avgWordsPerScene={avgWordsPerScene} />

      {/* Section 5: Scene Dialogue Heatmap */}
      <SceneHeatmapWidget dna={dna} maxWords={maxWords} />

      {/* Section 6: Deep Analytics (Logistics & Narrative) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DayNightWidget totalDayNight={totalDayNight} dayNightRatio={dayNightRatio} />
        <InteractionMatrixWidget interactionMatrix={interactionMatrix} />
        <DepartmentWorkloadWidget departmentWorkload={departmentWorkload} />
      </section>

      {/* Footer */}
      <footer className="p-5 rounded-2xl bg-secondary/20 border border-border border-dashed flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[10px] font-bold text-muted-foreground">
            جميع البيانات تُحسب تلقائياً من محتوى المشاهد — لا حاجة لإدخال يدوي
          </span>
        </div>
        <button
          onClick={() => navigate('/insights')}
          className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
        >
          العودة للوحة المعلومات
        </button>
      </footer>
    </div>
  );
}
