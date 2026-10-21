import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, MapPin, Filter, Home, Globe, CheckCircle2 } from 'lucide-react';
import AdvancedFilterBar from '../components/ui/AdvancedFilterBar';
import { useUIStore } from '../store/useUIStore';
import { useLocationsQuery, useDeleteLocationMutation } from '../hooks/queries/useLocations';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { LocationScenesPDFStrategy } from '../services/exportStrategies';
import LocationCard from '../components/dashboard/LocationCard';
import LocationModal from '../components/LocationModal';
import LocationPreviewModal from '../components/LocationPreviewModal';
import ConfirmModal from '../components/common/ConfirmModal';
import type { ILocation, IScene } from '@scriptflow/core';

const SafeAdvancedFilterBar = AdvancedFilterBar as React.ComponentType<any>;
const SafeLocationCard = LocationCard as React.ComponentType<any>;
const SafeLocationModal = LocationModal as React.ComponentType<any>;
const SafeLocationPreviewModal = LocationPreviewModal as React.ComponentType<any>;

const STATUS_FILTERS = [
  { value: '', label: 'جميع الحالات' },
  { value: 'AVAILABLE', label: 'متاح' },
  { value: 'BUSY', label: 'مشغول' },
  { value: 'UNAVAILABLE', label: 'غير متاح' },
  { value: 'REVIEW', label: 'قيد المراجعة' },
];

export default function LocationsPage() {
  const { activeScenarioId } = useUIStore();
  const { data: locations } = useLocationsQuery(activeScenarioId || '');
  const deleteMutation = useDeleteLocationMutation(activeScenarioId || '');
  const exportProjectMutation = useExportProjectMutation() as any;
  
  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [locationToDelete, setLocationToDelete] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<ILocation | null>(null);
  const [previewLocation, setPreviewLocation] = useState<ILocation | null>(null);
  const [sceneCounts, setSceneCounts] = useState<Record<string, number>>({});
  const [totalScenes, setTotalScenes] = useState<number>(0);
  const [allScenes, setAllScenes] = useState<IScene[]>([]);

  useEffect(() => {
    setTopBarConfig({ 
      pageName: 'مكتبة المواقع',
      actions: [
        {
          label: 'موقع جديد',
          icon: Plus,
          variant: 'primary',
          onClick: () => setShowModal(true)
        }
      ]
    });
    if (activeScenarioId) fetchSceneCounts();
    return () => { setTopBarConfig(null); clearSidebarContext(); };
  }, [activeScenarioId, setTopBarConfig, clearSidebarContext]);

  async function fetchSceneCounts() {
    if (!activeScenarioId) return;
    try {
      const { sceneApi: sceneRepo } = await import('../hooks/queries/useScenes');
      const scenes = await sceneRepo.getByScenarioId(activeScenarioId);
      const sceneArr = (scenes || []) as IScene[];
      setAllScenes(sceneArr);
      setTotalScenes(sceneArr.length);
      const counts: Record<string, number> = {};
      sceneArr.forEach((scene: any) => {
        if (scene.location_id) {
          counts[scene.location_id] = (counts[scene.location_id] || 0) + 1;
        }
      });
      setSceneCounts(counts);
    } catch(e) { /* silent */ }
  }

  // PDF Export - using the shared engine (utils/exportPDF.jsx)
  async function exportScenePdf(sceneId: string) {
    if (!activeScenarioId) return;
    try {
      await exportProjectMutation.mutateAsync({
        scenarioId: activeScenarioId,
        strategy: new LocationScenesPDFStrategy({ filterSceneId: sceneId, locationName: previewLocation?.name })
      });
    } catch(e) {
      console.error('PDF export failed', e);
    }
  }

  async function exportAllScenesPdf() {
    if (!activeScenarioId || !previewLocation) return;
    try {
      await exportProjectMutation.mutateAsync({
        scenarioId: activeScenarioId,
        strategy: new LocationScenesPDFStrategy({ filterLocationId: previewLocation.id, locationName: previewLocation.name })
      });
    } catch(e) {
      console.error('PDF batch export failed', e);
    }
  }

  const handleDelete = (locOrId: any) => {
    setLocationToDelete(locOrId);
  };

  const handleConfirmDeleteLocation = async () => {
    if (!locationToDelete) return;
    try {
      const locId = typeof locationToDelete === 'object' ? locationToDelete.id : locationToDelete;
      await deleteMutation.mutateAsync(locId);
      setLocationToDelete(null);
    } catch (err) {
      console.error('Delete location error:', err);
    }
  };

  const locList = useMemo<ILocation[]>(() => Array.isArray(locations) ? (locations as ILocation[]) : [], [locations]);

  const filteredLocations = useMemo(() => {
    return locList.filter(loc => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match = (loc.name || '').toLowerCase().includes(q) 
          || (loc.address || '').toLowerCase().includes(q)
          || (loc.description || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      // Type
      const lType = loc.location_type || (loc as any).type;
      if (filterType && lType !== filterType) return false;
      // Status
      const lStatus = (loc.status as string) || 'REVIEW';
      if (filterStatus && lStatus !== filterStatus) return false;
      return true;
    });
  }, [locList, searchTerm, filterType, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = locList.length;
    const interior = locList.filter(l => (l.location_type || (l as any).type) === 'INT').length;
    const exterior = locList.filter(l => (l.location_type || (l as any).type) === 'EXT').length;
    const available = locList.filter(l => (l.status as string) === 'AVAILABLE').length;
    const unavailable = locList.filter(l => (l.status as string) === 'UNAVAILABLE' || (l.status as string) === 'BUSY').length;
    return { total, interior, exterior, available, unavailable };
  }, [locList]);

  // Register sidebar context
  useEffect(() => {
    setSidebarContext({
      title: 'إحصائيات المواقع',
      stats: [
        { label: 'إجمالي', value: stats.total },
        { label: 'داخلي', value: stats.interior },
        { label: 'خارجي', value: stats.exterior },
      ],
    });
  }, [stats, setSidebarContext]);

  const hasActiveFilters = Boolean(searchTerm || filterType || filterStatus);

  return (
    <div className="p-4 mx-auto h-[calc(100vh-80px)] flex flex-col gap-4 animate-in fade-in duration-500">
      
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><MapPin size={18} /></div>
          <div>
            <div className="text-lg font-black text-foreground leading-none">{stats.total}</div>
            <div className="text-xs text-muted-foreground font-medium">إجمالي المواقع</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600"><Home size={18} /></div>
          <div>
            <div className="text-lg font-black text-foreground leading-none">{stats.interior}</div>
            <div className="text-xs text-muted-foreground font-medium">مواقع داخلية</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Globe size={18} /></div>
          <div>
            <div className="text-lg font-black text-foreground leading-none">{stats.exterior}</div>
            <div className="text-xs text-muted-foreground font-medium">مواقع خارجية</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600"><CheckCircle2 size={18} /></div>
          <div>
            <div className="text-lg font-black text-foreground leading-none">{stats.available}</div>
            <div className="text-xs text-muted-foreground font-medium">متاح للتصوير</div>
          </div>
        </div>
      </div>

      {/* Search + Filters Bar */}
      <div className="shrink-0 mb-4">
        <SafeAdvancedFilterBar 
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="بحث بالاسم، العنوان، أو الوصف..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setSearchTerm('');
            setFilterType('');
            setFilterStatus('');
          }}
          filters={[
            {
              type: 'toggle',
              value: filterType,
              onChange: setFilterType,
              options: [
                { value: '', label: 'الكل' },
                { value: 'INT', label: 'داخلي' },
                { value: 'EXT', label: 'خارجي' }
              ]
            },
            {
              type: 'select',
              value: filterStatus,
              onChange: setFilterStatus,
              options: STATUS_FILTERS
            }
          ]}
        />
        {hasActiveFilters && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground font-medium px-2">
            <Filter size={12} />
            <span>عرض {filteredLocations.length} من أصل {locList.length} موقع</span>
          </div>
        )}
      </div>

      {/* Locations Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-8">
        {locList.length === 0 ? (
          <div className="py-20 text-center bg-card border border-dashed border-border rounded-lg">
             <MapPin size={32} className="mx-auto mb-3 text-muted-foreground/30" />
             <div className="text-sm text-muted-foreground font-medium">لم يتم تسجيل أي مواقع لهذا المشروع بعد.</div>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="py-16 text-center bg-card border border-dashed border-border rounded-lg">
             <Search size={28} className="mx-auto mb-3 text-muted-foreground/30" />
             <div className="text-sm text-muted-foreground font-medium">لا توجد مواقع تطابق معايير الفلترة الحالية.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {filteredLocations.map(loc => (
              <SafeLocationCard 
                key={loc.id}
                location={loc}
                parentLocation={locList.find(p => p.id === loc.parent_location_id)}
                onEdit={() => setEditingLocation(loc)}
                onDelete={() => handleDelete(loc.id)}
                onPreview={() => setPreviewLocation(loc)}
                sceneCount={sceneCounts[loc.id] || 0}
                totalScenes={totalScenes}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showModal || editingLocation) && (
         <SafeLocationModal 
            location={editingLocation}
            onClose={() => { setShowModal(false); setEditingLocation(null); }}
         />
      )}

      <SafeLocationPreviewModal
        previewLocation={previewLocation}
        sceneCounts={sceneCounts}
        totalScenes={totalScenes}
        allScenes={allScenes}
        onClose={() => setPreviewLocation(null)}
        onExportAllScenesPdf={exportAllScenesPdf}
        onExportScenePdf={exportScenePdf}
      />

      <ConfirmModal 
        isOpen={!!locationToDelete}
        title="حذف الموقع"
        message="هل أنت متأكد من رغبتك في حذف هذا الموقع من المكتبة؟"
        confirmText="تأكيد حذف الموقع"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onClose={() => setLocationToDelete(null)}
        onConfirm={handleConfirmDeleteLocation}
      />
    </div>
  );
}
