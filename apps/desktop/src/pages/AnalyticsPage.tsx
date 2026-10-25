import { useEffect, useMemo, useState } from 'react';
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
import type { RhythmDNAScene } from '../components/analytics/RhythmDNAWidget';

/**
 * AnalyticsPage - صفحة التحليلات المتقدمة الكاملة
 * تعرض بصمة الإيقاع، توزيع الشخصيات، المواقع، حالة المشاهد، وتعقيد الإنتاج
 * كل البيانات تُحسب تلقائياً من المحتوى الموجود
 */
export default function AnalyticsPage() {
  const { activeScenarioId } = useUIStore();
  const [selectedEpisode, setSelectedEpisode] = useState('ALL');
  const { data: activeScenario } = useScenarioQuery(activeScenarioId || '');
  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId || '');
  const { data: stats } = useScenarioStatsQuery(activeScenarioId || '', selectedEpisode);
  const navigate = useNavigate();

  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();

  useEffect(() => {
    setTopBarConfig({ pageName: 'التحليلات المتقدمة' });
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  }, [setTopBarConfig, clearSidebarContext]);

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
    const rawDna: RhythmDNAScene[] = (stats?.rhythmDNA as RhythmDNAScene[]) || [];
    const rawCharStats = stats?.characterStats || [];
    const rawLocStats = stats?.locationStats || [];
    const rawToneStats = stats?.toneDistribution || [];
    
    const rawDayNightRatio = stats?.dayNightRatio || { day: 0, night: 0 };
    const rawTotalDayNight = rawDayNightRatio.day + rawDayNightRatio.night;
    const rawInteractionMatrix = stats?.interactionMatrix || [];
    const rawDepartmentWorkload = stats?.departmentWorkload || [];

    const rawTotalDialogueWords = stats?.totalDialogueWords || 0;
    const rawTotalActionWords = stats?.totalActionWords || 0;
    const rawDialogueToActionRatio = stats?.dialogueToActionRatio || { dialoguePercentage: 0, actionPercentage: 0 };
    const rawComplexitySummary = stats?.complexitySummary || { simple: 0, moderate: 0, complex: 0 };

    const rawTotalWords = rawDna.reduce((sum, s) => sum + (s.words || 0), 0);
    const rawTotalProduction = rawDna.reduce((sum, s) => sum + (s.production || 0), 0);

    const rawAvgWordsPerScene = rawDna.length > 0 ? Math.round(rawTotalWords / rawDna.length) : 0;
    const rawHeaviestScene = rawDna.length > 0 ? rawDna.reduce((max, s) => s.words > max.words ? s : max, rawDna[0]) : null;
    const rawMostDialogueScene = rawDna.length > 0 ? rawDna.reduce((max, s) => s.dialogues > max.dialogues ? s : max, rawDna[0]) : null;

    const rawMaxDialogues = rawDna.length > 0 ? Math.max(...rawDna.map(s => s.dialogues || 0), 1) : 1;
    const rawMaxChars = rawDna.length > 0 ? Math.max(...rawDna.map(s => s.characters || 0), 1) : 1;
    const rawMaxProd = rawDna.length > 0 ? Math.max(...rawDna.map(s => s.production || 0), 1) : 1;
    const rawMaxWords = rawDna.length > 0 ? Math.max(...rawDna.map(s => s.words || 0), 1) : 1;

    return {
      dna: rawDna,
      charStats: rawCharStats,
      locStats: rawLocStats,
      toneStats: rawToneStats,
      dayNightRatio: rawDayNightRatio,
      totalDayNight: rawTotalDayNight,
      interactionMatrix: rawInteractionMatrix,
      departmentWorkload: rawDepartmentWorkload,
      totalDialogueWords: rawTotalDialogueWords,
      totalActionWords: rawTotalActionWords,
      dialogueToActionRatio: rawDialogueToActionRatio,
      complexitySummary: rawComplexitySummary,
      totalWords: rawTotalWords,
      totalProduction: rawTotalProduction,
      avgWordsPerScene: rawAvgWordsPerScene,
      heaviestScene: rawHeaviestScene,
      mostDialogueScene: rawMostDialogueScene,
      maxDialogues: rawMaxDialogues,
      maxChars: rawMaxChars,
      maxProd: rawMaxProd,
      maxWords: rawMaxWords
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
  }, [stats, totalWords, toneStats.length, setSidebarContext]);

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
