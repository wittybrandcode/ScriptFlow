import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Tv, Plus, Trash2, Edit3, Save, X, Clapperboard, 
  CheckCircle2, Clock, FileText, TrendingUp,
  Users, MessageSquare, Timer, BarChart3, Layers, AlertCircle, FileOutput, Loader2
} from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery } from '../hooks/queries/useScenarios';
import { useEpisodesQuery, useCreateEpisodeMutation, useUpdateEpisodeMutation, useDeleteEpisodeMutation, useEpisodeStatsQuery } from '../hooks/queries/useEpisodes';
import ExportWizardModal from '../components/export/ExportWizardModal';
import { PDFExportStrategy } from '../services/exportStrategies';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { formatDate } from '../utils/dateUtils';
import ConfirmModal from '../components/common/ConfirmModal';
import StatCard from '../components/dashboard/StatCard';
import type { IEpisode, IScenario } from '@scriptflow/core';

const SafeExportWizardModal = ExportWizardModal as React.ComponentType<any>;
const SafeStatCard = StatCard as React.ComponentType<any>;

interface EditFormState {
  title: string;
  description: string;
  status: string;
}

export default function EpisodesPage() {
  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();
  const { activeScenarioId } = useUIStore();
  const { data: rawScenario } = useScenarioQuery(activeScenarioId || '');
  const activeScenario = rawScenario as IScenario | undefined;
  const { data: rawEpisodes = [] } = useEpisodesQuery(activeScenarioId || '');
  const episodes = (rawEpisodes as IEpisode[]) || [];
  const createEpisodeMutation = useCreateEpisodeMutation();
  const updateEpisodeMutation = useUpdateEpisodeMutation();
  const deleteEpisodeMutation = useDeleteEpisodeMutation();
  const navigate = useNavigate();
  const { toasts, showToast, dismissToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ title: '', description: '', status: 'DRAFT' });
  const [showStats, setShowStats] = useState<boolean>(false);
  const { data: stats, isLoading: statsLoading } = useEpisodeStatsQuery(showStats && activeScenarioId ? activeScenarioId : null);

  // Episode Export state
  const [exportEpisode, setExportEpisode] = useState<IEpisode | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [episodeToDelete, setEpisodeToDelete] = useState<IEpisode | null>(null);
  const exportProjectMutation = useExportProjectMutation() as any;

  useEffect(() => {
    if (!activeScenarioId) {
      navigate('/');
      return;
    }
  }, [activeScenarioId, navigate]);

  const handleCreateEpisode = useCallback(async () => {
    if (!activeScenarioId) return;
    try {
      const ep = await createEpisodeMutation.mutateAsync({ scenario_id: activeScenarioId, title: '', episode_number: episodes.length + 1 }) as any;
      if (ep) {
        showToast('تم إنشاء حلقة جديدة', 'success');
        setEditingId(ep.id);
        setEditForm({ title: ep.title || '', description: ep.description || '', status: ep.status || 'DRAFT' });
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeScenarioId, episodes.length, createEpisodeMutation, showToast]);

  // Header
  const handleCreateEpisodeRef = useRef(handleCreateEpisode);
  handleCreateEpisodeRef.current = handleCreateEpisode;

  useEffect(() => {
    const infoText = `${episodes.length} حلقة مسجلة${stats?.totalDuration > 0 ? ` • ${stats.totalDuration} دقيقة` : ''}`;

    setTopBarConfig({
      pageName: 'الحلقات',
      actions: [
        { id: 'info', label: infoText, variant: 'ghost' }
      ],
      rightActions: [
        { id: 'new', label: 'حلقة جديدة', icon: Plus, onClick: () => handleCreateEpisodeRef.current(), variant: 'primary' }
      ]
    });
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  }, [activeScenario, episodes.length, stats?.totalDuration, setTopBarConfig, clearSidebarContext]);

  // Register sidebar context
  useEffect(() => {
    if (stats) {
      setSidebarContext({
        title: 'إحصائيات الحلقات',
        stats: [
          { label: 'إجمالي الحلقات', value: stats.totalEpisodes || 0 },
          { label: 'نسبة الإنجاز', value: `${stats.completionRate || 0}%` },
        ],
      });
    }
  }, [stats, setSidebarContext]);

  function startEditing(ep: IEpisode) {
    setEditingId(ep.id);
    setEditForm({ title: ep.title || '', description: ep.description || '', status: ep.status || 'DRAFT' });
  }

  async function handleSaveEdit(ep: IEpisode) {
    if (!activeScenarioId) return;
    try {
      await updateEpisodeMutation.mutateAsync({
        id: ep.id,
        data: {
          ...editForm,
          episode_number: ep.episode_number
        }
      });
      setEditingId(null);
      showToast('تم حفظ التعديلات', 'success');
    } catch (err) {
      console.error(err);
    }
  }

  function handleDelete(ep: IEpisode) {
    setEpisodeToDelete(ep);
  }

  async function handleConfirmDeleteEpisode() {
    if (!episodeToDelete || !activeScenarioId) return;
    try {
      await deleteEpisodeMutation.mutateAsync(episodeToDelete.id);
      showToast('تم حذف الحلقة بنجاح', 'info');
      setEpisodeToDelete(null);
    } catch (err) {
      console.error(err);
      showToast('فشل حذف الحلقة', 'error');
    }
  }

  const STATUS_MAP: Record<string, { label: string; color: string; barColor: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    DRAFT: { label: 'مسودة', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', barColor: 'bg-zinc-400', icon: FileText },
    IN_PROGRESS: { label: 'قيد العمل', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', barColor: 'bg-blue-500', icon: Clock },
    COMPLETED: { label: 'مكتمل', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', barColor: 'bg-emerald-500', icon: CheckCircle2 },
  };

  // Max scenes in any episode (for bar chart scaling)
  const maxScenesInEpisode = stats?.perEpisode?.reduce((max: number, ep: any) => Math.max(max, ep.scene_count), 0) || 1;

  return (
    <div className="min-h-full font-sans animate-in fade-in duration-500 bg-background/30 pb-20 pt-8">
      <main className="w-full px-8 space-y-6">

        {/* ═══════════════════════════════════════════ */}
        {/* Statistics Dashboard */}
        {/* ═══════════════════════════════════════════ */}
        {!showStats && episodes.length > 0 && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowStats(true)}
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground hover:bg-secondary/80 rounded-xl transition-all shadow-sm font-bold text-sm"
            >
              {statsLoading ? <Loader2 className="animate-spin" size={18} /> : <BarChart3 size={18} />}
              عرض إحصائيات الحلقات المتقدمة
            </button>
          </div>
        )}

        {showStats && statsLoading && (
          <div className="flex justify-center items-center py-10 text-muted-foreground font-bold">
            <Loader2 className="animate-spin ml-2" size={24} />
            جاري حساب الإحصائيات (SQL Joins)...
          </div>
        )}

        {showStats && stats && !statsLoading && episodes.length > 0 && (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-in slide-in-from-bottom-4 duration-500">
              <SafeStatCard icon={Tv} label="الحلقات" value={stats.totalEpisodes} color="primary" />
              <SafeStatCard icon={Clapperboard} label="المشاهد المُسندة" value={stats.assignedScenes} sub={`/ ${stats.totalScenes}`} color="indigo" />
              <SafeStatCard icon={Timer} label="المدة الكلية" value={stats.totalDuration} sub="دقيقة" color="amber" />
              <SafeStatCard icon={BarChart3} label="متوسط مشاهد/حلقة" value={stats.avgScenesPerEpisode} color="violet" />
              <SafeStatCard icon={Clock} label="متوسط مدة/حلقة" value={stats.avgDurationPerEpisode} sub="د" color="rose" />
              <SafeStatCard icon={CheckCircle2} label="نسبة الإنجاز" value={`${stats.completionRate}%`} color="emerald" />
            </div>

            {/* Analytics Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in slide-in-from-bottom-6 duration-700">
              
              {/* Scenes Distribution Chart */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                  <BarChart3 size={16} className="text-primary" />
                  <span className="font-black text-foreground text-xs uppercase tracking-widest">توزيع المشاهد على الحلقات</span>
                </div>
                <div className="space-y-3">
                  {stats.perEpisode?.map((ep: any) => (
                    <div key={ep.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-muted-foreground w-14 text-right shrink-0 truncate">
                        ح{ep.episode_number}
                      </span>
                      <div className="flex-1 h-6 bg-secondary/50 rounded-lg overflow-hidden relative">
                        <div 
                          className={`h-full ${STATUS_MAP[ep.status]?.barColor || 'bg-primary'} rounded-lg transition-all duration-1000 ease-out flex items-center justify-end px-2`}
                          style={{ width: `${Math.max((ep.scene_count / maxScenesInEpisode) * 100, 4)}%` }}
                        >
                          {ep.scene_count > 0 && (
                            <span className="text-[9px] font-black text-white drop-shadow-sm">{ep.scene_count}</span>
                          )}
                        </div>
                        {ep.scene_count === 0 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground/50">فارغة</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground w-14 shrink-0">
                        {ep.total_duration > 0 ? `${ep.total_duration}د` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details Panel */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
                {/* Status Breakdown */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                    <Layers size={16} className="text-primary" />
                    <span className="font-black text-foreground text-xs uppercase tracking-widest">حالة الحلقات</span>
                  </div>
                  <div className="flex gap-3">
                    {Object.entries(STATUS_MAP).map(([key, info]) => {
                      const count = stats.statusBreakdown?.find((s: any) => s.status === key)?.count || 0;
                      return (
                        <div key={key} className={`flex-1 rounded-xl border ${info.color} p-3 text-center transition-all`}>
                          <div className="text-xl font-black tabular-nums">{count}</div>
                          <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5">{info.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Unassigned Scenes Warning */}
                {stats.unassignedScenes > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle size={18} className="text-amber-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {stats.unassignedScenes} مشهد غير مُسند لأي حلقة
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        افتح كل مشهد واختر الحلقة من تبويب "الإعدادات"
                      </div>
                    </div>
                  </div>
                )}

                {/* Per-Episode Details Table */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                    <TrendingUp size={16} className="text-primary" />
                    <span className="font-black text-foreground text-xs uppercase tracking-widest">تفصيل كل حلقة</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/50 text-muted-foreground">
                          <th className="py-2 px-3 text-right font-black text-[10px] uppercase">الحلقة</th>
                          <th className="py-2 px-3 text-center font-black text-[10px] uppercase">المشاهد</th>
                          <th className="py-2 px-3 text-center font-black text-[10px] uppercase">الحوارات</th>
                          <th className="py-2 px-3 text-center font-black text-[10px] uppercase">الشخصيات</th>
                          <th className="py-2 px-3 text-center font-black text-[10px] uppercase">المدة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.perEpisode?.map((ep: any, i: number) => (
                          <tr key={ep.id} className={`border-t border-border/50 ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'} hover:bg-primary/5 transition-colors`}>
                            <td className="py-2 px-3 font-bold text-foreground">
                              ح{ep.episode_number} {ep.title ? `— ${ep.title}` : ''}
                            </td>
                            <td className="py-2 px-3 text-center tabular-nums font-bold">{ep.scene_count}</td>
                            <td className="py-2 px-3 text-center tabular-nums">
                              <span className="inline-flex items-center gap-1">
                                <MessageSquare size={10} className="text-muted-foreground" />
                                {ep.dialogue_count}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center tabular-nums">
                              <span className="inline-flex items-center gap-1">
                                <Users size={10} className="text-muted-foreground" />
                                {ep.unique_characters}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center tabular-nums font-medium">
                              {ep.total_duration > 0 ? `${ep.total_duration}د` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* Episode Cards */}
        {/* ═══════════════════════════════════════════ */}
        {episodes.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black tracking-tight text-foreground">إدارة الحلقات</h2>
            <div className="h-[2px] flex-1 mx-4 bg-gradient-to-l from-border to-transparent" />
          </div>
        )}

        {episodes.length === 0 ? (
          <div className="text-center py-24 bg-card border border-border rounded-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <Tv size={36} />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">لا توجد حلقات بعد</h2>
            <p className="text-muted-foreground mb-6">ابدأ بإضافة حلقتك الأولى</p>
            <button 
              onClick={handleCreateEpisode}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
            >
              <Plus size={16} className="inline ml-2" />
              أنشئ حلقة جديدة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((ep) => {
              const isEditing = editingId === ep.id;
              const statusInfo = STATUS_MAP[ep.status] || STATUS_MAP.DRAFT;
              const StatusIcon = statusInfo.icon;
              const epStats = stats?.perEpisode?.find((p: any) => p.id === ep.id);

              if (isEditing) {
                return (
                  <div key={ep.id} className="bg-card border border-primary/30 rounded-xl p-6 shadow-md animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-indigo-400 text-white text-xl font-bold flex items-center justify-center shadow-md shrink-0">
                        {ep.episode_number}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-2 bg-background border border-input rounded-xl text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="عنوان الحلقة (اختياري)"
                          autoFocus
                        />
                      </div>
                    </div>

                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
                      placeholder="وصف أو ملخص الحلقة..."
                      rows={3}
                    />

                    <div className="flex items-center justify-between">
                      <select
                        value={editForm.status}
                        onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-1.5 bg-background border border-input rounded-xl text-xs font-bold focus:outline-none"
                      >
                        <option value="DRAFT">مسودة</option>
                        <option value="IN_PROGRESS">قيد العمل</option>
                        <option value="COMPLETED">مكتمل</option>
                      </select>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(ep)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
                        >
                          <Save size={14} />
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted transition-all"
                        >
                          <X size={14} />
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={ep.id} 
                  className="group bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/40 transition-all relative overflow-hidden"
                >
                  <div className="flex items-start gap-5">
                    {/* Episode Number */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <span className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-indigo-400 text-white text-xl font-bold shadow-md">
                        {ep.episode_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${statusInfo.color} flex items-center gap-1`}>
                        <StatusIcon size={10} />
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-foreground text-lg truncate leading-none">
                            حلقة {ep.episode_number}{ep.title ? ` — ${ep.title}` : ''}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={() => navigate(`/scenarios?scenario=${activeScenarioId}&episode=${ep.id}`)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="عرض مشاهد هذه الحلقة"
                          >
                            <Clapperboard size={18} />
                          </button>
                          <button
                            onClick={() => setExportEpisode(ep)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                            title="تصدير هذه الحلقة PDF"
                          >
                            <FileOutput size={18} />
                          </button>
                          <button
                            onClick={() => startEditing(ep)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="تعديل"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(ep)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <p className={`text-sm leading-relaxed ${ep.description ? 'text-muted-foreground' : 'text-muted-foreground/30 italic'}`}>
                        {ep.description || 'لا يوجد وصف لهذه الحلقة بعد...'}
                      </p>

                      {/* Mini Stats Row */}
                      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground/70 font-medium">
                        <div className="flex items-center gap-1">
                          <Clapperboard size={12} />
                          <span>{(ep as any).scene_count || 0} مشهد</span>
                        </div>
                        {epStats && epStats.dialogue_count > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            <span>{epStats.dialogue_count} حوار</span>
                          </div>
                        )}
                        {epStats && epStats.unique_characters > 0 && (
                          <div className="flex items-center gap-1">
                            <Users size={12} />
                            <span>{epStats.unique_characters} شخصية</span>
                          </div>
                        )}
                        {epStats && epStats.total_duration > 0 && (
                          <div className="flex items-center gap-1">
                            <Timer size={12} />
                            <span>{epStats.total_duration} دقيقة</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>منذ {formatDate(ep.created_at, 'd MMMM yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Episode Export Wizard */}
      <SafeExportWizardModal 
        isOpen={!!exportEpisode}
        scenario={activeScenario}
        exportLevel="EPISODE"
        targetEntity={exportEpisode}
        isExporting={isExporting}
        onClose={() => !isExporting && setExportEpisode(null)}
        onConfirm={async (options: any) => {
          if (!exportEpisode || !activeScenarioId) return;
          try {
            setIsExporting(true);
            showToast(`جاري تصدير الحلقة ${exportEpisode.episode_number}...`, 'info');
            await exportProjectMutation.mutateAsync({
              scenarioId: activeScenarioId,
              strategy: new PDFExportStrategy({
                ...options,
                exportType: 'SINGLE_PDF',
                filterEpisodeId: exportEpisode.id,
              })
            });
            showToast('تم تصدير الحلقة بنجاح', 'success');
            setExportEpisode(null);
          } catch (err) {
            console.error(err);
            showToast('فشل تصدير الحلقة', 'error');
          } finally {
            setIsExporting(false);
          }
        }}
      />

      <ConfirmModal 
        isOpen={!!episodeToDelete}
        title="حذف الحلقة"
        message={`هل أنت متأكد من حذف الحلقة ${episodeToDelete?.episode_number}${episodeToDelete?.title ? ` (${episodeToDelete.title})` : ''}؟ سيتم فصل مشاهدها فقط ولن تُحذف نهائياً.`}
        confirmText="تأكيد حذف الحلقة"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteEpisodeMutation.isPending}
        onClose={() => setEpisodeToDelete(null)}
        onConfirm={handleConfirmDeleteEpisode}
      />
    </div>
  )
}
