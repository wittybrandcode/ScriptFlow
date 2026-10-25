import React, { useState, useEffect } from 'react';
import {
  Film, Trash2, FileText, FileJson,
  AlertTriangle, CheckCircle, Clapperboard, Edit3, Archive,
  Shield, Database, type LucideIcon
} from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useScenariosQuery, useDeleteScenarioMutation } from '../hooks/queries/useScenarios';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { PDFExportStrategy, JSONExportStrategy } from '../services/exportStrategies';
import { formatDate } from '../utils/dateUtils';
import ConfirmModal from '../components/common/ConfirmModal';
import type { IScenario } from '@scriptflow/core';

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  DRAFT: { label: 'مسودة', icon: Edit3, color: 'text-zinc-400 bg-zinc-500/15 border-zinc-500/30' },
  IN_PRODUCTION: { label: 'قيد الإنتاج', icon: Clapperboard, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  COMPLETED: { label: 'مكتمل', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  ARCHIVED: { label: 'مؤرشف', icon: Archive, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' }
};

interface BackupRecord {
  name: string;
  createdAt: string | number | Date;
  sizeMB: number | string;
}

// ═══════════════════════════════════════════════════
// Tab: إدارة السيناريوهات
// ═══════════════════════════════════════════════════
function ScenariosTab() {
  const { data: scenarios = [] } = useScenariosQuery();
  const deleteMutation = useDeleteScenarioMutation();
  const { toasts, showToast, dismissToast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<IScenario | null>(null);
  const [confirmText, setConfirmText] = useState('');

  async function handleDelete(scenario: IScenario) {
    try {
      await deleteMutation.mutateAsync(scenario.id);
      showToast('تم نقل السيناريو إلى سلة المحذوفات', 'info');
      setDeleteConfirm(null);
      setConfirmText('');
    } catch {
      showToast('فشل حذف السيناريو', 'error');
    }
  }

  const exportProjectMutation = useExportProjectMutation();

  async function handleExportPDF(scenario: IScenario) {
    try {
      showToast('جاري تحضير ملف PDF...', 'info');
      await exportProjectMutation.mutateAsync({ 
        scenarioId: scenario.id, 
        strategy: new PDFExportStrategy() 
      });
      showToast('تم تصدير PDF بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل تصدير PDF', 'error');
    }
  }

  async function handleExportJSON(scenario: IScenario) {
    try {
      showToast('جاري تحضير ملف JSON...', 'info');
      await exportProjectMutation.mutateAsync({ 
        scenarioId: scenario.id, 
        strategy: new JSONExportStrategy() 
      });
      showToast('تم تصدير ملف JSON بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل تصدير JSON', 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* قائمة السيناريوهات */}
      {scenarios.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <Film size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium text-sm">لا توجد سيناريوهات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario: IScenario) => {
            const StatusIcon = (scenario.status && STATUS_MAP[scenario.status]?.icon) || Edit3;
            const isDeleting = deleteConfirm?.id === scenario.id;

            return (
              <div key={scenario.id} className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-4 p-5">
                  {/* Poster thumbnail */}
                  <div className="w-14 h-20 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border shadow-sm">
                    {scenario.cover_image ? (
                      <img src={scenario.cover_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={18} className="text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-foreground text-base truncate">{scenario.title}</h3>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${scenario.status ? STATUS_MAP[scenario.status]?.color || '' : ''}`}>
                        <StatusIcon size={10} />
                        {scenario.status ? STATUS_MAP[scenario.status]?.label : 'مسودة'}
                      </div>
                    </div>
                    {scenario.description && (
                      <p className="text-xs text-muted-foreground truncate leading-relaxed">{scenario.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground/60">
                      {scenario.genre && <span>{scenario.genre}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleExportPDF(scenario)}
                      className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"
                      title="تصدير PDF"
                    >
                      <FileText size={15} />
                    </button>
                    <button
                      onClick={() => handleExportJSON(scenario)}
                      className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"
                      title="تصدير JSON"
                    >
                      <FileJson size={15} />
                    </button>
                    <div className="w-[1px] h-5 bg-border mx-1" />
                    <button
                      onClick={() => { setDeleteConfirm(scenario); setConfirmText(''); }}
                      className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                      title="حذف السيناريو"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Delete confirmation panel */}
                {isDeleting && (
                  <div className="border-t border-red-500/20 bg-red-500/5 p-5 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle size={20} className="text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-red-400 text-sm mb-1">تأكيد حذف السيناريو</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          سيتم نقل السيناريو <strong className="text-foreground">"{scenario.title}"</strong> إلى سلة المحذوفات.
                          للتأكيد، اكتب اسم السيناريو بالضبط في الحقل أدناه.
                        </p>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={e => setConfirmText(e.target.value)}
                          placeholder={scenario.title}
                          className="w-full px-4 py-2.5 bg-background border border-red-500/30 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 mb-3 font-medium"
                          dir="auto"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(scenario)}
                            disabled={confirmText !== scenario.title}
                            className="px-5 py-2 rounded-xl bg-red-500 text-white text-xs font-black hover:bg-red-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-red-500"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(null); setConfirmText(''); }}
                            className="px-5 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-bold hover:bg-secondary transition-all"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Tab: النسخ الاحتياطي والأمان
// ═══════════════════════════════════════════════════
function BackupTab() {
  const { toasts, showToast, dismissToast } = useToast();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [isDeletingBackup, setIsDeletingBackup] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    setLoading(true);
    try {
      const { backupService } = await import('../services/BackupService');
      const list = await backupService.getBackups();
      setBackups(list as BackupRecord[]);
    } catch (err) {
      console.error(err);
      showToast('فشل في تحميل قائمة النسخ الاحتياطية', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBackup() {
    setCreating(true);
    try {
      const { backupService } = await import('../services/BackupService');
      const result = await backupService.createBackup('manual');
      showToast(`تم إنشاء نسخة احتياطية بنجاح (${result.filename})`, 'success');
      loadBackups();
    } catch (err) {
      console.error(err);
      showToast('فشل إنشاء النسخة الاحتياطية', 'error');
    } finally {
      setCreating(false);
    }
  }

  function handleDeleteBackup(filename: string) {
    setBackupToDelete(filename);
  }

  async function confirmDeleteBackup() {
    if (!backupToDelete) return;
    setIsDeletingBackup(true);
    try {
      const { backupService } = await import('../services/BackupService');
      await backupService.deleteBackup(backupToDelete);
      showToast('تم حذف النسخة الاحتياطية بنجاح', 'info');
      setBackupToDelete(null);
      loadBackups();
    } catch (err) {
      console.error(err);
      showToast('فشل حذف النسخة الاحتياطية', 'error');
    } finally {
      setIsDeletingBackup(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-foreground text-lg mb-1 flex items-center gap-2">
              <Database className="text-primary" size={20} />
              حماية البيانات (Local-First)
            </h3>
            <p className="text-sm text-muted-foreground">
              جميع نصوصك وبياناتك محفوظة محلياً بالكامل ولا تُرسل لأي خادم. يضمن نظام النسخ الاحتياطي التلقائي واليدوي حماية عملك من التلف.
            </p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {creating ? (
              <span className="animate-pulse">جاري النسخ...</span>
            ) : (
              <>
                <Shield size={18} />
                أخذ نسخة احتياطية الآن
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-muted-foreground mb-4 uppercase tracking-wider px-1">النسخ الاحتياطية المتوفرة</h4>
          
          {loading ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <span className="text-muted-foreground text-sm animate-pulse">جاري تحميل القائمة...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <Database size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">لا توجد أي نسخ احتياطية حتى الآن.</p>
            </div>
          ) : (
            backups.map((bkp, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                    <Archive size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-foreground text-sm" dir="ltr">{bkp.name}</h5>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(bkp.createdAt, 'd MMMM yyyy, HH:mm')}</span>
                      <span>•</span>
                      <span className="font-mono">{bkp.sizeMB} MB</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => showToast('سيتم تفعيل ميزة الاستعادة قريباً', 'info')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-secondary text-foreground hover:bg-primary hover:text-white transition-colors border border-border"
                  >
                    استعادة
                  </button>
                  <button 
                    onClick={() => handleDeleteBackup(bkp.name)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!backupToDelete}
        onClose={() => !isDeletingBackup && setBackupToDelete(null)}
        onConfirm={confirmDeleteBackup}
        title="حذف النسخة الاحتياطية"
        message={
          <span>
            هل أنت متأكد من حذف النسخة الاحتياطية <strong className="text-foreground font-mono" dir="ltr">{backupToDelete}</strong>؟ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
          </span>
        }
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={isDeletingBackup}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// الصفحة الرئيسية للإعدادات
// ═══════════════════════════════════════════════════
interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  component: React.ComponentType;
}

const TABS: TabConfig[] = [
  { id: 'scenarios', label: 'إدارة السيناريوهات', icon: Film, component: ScenariosTab },
  { id: 'backups', label: 'البيانات والأمان', icon: Shield, component: BackupTab },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('scenarios');
  const { setTopBarConfig } = useUIStore();

  useEffect(() => {
    setTopBarConfig({
      pageName: 'الإعدادات',
      actions: [],
      rightActions: []
    });
  }, [setTopBarConfig]);

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || ScenariosTab;

  return (
    <div className="animate-in fade-in duration-300 pb-8">
      <main className="w-full px-6 py-6">
        <div className="flex gap-8">

          {/* Sidebar Tabs */}
          <div className="w-56 shrink-0">
            <div className="sticky top-6 space-y-1">
              <h2 className="text-xs font-black text-muted-foreground/50 uppercase tracking-widest mb-4 px-3">الإعدادات</h2>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-foreground">
                {TABS.find(t => t.id === activeTab)?.label}
              </h1>
            </div>
            <ActiveComponent />
          </div>
        </div>
      </main>
    </div>
  );
}
