import React, { useState, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useEpisodesQuery } from '../hooks/queries/useEpisodes';
import { useRemindersQuery } from '../hooks/queries/useScenes';
import { 
  TrendingUp, Users, Clapperboard, MessageSquare, PieChart, Clock,
  CheckCircle2, ArrowLeft, MapPin, Settings, FileText, LayoutDashboard,
  Zap, Sparkles, ChevronLeft, BarChart3, Tv, Briefcase, CalendarDays,
  GitBranch, Bell, X, FileOutput
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExportWizardModal from '../components/export/ExportWizardModal';
import { PDFExportStrategy } from '../services/exportStrategies';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';

/**
 * ActionCard - مكون زر الانتقال السريع المطور
 */
const ActionCard = ({ icon: Icon, title, statLine, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col items-center justify-center p-8 bg-card border border-border rounded-2xl text-center hover:bg-primary transition-all duration-400 overflow-hidden font-sans"
  >
    <div className="flex flex-col items-center gap-3">
      <Icon size={36} className="text-foreground group-hover:text-white transition-colors duration-400" />
      <h3 className="font-black text-xl text-foreground group-hover:text-white transition-colors duration-400 tracking-tight">{title}</h3>
    </div>
    
    <p className="text-xs font-bold text-muted-foreground mt-4 group-hover:text-white/70 transition-colors duration-400 uppercase tracking-wider">
      {statLine}
    </p>
  </button>
);

/**
 * Insights - صفحة الإحصائيات والتحليلات العميقة المطورة
 */
export default function Insights() {
  const { activeScenarioId } = useUIStore();
  const { data: activeScenario } = useScenarioQuery(activeScenarioId);
  const { data: stats } = useScenarioStatsQuery(activeScenarioId);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId);
  const { data: notesList = [], isLoading: isLoadingNotes } = useRemindersQuery(activeScenarioId);
  const { setTopBarConfig, setSidebarContext, clearSidebarContext, setSidebarExpanded } = useUIStore();
  const navigate = useNavigate();

  // Export Wizard state
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportProjectMutation = useExportProjectMutation();
  const { toasts, showToast, dismissToast } = useToast();

  // Auto-expand sidebar when entering project page
  React.useEffect(() => {
    setSidebarExpanded(true);
  }, []);

  // Redirect to dashboard if no active scenario (e.g. page refresh without persisted state)
  React.useEffect(() => {
    if (useUIStore.getState().hasHydrated && !activeScenarioId) {
       navigate('/');
    }
  }, [activeScenarioId, navigate]);

  React.useEffect(() => {
    if (activeScenarioId) {
      // Stats are automatically fetched by useScenarioStatsQuery
    }
  }, [activeScenarioId]);

  React.useEffect(() => {
    setTopBarConfig({ 
      pageName: 'لوحة المعلومات',
      rightActions: [
        { id: 'export-project-pdf', icon: FileOutput, label: 'تصدير المشروع PDF', onClick: () => setShowExportWizard(true), variant: 'primary' },
      ]
    });
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenarioId]);

  // Register sidebar context
  React.useEffect(() => {
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
  }, [stats]);

  const totalWords = (stats?.rhythmDNA || []).reduce((sum, s) => sum + s.words, 0);
  const estimatedTime = Math.max(1, Math.ceil(totalWords / 150));

  const heroImage = activeScenario?.cover_image || '/default-hero.png';

  return (
    <div className="p-4 lg:p-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ═══════════════════════════════════════════ */}
        {/* Right Column: Sticky Cinematic Poster */}
        {/* ═══════════════════════════════════════════ */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <section className="relative w-full rounded-2xl overflow-hidden shadow-2xl group flex flex-col justify-end border border-border/50" style={{ height: 'calc(100vh - 100px)' }}>
             {/* Background Image */}
             <img 
                src={heroImage} 
                alt="Hero" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-105"
             />
             {/* Deep Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90" />
             
             <div className="relative z-10 p-8 lg:p-12 w-full flex flex-col gap-2 font-sans">
                {/* Director Name */}
                {activeScenario?.director_name && (
                  <p className="text-xl md:text-2xl font-black text-white mb-1 drop-shadow-md tracking-wide">
                    إخراج: {activeScenario.director_name}
                  </p>
                )}

                {/* Title */}
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-2xl leading-normal mb-4 break-words">
                   {activeScenario?.title || 'مشروع جديد'}
                </h1>
                
                {/* Description */}
                {activeScenario?.description && (
                  <p className="text-white/80 text-lg md:text-xl font-medium leading-relaxed drop-shadow-md mb-6 line-clamp-3 max-w-2xl">
                     {activeScenario.description}
                  </p>
                )}

                {/* Genre */}
                {activeScenario?.genre && (
                  <p className="text-base md:text-lg font-bold text-white/80 drop-shadow-md mb-8 line-clamp-1 uppercase tracking-wider">
                    {activeScenario.genre}
                  </p>
                )}

                {/* Estimated Time (00:00:00 format) */}
                <span className="text-4xl md:text-5xl font-black text-white/40 tracking-tighter tabular-nums drop-shadow-lg mt-auto">
                   {Math.floor(estimatedTime / 60).toString().padStart(2, '0')}:{(estimatedTime % 60).toString().padStart(2, '0')}:00
                </span>
             </div>
          </section>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* Left Column: Management Modules */}
        {/* ═══════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-8">
          {/* Modules Grid */}
          <section>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <ActionCard 
                   icon={Users}
                   title="الشخصيات"
                   statLine={`${stats?.totalCharacters || 0} شخصية`}
                   onClick={() => navigate('/characters')}
                />
                
                {episodes && episodes.length > 0 && (
                  <ActionCard 
                     icon={Tv}
                     title="الحلقات"
                     statLine={`${episodes.length} حلقة مسجلة`}
                     onClick={() => navigate('/episodes')}
                  />
                )}
                
                <ActionCard 
                   icon={LayoutDashboard}
                   title="المشاهد"
                   statLine={`${stats?.totalScenes || 0} مشهد مسجل`}
                   onClick={() => navigate('/scenarios')}
                />
                <ActionCard 
                   icon={MapPin}
                   title="المواقع"
                   statLine={`${stats?.totalLocations || 0} موقع تصوير`}
                   onClick={() => navigate('/locations')}
                />
                <ActionCard 
                   icon={GitBranch}
                   title="شجرة العلاقات"
                   statLine="شبكة الروابط والتحالفات"
                   onClick={() => navigate('/relationships')}
                />
                <ActionCard 
                   icon={CalendarDays}
                   title="جدول الإنتاج"
                   statLine="جداول أيام التصوير"
                   onClick={() => navigate('/timeline')}
                />
                <ActionCard 
                   icon={Briefcase}
                   title="طاقم العمل"
                   statLine="إدارة الفريق الفني"
                   onClick={() => navigate('/crew')}
                />
                <ActionCard 
                   icon={FileText}
                   title="تقارير الإنتاج"
                   statLine="تفريغات وتقارير شاملة"
                   onClick={() => navigate('/reports')}
                />
                <ActionCard 
                   icon={Bell}
                   title="التذكيرات"
                   statLine="ملاحظات الكاتب الخاصة"
                   onClick={() => setIsNotesModalOpen(true)}
                />
                <ActionCard 
                   icon={FileOutput}
                   title="تصدير المشروع"
                   statLine="PDF سينمائي شامل"
                   onClick={() => setShowExportWizard(true)}
                />
             </div>
          </section>
        </div>
      </div>

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
                  {notesList.map(reminder => (
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
        onConfirm={async (options) => {
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
