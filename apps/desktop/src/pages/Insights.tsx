import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useEpisodesQuery } from '../hooks/queries/useEpisodes';
import { useRemindersQuery } from '../hooks/queries/useScenes';
import { 
  Users, CheckCircle2, ArrowLeft, MapPin, FileText, LayoutDashboard,
  CalendarDays, GitBranch, Bell, X, FileOutput, Tv, Briefcase,
  Clapperboard, Clock, type LucideIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExportWizardModal from '../components/export/ExportWizardModal';
import { PDFExportStrategy } from '../services/exportStrategies';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  badge?: string | number;
  subtitle: string;
  description: string;
  colorTheme: 'indigo' | 'purple' | 'emerald' | 'amber' | 'sky' | 'blue' | 'slate' | 'rose' | 'yellow' | 'primary';
  onClick: () => void;
  hasAlert?: boolean;
}

const themeStyles = {
  indigo: {
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    border: 'hover:border-indigo-500/40',
    glow: 'group-hover:shadow-indigo-500/10',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    border: 'hover:border-purple-500/40',
    glow: 'group-hover:shadow-purple-500/10',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    border: 'hover:border-emerald-500/40',
    glow: 'group-hover:shadow-emerald-500/10',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'hover:border-amber-500/40',
    glow: 'group-hover:shadow-amber-500/10',
  },
  sky: {
    iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 group-hover:bg-sky-600 group-hover:text-white',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    border: 'hover:border-sky-500/40',
    glow: 'group-hover:shadow-sky-500/10',
  },
  blue: {
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'hover:border-blue-500/40',
    glow: 'group-hover:shadow-blue-500/10',
  },
  slate: {
    iconBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 group-hover:bg-slate-600 group-hover:text-white',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    border: 'hover:border-slate-500/40',
    glow: 'group-hover:shadow-slate-500/10',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 group-hover:bg-rose-600 group-hover:text-white',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    border: 'hover:border-rose-500/40',
    glow: 'group-hover:shadow-rose-500/10',
  },
  yellow: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'hover:border-amber-500/40',
    glow: 'group-hover:shadow-amber-500/10',
  },
  primary: {
    iconBg: 'bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground',
    badge: 'bg-primary/10 text-primary border-primary/20',
    border: 'hover:border-primary/50',
    glow: 'group-hover:shadow-primary/10',
  },
};

/**
 * ModuleCard - بطاقة وحدة إنتاج تنفيذية متطورة
 */
const ModuleCard: React.FC<ModuleCardProps> = ({
  icon: Icon,
  title,
  badge,
  subtitle,
  description,
  colorTheme,
  onClick,
  hasAlert
}) => {
  const theme = themeStyles[colorTheme] || themeStyles.primary;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col justify-between p-5 bg-card hover:bg-card/95 border border-border/80 rounded-2xl text-right transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 font-sans overflow-hidden ${theme.border} ${theme.glow}`}
    >
      {/* Top row: Icon + Live Badge */}
      <div className="flex items-center justify-between w-full mb-3">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${theme.iconBg}`}>
          <Icon size={22} className="transition-transform duration-300 group-hover:scale-110" />
        </div>

        {badge !== undefined && (
          <span className={`text-xs font-black px-2.5 py-1 rounded-full border transition-colors ${theme.badge}`}>
            {badge}
          </span>
        )}

        {hasAlert && (
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse ring-4 ring-amber-500/20" />
        )}
      </div>

      {/* Middle row: Title & Subtitle / Description */}
      <div className="flex-1 min-w-0 mb-3">
        <h3 className="font-black text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs font-semibold text-muted-foreground line-clamp-1 mt-0.5">
          {subtitle}
        </p>
        <p className="text-[11px] text-muted-foreground/80 line-clamp-1 mt-1 font-normal">
          {description}
        </p>
      </div>

      {/* Footer row: Subtle navigation cue */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors w-full">
        <span>الانتقال للقسم</span>
        <ArrowLeft size={13} className="transition-transform duration-300 group-hover:-translate-x-1" />
      </div>
    </button>
  );
};

interface ReminderItem {
  id: string;
  scene_id: string;
  scene_number?: number | string;
  scene_title?: string;
  content: string;
  is_completed?: boolean;
}

/**
 * Insights - صفحة الإحصائيات والتحليلات العميقة المطورة
 */
export default function Insights() {
  const { activeScenarioId } = useUIStore();
  const { data: activeScenario } = useScenarioQuery(activeScenarioId || '');
  const { data: stats } = useScenarioStatsQuery(activeScenarioId || '');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId || '');
  const { data: rawNotesList = [], isLoading: isLoadingNotes } = useRemindersQuery(activeScenarioId || '');
  const notesList = rawNotesList as ReminderItem[];

  const { setTopBarConfig, setSidebarContext, clearSidebarContext, setSidebarExpanded } = useUIStore();
  const navigate = useNavigate();

  // Export Wizard state
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportProjectMutation = useExportProjectMutation();
  const { toasts, showToast, dismissToast } = useToast();

  // Auto-expand sidebar when entering project page
  useEffect(() => {
    setSidebarExpanded(true);
  }, [setSidebarExpanded]);

  // Redirect to dashboard if no active scenario (e.g. page refresh without persisted state)
  useEffect(() => {
    if (useUIStore.getState().hasHydrated && !activeScenarioId) {
       navigate('/');
    }
  }, [activeScenarioId, navigate]);

  useEffect(() => {
    setTopBarConfig({ 
      pageName: 'لوحة المعلومات',
      rightActions: [
        { id: 'export-project-pdf', icon: FileOutput, label: 'تصدير المشروع PDF', onClick: () => setShowExportWizard(true), variant: 'primary' },
      ]
    });
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  }, [activeScenarioId, setTopBarConfig, clearSidebarContext]);

  // Register sidebar context
  useEffect(() => {
    if (stats) {
      setSidebarContext({
        title: 'إحصائيات المشروع',
        stats: [
          { label: 'المشاهد', value: stats.totalScenes || 0 },
          { label: 'الشخصيات', value: stats.totalCharacters || 0 },
          { label: 'المواقع', value: stats.totalRealLocations || 0 },
        ],
      });
    }
  }, [stats, setSidebarContext]);

  const totalWords = (stats?.rhythmDNA || []).reduce((sum: number, s: { words?: number }) => sum + (s.words || 0), 0);
  const estimatedTime = Math.max(1, Math.ceil(totalWords / 150));

  const heroImage = activeScenario?.cover_image || '/default-hero.png';

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* ═══════════════════════════════════════════ */}
      {/* Cinematic Project Hero Header               */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-border/60 bg-black min-h-[260px] md:min-h-[290px] flex flex-col justify-end">
        {/* Background Image / Art */}
        <img 
          src={heroImage} 
          alt={activeScenario?.title || 'Hero'} 
          className="absolute inset-0 w-full h-full object-cover opacity-60 filter brightness-[0.75] contrast-[1.05] transition-transform duration-[20s] hover:scale-105"
        />
        {/* Multi-layered Deep Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

        {/* Content inside Banner */}
        <div className="relative z-10 p-6 md:p-8 lg:p-10 w-full flex flex-col gap-4 font-sans text-right">
          
          {/* Top Meta: Status pill + Genre + Director */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md text-white border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              مشروع سيناريو نشط
            </span>

            {activeScenario?.genre && (
              <span className="text-xs font-bold text-white/80 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {activeScenario.genre}
              </span>
            )}

            {(activeScenario as { director_name?: string } | undefined)?.director_name && (
              <span className="text-xs font-bold text-white/90 mr-auto flex items-center gap-1.5">
                <Clapperboard size={13} className="text-amber-400" />
                إخراج: {(activeScenario as { director_name?: string }).director_name}
              </span>
            )}
          </div>

          {/* Title & Description */}
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-xl leading-tight">
              {activeScenario?.title || 'مشروع جديد'}
            </h1>
            {activeScenario?.description && (
              <p className="text-white/80 text-sm md:text-base font-normal leading-relaxed mt-2 line-clamp-2 max-w-2xl drop-shadow">
                {activeScenario.description}
              </p>
            )}
          </div>

          {/* Bottom Row: Quick Stats & Primary Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10">
            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-bold text-white/90">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <Clapperboard size={14} className="text-indigo-400" />
                <span>{stats?.totalScenes || 0} مشهد</span>
              </div>

              {episodes && episodes.length > 0 && (
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                  <Tv size={14} className="text-purple-400" />
                  <span>{episodes.length} حلقات</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <Users size={14} className="text-emerald-400" />
                <span>{stats?.totalCharacters || 0} شخصية</span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                <MapPin size={14} className="text-amber-400" />
                <span>{stats?.totalLocations || 0} موقع</span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10 tabular-nums">
                <Clock size={14} className="text-sky-400" />
                <span>{Math.floor(estimatedTime / 60).toString().padStart(2, '0')}:{(estimatedTime % 60).toString().padStart(2, '0')}:00 مدة تقديرية</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={() => navigate('/scenarios')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-black text-xs md:text-sm shadow-xl hover:bg-white/90 hover:scale-105 transition-all duration-200"
              >
                <span>متابعة كتابة السيناريو</span>
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* Production Command Modules Grid             */}
      {/* ═══════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
            <LayoutDashboard size={18} className="text-primary" />
            <span>أقسام الإنتاج والتحكم</span>
          </h2>
          <span className="text-xs font-bold text-muted-foreground">
            الوصول السريع لكافة وحدات المشروع
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ModuleCard
            icon={Clapperboard}
            title="المشاهد"
            badge={`${stats?.totalScenes || 0} مشهد`}
            subtitle="إدارة المشاهد والتسلسل"
            description="ترتيب الفصول، البطاقات وتدفق الأحداث الدرامية"
            colorTheme="indigo"
            onClick={() => navigate('/scenarios')}
          />

          {episodes && episodes.length > 0 && (
            <ModuleCard
              icon={Tv}
              title="الحلقات"
              badge={`${episodes.length} حلقة`}
              subtitle="هيكلية وتوزيع الحلقات"
              description="تنظيم المشاهد عبر الحلقات والفصول التلفزيونية"
              colorTheme="purple"
              onClick={() => navigate('/episodes')}
            />
          )}

          <ModuleCard
            icon={Users}
            title="شخصيات العمل"
            badge={`${stats?.totalCharacters || 0} شخصية`}
            subtitle="الملفات الدرامية والأقواس"
            description="سجلات الشخصيات، الدوافع، والعلاقات النفسية"
            colorTheme="emerald"
            onClick={() => navigate('/characters')}
          />

          <ModuleCard
            icon={MapPin}
            title="مواقع التصوير"
            badge={`${stats?.totalLocations || 0} موقع`}
            subtitle="الأماكن الداخلية والخارجية"
            description="إدارة مواقع التصوير، اللوجستيات وتوزيع المشاهد"
            colorTheme="amber"
            onClick={() => navigate('/locations')}
          />

          <ModuleCard
            icon={GitBranch}
            title="شجرة العلاقات"
            badge="الروابط"
            subtitle="خريطة التحالفات والروابط"
            description="شبكة تفاعل الشخصيات والصراعات الدرامية"
            colorTheme="sky"
            onClick={() => navigate('/relationships')}
          />

          <ModuleCard
            icon={CalendarDays}
            title="جدول الإنتاج"
            badge="الجدولة"
            subtitle="خطة أيام التصوير"
            description="جداول أوقات التنفيذ، أيام الراحة وأوامر الحركة"
            colorTheme="blue"
            onClick={() => navigate('/timeline')}
          />

          <ModuleCard
            icon={Briefcase}
            title="طاقم العمل"
            badge="الفريق"
            subtitle="إدارة الفرق الفنية"
            description="توزيع المهام، مسؤولو الأقسام والإشراف الفني"
            colorTheme="slate"
            onClick={() => navigate('/crew')}
          />

          <ModuleCard
            icon={FileText}
            title="تقارير الإنتاج"
            badge="التقارير"
            subtitle="تفريغات وتحليلات متقدمة"
            description="كشوفات المشاهد، الشخصيات، والتحليلات الإحصائية"
            colorTheme="rose"
            onClick={() => navigate('/reports')}
          />

          <ModuleCard
            icon={Bell}
            title="التذكيرات والملاحظات"
            badge={notesList.length > 0 ? `${notesList.length} ملاحظة` : 'لا توجد'}
            hasAlert={notesList.length > 0}
            subtitle="ملاحظات الكاتب الخاصة"
            description="تنبيهات المشاهد والمهام المعلقة التي تتطلب مراجعة"
            colorTheme="yellow"
            onClick={() => setIsNotesModalOpen(true)}
          />

          <ModuleCard
            icon={FileOutput}
            title="تصدير المشروع"
            badge="PDF معتمد"
            subtitle="تصدير حزمة الإنتاج"
            description="إخراج السيناريو بالصيغة المعيارية الصناعية والطباعة"
            colorTheme="primary"
            onClick={() => setShowExportWizard(true)}
          />
        </div>
      </section>

      {/* Notes/Reminders Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsNotesModalOpen(false)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 font-sans" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <h3 className="font-black text-xl text-foreground">تذكيرات وملاحظات السيناريو</h3>
              </div>
              <button onClick={() => setIsNotesModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 bg-muted/10 h-[60vh] overflow-y-auto custom-scrollbar">
              {isLoadingNotes ? (
                <div className="flex justify-center items-center h-full text-muted-foreground font-bold">جاري تحميل الملاحظات...</div>
              ) : notesList.length === 0 ? (
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full gap-5">
                  <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-muted-foreground/50" />
                  </div>
                  <p className="font-medium max-w-sm">لا توجد ملاحظات أو تذكيرات للكاتب في مشاهد هذا السيناريو حالياً.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {notesList.map((reminder: ReminderItem) => (
                    <div key={reminder.id} className={`bg-card border p-5 rounded-2xl shadow-sm transition-colors text-right ${reminder.is_completed ? 'border-transparent opacity-60 bg-secondary/30' : 'border-amber-500/20 bg-amber-500/5'}`}>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
                        <span className="text-sm font-black bg-secondary px-3 py-1.5 rounded-lg text-foreground">مشهد {reminder.scene_number}</span>
                        <button 
                          onClick={() => {
                            setIsNotesModalOpen(false);
                            navigate(`/scene/${reminder.scene_id}`);
                          }}
                          className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          الذهاب للمشهد <ArrowLeft size={14} />
                        </button>
                      </div>
                      
                      <h4 className="font-black text-foreground mb-4 text-lg">{reminder.scene_title || 'بدون عنوان'}</h4>
                      
                      <div className="flex items-start gap-3 mt-2">
                        {reminder.is_completed ? (
                          <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-amber-500 mt-1 shrink-0"></div>
                        )}
                        <p className={`text-sm leading-relaxed font-medium ${reminder.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {reminder.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border bg-muted/10 flex justify-end">
              <button onClick={() => setIsNotesModalOpen(false)} className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors">
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
      <ExportWizardModal 
        isOpen={showExportWizard}
        scenario={activeScenario}
        isExporting={isExporting}
        onClose={() => !isExporting && setShowExportWizard(false)}
        onConfirm={async (options: Record<string, unknown>) => {
          if (!activeScenarioId) return;
          try {
            setIsExporting(true);
            showToast('جاري تحضير المحرك للتصدير...', 'info');
            await exportProjectMutation.mutateAsync({
              scenarioId: activeScenarioId,
              strategy: new PDFExportStrategy(options)
            });
            showToast('تمت عملية التصدير بنجاح', 'success');
            setShowExportWizard(false);
          } catch (err) {
            console.error(err);
            showToast('فشل تصدير المشروع', 'error');
          } finally {
            setIsExporting(false);
          }
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
