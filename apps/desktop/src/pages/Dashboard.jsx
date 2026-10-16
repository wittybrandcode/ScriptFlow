import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Film, Plus, Trash2, Edit3, Users, Clapperboard,
  X, Save, LayoutDashboard, Palette, MessageSquare, TrendingUp, Clock, FileUp, FileDown, FileText
} from 'lucide-react'
import { PDFExportStrategy, JSONExportStrategy, ScriptFlowPackageStrategy } from '../services/exportStrategies';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import CharacterModal from '../components/CharacterModal'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import { useUIStore } from '../store/useUIStore';
import { useScenariosQuery, useGlobalStatsQuery, useCreateScenarioMutation, useUpdateScenarioMutation, useDeleteScenarioMutation } from '../hooks/queries';


import StatCard from '../components/dashboard/StatCard'
import ScenarioCard from '../components/dashboard/ScenarioCard'
import CharacterCard from '../components/dashboard/CharacterCard'
import ExportWizardModal from '../components/export/ExportWizardModal';
import ConflictResolutionModal from '../components/dashboard/ConflictResolutionModal';

const ActionCard = ({ icon: Icon, title, statLine, onClick }) => (
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

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'scenarios'
  
  const { setTopBarConfig, clearSidebarContext, clearActiveScenario, setActiveScenarioId } = useUIStore();
  
  const { data: scenarios = [], isLoading: isLoadingScenarios } = useScenariosQuery();
  const { data: stats } = useGlobalStatsQuery();
  const createScenarioMutation = useCreateScenarioMutation();
  const updateScenarioMutation = useUpdateScenarioMutation();
  const deleteScenarioMutation = useDeleteScenarioMutation();

  // Clear context exactly once on mount
  useEffect(() => {
    clearActiveScenario();
    clearSidebarContext();
  }, []);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarios.length, stats]);

  const [editingItem, setEditingItem] = useState(null)
  const [showCharModal, setShowCharModal] = useState(false)
  const [conflictData, setConflictData] = useState(null)
  const [exportWizardScenario, setExportWizardScenario] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate()
  const { toasts, showToast, dismissToast } = useToast()
  
  const scrollContainerRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  // Native wheel event listener and drag to scroll to support preventDefault and ultra-smooth UX
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleNativeWheel = (e) => {
      if (e.deltaX !== 0 && e.deltaY === 0) return;
      e.preventDefault();
      // Use smooth scrolling native API if it's a big jump (mouse wheel), otherwise immediate for trackpad
      if (Math.abs(e.deltaY) > 50) {
        el.scrollBy({ left: e.deltaY * 2, behavior: 'smooth' });
      } else {
        el.scrollLeft += e.deltaY;
      }
    };

    const handleMouseDown = (e) => {
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

    const handleMouseMove = (e) => {
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

  function setTab(newTab) {
     setSearchParams({ tab: newTab })
  }

  function openNewScenarioForm() {
    setEditingItem({ type: 'scenario', id: '__new__', title: '', description: '', isNew: true })
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
  }

  async function updateScenario(id, title, description, cover_image, status, genre, notes, cover_video) {
    try {
      if (id === '__new__') {
        const result = await createScenarioMutation.mutateAsync(title || 'سيناريو جديد');
        if (description || cover_image || status || genre || notes || cover_video) {
          await updateScenarioMutation.mutateAsync({ id: result.id, data: { title, description, cover_image, cover_video, status, genre, notes } });
        }
      } else {
        await updateScenarioMutation.mutateAsync({ id, data: { title, description, cover_image, cover_video, status, genre, notes } });
      }
      setEditingItem(null)
      showToast('تم حفظ التعديلات', 'success')
    } catch (err) { 
      showToast('فشل حفظ التعديلات', 'error')
    }
  }

  async function deleteScenario(id) {
    if (!confirm('هل تريد حذف هذا السيناريو؟ سيتم حذف جميع مشاهده.')) return
    try {
      await deleteScenarioMutation.mutateAsync(id);
      showToast('تم حذف السيناريو', 'info')
    } catch (err) {
      showToast('فشل حذف السيناريو', 'error')
    }
  }

  const exportProjectMutation = useExportProjectMutation();

  async function handleQuickExport(scenario) {
    setExportWizardScenario(scenario);
  }

  async function executeProjectExport(options) {
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

  async function handleExportJSON(scenario) {
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

  async function handleExportPackage(scenario) {
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

  async function handleImportScenario(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result)
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
        const { processAndSaveMedia } = await import('../services/mediaStorage.js')
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

  async function handleImportPackage(e) {
    const file = e.target.files[0]
    if (!file) return

    showToast('جاري قراءة الحزمة...', 'info')
    try {
      const { packageService } = await import('../services/api/packageService.js')
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
      const { processAndSaveMedia } = await import('../services/mediaStorage.js')
      const result = await importOperation.execute(json, { 
        mode: 'COPY',
        mediaProcessor: { process: processAndSaveMedia }
      })
      if (!result.success) throw new Error(result.error)
      
      showToast('تم استيراد الحزمة بنجاح', 'success')
      const { queryClient } = await import('../lib/queryClient');
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    } catch (err) {
      console.error('Import error:', err)
      showToast(err.message || 'فشل استيراد الحزمة', 'error')
      alert(`خطأ في الاستيراد:\n${err.message}\n\n${err.stack}`);
    }
    e.target.value = '' // Reset
  }

  async function resolveConflict(mode) {
    if (!conflictData) return

    const { json, existing, fileType } = conflictData
    setConflictData(null) // Close modal immediately

    showToast(fileType === 'PACKAGE' ? 'جاري معالجة الحزمة...' : 'جاري معالجة السيناريو...', 'info')
    try {
      const { ImportProject } = await import('@scriptflow/application')
      const { processAndSaveMedia } = await import('../services/mediaStorage.js')
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
        
        {/* Header elements removed for maximum poster immersion */}

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
                  <ScenarioCard
                    key="__new__"
                    scenario={{ id: '__new__', title: '', description: '', status: 'DRAFT', genre: '', notes: '', cover_image: '', cover_video: '' }}
                    editing={true}
                    onEdit={() => {}}
                    onCancel={handleCancelEdit}
                    onSave={(title, desc, cover_image, status, genre, notes, cover_video) => updateScenario('__new__', title, desc, cover_image, status, genre, notes, cover_video)}
                    onDelete={() => setEditingItem(null)}
                    onOpen={() => {}}
                  />
                )}
                {scenarios.map(scenario => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    editing={editingItem?.type === 'scenario' && editingItem?.id === scenario.id}
                    onEdit={() => setEditingItem({ type: 'scenario', id: scenario.id, title: scenario.title, description: scenario.description || '' })}
                    onCancel={handleCancelEdit}
                    onSave={(title, desc, cover_image, status, genre, notes, cover_video) => updateScenario(scenario.id, title, desc, cover_image, status, genre, notes, cover_video)}
                    onDelete={() => deleteScenario(scenario.id)}
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

        <ToastContainer toasts={toasts} dismissToast={dismissToast} />

        <ExportWizardModal 
          isOpen={!!exportWizardScenario} 
          scenario={exportWizardScenario}
          exportLevel="PROJECT"
          isExporting={isExporting}
          onClose={() => !isExporting && setExportWizardScenario(null)}
          onConfirm={executeProjectExport}
        />

        <ConflictResolutionModal
          conflictData={conflictData}
          onResolve={resolveConflict}
          onCancel={() => setConflictData(null)}
        />
      </main>
    </div>
  );
}

