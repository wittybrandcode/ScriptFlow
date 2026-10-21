import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Film, Plus, Clapperboard, Users,
  TrendingUp, FileDown, FileUp
} from 'lucide-react'
import { PDFExportStrategy, JSONExportStrategy, ScriptFlowPackageStrategy } from '../services/exportStrategies';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import { useUIStore } from '../store/useUIStore';
import { useScenariosQuery, useGlobalStatsQuery, useCreateScenarioMutation, useUpdateScenarioMutation, useDeleteScenarioMutation } from '../hooks/queries';
import { saveMediaFile } from '../services/mediaStorage';
import type { IScenario } from '@scriptflow/core';

import ScenarioCard from '../components/dashboard/ScenarioCard'
import ExportWizardModal from '../components/export/ExportWizardModal';
import ConflictResolutionModal from '../components/dashboard/ConflictResolutionModal';
import ConfirmModal from '../components/common/ConfirmModal';

const SafeScenarioCard = ScenarioCard as React.ComponentType<any>;
const SafeExportWizardModal = ExportWizardModal as React.ComponentType<any>;
const SafeConflictResolutionModal = ConflictResolutionModal as React.ComponentType<any>;

interface ActionCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  statLine: string;
  onClick?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon: Icon, title, statLine, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl text-center hover:bg-primary transition-all duration-400 overflow-hidden font-sans w-full"
  >
    <div className="flex flex-col items-center gap-3">
      <Icon size={32} className="text-foreground group-hover:text-white transition-colors duration-400" />
      <h3 className="font-black text-lg text-foreground group-hover:text-white transition-colors duration-400 tracking-tight">{title}</h3>
    </div>
    
    <p className="text-[11px] font-bold text-muted-foreground mt-3 group-hover:text-white/70 transition-colors duration-400 uppercase tracking-wider">
      {statLine}
    </p>
  </button>
);

interface EditingItemState {
  type: 'scenario';
  id: string;
  title: string;
  description: string;
  isNew?: boolean;
}

interface ConflictDataState {
  type: string;
  existing: any;
  json: any;
  fileType: 'JSON' | 'PACKAGE';
}

export default function Dashboard() {
  const setTopBarConfig = useUIStore(s => s.setTopBarConfig);
  const clearSidebarContext = useUIStore(s => s.clearSidebarContext);
  const clearActiveScenario = useUIStore(s => s.clearActiveScenario);
  const setActiveScenarioId = useUIStore(s => s.setActiveScenarioId);
  
  const { data: rawScenarios = [], isLoading: isLoadingScenarios } = useScenariosQuery();
  const scenarios = (rawScenarios as IScenario[]) || [];
  const { data: stats } = useGlobalStatsQuery();
  const createScenarioMutation = useCreateScenarioMutation();
  const updateScenarioMutation = useUpdateScenarioMutation();
  const deleteScenarioMutation = useDeleteScenarioMutation();

  // Clear context exactly once on mount
  useEffect(() => {
    clearActiveScenario();
    clearSidebarContext();
  }, [clearActiveScenario, clearSidebarContext]);

  useEffect(() => {
    // إعداد الشريط العلوي بالإحصائيات والأزرار
    setTopBarConfig({ 
      pageName: 'الرئيسية',
      actions: [
        { id: 'stat-projects', label: `${scenarios.length} مشروع`, icon: Film, variant: 'ghost' },
        { id: 'stat-scenes', label: `${stats?.scenes || 0} مشهد`, icon: Clapperboard, variant: 'ghost' },
        { id: 'stat-chars', label: `${stats?.characters || 0} شخصية`, icon: Users, variant: 'ghost' }
      ],
      rightActions: [
        { 
          id: 'import-json', 
          title: 'استيراد JSON', 
          icon: FileUp, 
          variant: 'outline', 
          onClick: () => document.getElementById('hidden-import-json')?.click() 
        },
        { 
          id: 'import-zip', 
          title: 'استيراد حزمة ZIP', 
          icon: FileUp, 
          variant: 'outline', 
          onClick: () => document.getElementById('hidden-import-zip')?.click() 
        },
        { 
          id: 'new-project', 
          title: 'إنشاء مشروع جديد', 
          icon: Plus, 
          variant: 'primary', 
          onClick: () => document.getElementById('hidden-create-scenario')?.click() 
        }
      ]
    });
  }, [scenarios.length, stats?.scenes, stats?.characters, setTopBarConfig]);

  const [editingItem, setEditingItem] = useState<EditingItemState | null>(null)
  const [conflictData, setConflictData] = useState<ConflictDataState | null>(null)
  const [exportWizardScenario, setExportWizardScenario] = useState<IScenario | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<IScenario | null>(null);
  const navigate = useNavigate()
  const { toasts, showToast, dismissToast } = useToast()
  
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef<boolean>(false)
  const startX = useRef<number>(0)
  const scrollLeft = useRef<number>(0)

  // Native wheel event listener and drag to scroll to support preventDefault and ultra-smooth UX
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0 && e.deltaY === 0) return;
      e.preventDefault();
      // Use smooth scrolling native API if it's a big jump (mouse wheel), otherwise immediate for trackpad
      if (Math.abs(e.deltaY) > 50) {
        el.scrollBy({ left: e.deltaY * 2, behavior: 'smooth' });
      } else {
        el.scrollLeft += e.deltaY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      el.classList.add('cursor-grabbing');
      startX.current = e.pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      el.classList.remove('cursor-grabbing');
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      el.classList.remove('cursor-grabbing');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX.current) * 2; // Scroll-fast
      el.scrollLeft = scrollLeft.current - walk;
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mousemove', handleMouseMove);

    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mousemove', handleMouseMove);
    };
  }, [scenarios, editingItem]);

  function openNewScenarioForm() {
    setEditingItem({ type: 'scenario', id: '__new__', title: '', description: '', isNew: true })
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  async function updateScenario(
    id: string, 
    title?: string, 
    description?: string, 
    cover_image?: string, 
    status?: any, 
    genre?: string, 
    notes?: string, 
    cover_video?: string
  ) {
    try {
      let finalCoverImage = cover_image;
      let finalCoverVideo = cover_video;

      if (id === '__new__') {
        const result = await createScenarioMutation.mutateAsync(title || 'سيناريو جديد');
        const targetId = result.id;

        if (cover_image && (cover_image.startsWith('project-media://temp/') || cover_image.startsWith('data:'))) {
          const ext = cover_image.includes('.') ? cover_image.split('.').pop() : 'png';
          finalCoverImage = await saveMediaFile(targetId, `cover_${Date.now()}.${ext}`, cover_image);
        }
        if (cover_video && (cover_video.startsWith('project-media://temp/') || cover_video.startsWith('data:'))) {
          const ext = cover_video.includes('.') ? cover_video.split('.').pop() : 'mp4';
          finalCoverVideo = await saveMediaFile(targetId, `video_${Date.now()}.${ext}`, cover_video);
        }

        if (description || finalCoverImage || status || genre || notes || finalCoverVideo) {
          await updateScenarioMutation.mutateAsync({ 
            id: targetId, 
            data: { title, description, cover_image: finalCoverImage, cover_video: finalCoverVideo, status, genre, notes } 
          });
        }
      } else {
        if (cover_image && cover_image.startsWith('data:')) {
          finalCoverImage = await saveMediaFile(id, `cover_${Date.now()}.png`, cover_image);
        }
        if (cover_video && cover_video.startsWith('data:')) {
          finalCoverVideo = await saveMediaFile(id, `video_${Date.now()}.mp4`, cover_video);
        }
        await updateScenarioMutation.mutateAsync({ 
          id, 
          data: { title, description, cover_image: finalCoverImage, cover_video: finalCoverVideo, status, genre, notes } 
        });
      }
      setEditingItem(null)
      showToast('تم حفظ التعديلات', 'success')
    } catch (err) { 
      showToast('فشل حفظ التعديلات', 'error')
    }
  }

  function handleDeleteScenarioClick(scenario: IScenario) {
    setScenarioToDelete(scenario)
  }

  async function handleConfirmDeleteScenario() {
    if (!scenarioToDelete) return
    try {
      await deleteScenarioMutation.mutateAsync(scenarioToDelete.id);
      showToast('تم حذف السيناريو بنجاح', 'info')
      setScenarioToDelete(null)
    } catch (err) {
      showToast('فشل حذف السيناريو', 'error')
    }
  }

  const exportProjectMutation = useExportProjectMutation() as any;

  function handleQuickExport(scenario: IScenario) {
    setExportWizardScenario(scenario);
  }

  async function executeProjectExport(options: any) {
    if (!exportWizardScenario) return;
    try {
      setIsExporting(true);
      showToast('جاري تحضير المحرك للتصدير...', 'info');
      await exportProjectMutation.mutateAsync({ 
        scenarioId: exportWizardScenario.id, 
        strategy: new PDFExportStrategy(options)
      });
      showToast('تمت عملية التصدير بنجاح', 'success');
      setExportWizardScenario(null);
    } catch (err) {
      console.error(err);
      showToast('فشل تصدير المشروع', 'error');
    } finally {
      setIsExporting(false);
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

  async function handleExportPackage(scenario: IScenario) {
    try {
      showToast('جاري حزم المشروع...', 'info');
      await exportProjectMutation.mutateAsync({ 
        scenarioId: scenario.id, 
        strategy: new ScriptFlowPackageStrategy() 
      });
      showToast('تم حزم المشروع بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('فشل حزم المشروع', 'error');
    }
  }

  async function handleImportScenario(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        const { ImportProject } = await import('@scriptflow/application')
        const importOperation = new ImportProject()
        
        const conflict = await importOperation.checkConflict(json)
        if (conflict) {
          setConflictData({
            type: conflict.type,
            existing: conflict.existing,
            json,
            fileType: 'JSON'
          })
          return
        }

        showToast('جاري استيراد السيناريو...', 'info')
        const { processAndSaveMedia } = await import('../services/mediaStorage')
        const result = await importOperation.execute(json, { 
          mode: 'COPY',
          mediaProcessor: { process: processAndSaveMedia }
        })
        if (!result.success) throw new Error(result.error)
        
        showToast('تم استيراد السيناريو بنجاح', 'success')
        const { queryClient } = await import('../lib/queryClient');
        queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      } catch (err) {
        console.error('Import error:', err)
        showToast('ملف غير صالح أو فشل الاستيراد', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset
  }

  async function handleImportPackage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    showToast('جاري قراءة الحزمة...', 'info')
    try {
      const { packageService } = await import('../services/api/packageService')
      const { ImportProject } = await import('@scriptflow/application')
      const importOperation = new ImportProject()
      
      const json = await packageService.parsePackage(file)
      const conflict = await importOperation.checkConflict(json)
      
      if (conflict) {
        setConflictData({
          type: conflict.type,
          existing: conflict.existing,
          json,
          fileType: 'PACKAGE'
        })
        return
      }

      showToast('جاري استيراد الحزمة...', 'info')
      const { processAndSaveMedia } = await import('../services/mediaStorage')
      const result = await importOperation.execute(json, { 
        mode: 'COPY',
        mediaProcessor: { process: processAndSaveMedia }
      })
      if (!result.success) throw new Error(result.error)
      
      showToast('تم استيراد الحزمة بنجاح', 'success')
      const { queryClient } = await import('../lib/queryClient');
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    } catch (err: any) {
      console.error('Import error:', err)
      showToast(err?.message || 'فشل استيراد الحزمة', 'error')
    }
    e.target.value = '' // Reset
  }

  async function resolveConflict(mode: 'COPY' | 'OVERWRITE' | 'MERGE') {
    if (!conflictData) return

    const { json, existing, fileType } = conflictData
    setConflictData(null) // Close modal immediately

    showToast(fileType === 'PACKAGE' ? 'جاري معالجة الحزمة...' : 'جاري معالجة السيناريو...', 'info')
    try {
      const { ImportProject } = await import('@scriptflow/application')
      const { processAndSaveMedia } = await import('../services/mediaStorage')
      const importOperation = new ImportProject()

      const result = await importOperation.execute(json, {
        mode,
        conflictScenarioId: existing.id,
        mediaProcessor: { process: processAndSaveMedia }
      })
      if (!result.success) throw new Error(result.error)

      showToast(
        mode === 'OVERWRITE' 
          ? 'تم استبدال المشروع بنجاح' 
          : mode === 'MERGE' 
            ? 'تم دمج المشروع بنجاح' 
            : 'تم استيراد المشروع كنسخة جديدة', 
        'success'
      )
      const { queryClient } = await import('../lib/queryClient');
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    } catch (err) {
      console.error('Conflict resolution error:', err)
      showToast('فشل إكمال عملية حل التعارض', 'error')
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      <main className="w-full h-[calc(100vh-64px)] p-6 md:p-8 flex flex-col gap-8">
        
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col min-h-0 relative">
          
          {isLoadingScenarios ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-50 rounded-3xl border border-black/5">
              <div className="w-10 h-10 border-[3px] border-black/10 border-t-black rounded-full animate-spin shadow-sm" />
            </div>
          ) : null}

          {scenarios.length === 0 && !editingItem?.isNew && !isLoadingScenarios ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-16 bg-card/30 border border-dashed border-border rounded-2xl px-12">
                <Clapperboard size={48} className="mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground font-bold text-sm mb-3">لم تبدأ أي قصة بعد.</p>
                <button onClick={openNewScenarioForm} className="text-primary font-bold text-sm hover:underline">أنشئ سيناريو الآن</button>
              </div>
            </div>
          ) : (
            <>
              {/* Horizontal Netflix Row */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 flex flex-row overflow-x-auto overflow-y-hidden gap-6 sm:gap-8 pb-4 scrollbar-thin scrollbar-thumb-primary/30 hover:scrollbar-thumb-primary/60 scrollbar-track-transparent items-center cursor-grab select-none scroll-smooth"
              >
                {/* Virtual new scenario form card */}
                {editingItem?.isNew && (
                  <SafeScenarioCard
                    key="__new__"
                    scenario={{ id: '__new__', title: '', description: '', status: 'DRAFT', genre: '', notes: '', cover_image: '', cover_video: '' }}
                    editing={true}
                    onEdit={() => {}}
                    onCancel={handleCancelEdit}
                    onSave={(title: string, desc: string, cover_image: string, status: any, genre: string, notes: string, cover_video: string) => updateScenario('__new__', title, desc, cover_image, status, genre, notes, cover_video)}
                    onDelete={() => setEditingItem(null)}
                    onOpen={() => {}}
                  />
                )}
                {scenarios.map(scenario => (
                  <SafeScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    editing={editingItem?.type === 'scenario' && editingItem?.id === scenario.id}
                    onEdit={() => setEditingItem({ type: 'scenario', id: scenario.id, title: scenario.title, description: scenario.description || '' })}
                    onCancel={handleCancelEdit}
                    onSave={(title: string, desc: string, cover_image: string, status: any, genre: string, notes: string, cover_video: string) => updateScenario(scenario.id, title, desc, cover_image, status, genre, notes, cover_video)}
                    onDelete={() => handleDeleteScenarioClick(scenario)}
                    onOpen={() => {
                      setActiveScenarioId(scenario.id);
                      navigate('/insights');
                    }}
                    onExport={() => handleQuickExport(scenario)}
                    onExportJSON={() => handleExportJSON(scenario)}
                    onExportPackage={() => handleExportPackage(scenario)}
                  />
                ))}
              </div>

              {/* Bottom Dashboard Widgets (ActionCards matching Insights) */}
              <div className="shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ActionCard 
                    icon={TrendingUp}
                    title={scenarios.length.toString()}
                    statLine="إجمالي المشاريع"
                  />
                  <ActionCard 
                    icon={Clapperboard}
                    title={(stats?.scenes || 0).toString()}
                    statLine="مشهد مسجل"
                  />
                  <ActionCard 
                    icon={Plus}
                    title="مشروع جديد"
                    statLine="إنشاء سيناريو"
                    onClick={openNewScenarioForm}
                  />
                  <ActionCard 
                    icon={FileDown}
                    title="استيراد حزمة SFLOW"
                    statLine="الملف الاحترافي (.sflow)"
                    onClick={() => document.getElementById('hidden-import-zip')?.click()}
                  />
                </div>
              </div>
            </>
          )}
        </div>


        {/* Hidden inputs and buttons for TopBar triggers */}
        <input id="hidden-import-json" type="file" accept=".json" onChange={handleImportScenario} className="hidden" />
        <input id="hidden-import-zip" type="file" accept=".zip,.sflow" onChange={handleImportPackage} className="hidden" />
        <button id="hidden-create-scenario" onClick={openNewScenarioForm} className="hidden" />

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        <SafeExportWizardModal 
          isOpen={!!exportWizardScenario} 
          scenario={exportWizardScenario}
          exportLevel="PROJECT"
          isExporting={isExporting}
          onClose={() => !isExporting && setExportWizardScenario(null)}
          onConfirm={executeProjectExport}
        />

        <SafeConflictResolutionModal
          conflictData={conflictData}
          onResolve={resolveConflict}
          onCancel={() => setConflictData(null)}
        />

        <ConfirmModal 
          isOpen={!!scenarioToDelete}
          title="حذف السيناريو"
          message={`هل أنت متأكد من رغبتك في حذف السيناريو "${scenarioToDelete?.title || 'سيناريو بدون عنوان'}" نهائياً؟ سيتم حذف جميع المشاهد والبيانات المرتبطة به.`}
          confirmText="تأكيد الحذف النهائي"
          cancelText="إلغاء"
          variant="danger"
          isLoading={deleteScenarioMutation.isPending}
          onClose={() => setScenarioToDelete(null)}
          onConfirm={handleConfirmDeleteScenario}
        />
      </main>
    </div>
  );
}
