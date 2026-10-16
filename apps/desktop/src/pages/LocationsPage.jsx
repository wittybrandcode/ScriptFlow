import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, MapPin, Filter, Home, Globe, CheckCircle2, XCircle, Clock, X, Film, BarChart3, ImageOff, Trees, Clapperboard, FileDown, Map, Phone, DollarSign, Lightbulb, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import AdvancedFilterBar from '../components/ui/AdvancedFilterBar';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useLocationsQuery, useDeleteLocationMutation } from '../hooks/queries/useLocations';
import { useExportProjectMutation } from '../hooks/queries/useExport';
import { LocationScenesPDFStrategy } from '../services/exportStrategies';
import LocationCard from '../components/dashboard/LocationCard';
import LocationModal from '../components/LocationModal';
import LocationPreviewModal from '../components/LocationPreviewModal';
import MapDisplay from '../components/MapDisplay';
import WeatherWidget from '../components/WeatherWidget';

const STATUS_FILTERS = [
  { value: '', label: 'جميع الحالات' },
  { value: 'AVAILABLE', label: 'متاح' },
  { value: 'BUSY', label: 'مشغول' },
  { value: 'UNAVAILABLE', label: 'غير متاح' },
  { value: 'REVIEW', label: 'قيد المراجعة' },
];

export default function LocationsPage() {
  const { activeScenarioId } = useUIStore();
  const { data: locations, isLoading } = useLocationsQuery(activeScenarioId);
  const deleteMutation = useDeleteLocationMutation(activeScenarioId);
  const exportProjectMutation = useExportProjectMutation();
  
  const { setTopBarConfig, setSidebarContext, clearSidebarContext } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [previewLocation, setPreviewLocation] = useState(null);
  const [showMapInPreview, setShowMapInPreview] = useState(false);
  const [sceneCounts, setSceneCounts] = useState({});
  const [totalScenes, setTotalScenes] = useState(0);
  const [allScenes, setAllScenes] = useState([]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScenarioId]);

  async function fetchSceneCounts() {
    try {
      const { sceneApi: sceneRepo } = await import('../hooks/queries/useScenes');
      const scenes = await sceneRepo.getByScenarioId(activeScenarioId);
      const sceneArr = scenes || [];
      setAllScenes(sceneArr);
      setTotalScenes(sceneArr.length);
      const counts = {};
      sceneArr.forEach(scene => {
        if (scene.location_id) {
          counts[scene.location_id] = (counts[scene.location_id] || 0) + 1;
        }
      });
      setSceneCounts(counts);
    } catch(e) { /* silent */ }
  }

  // PDF Export - using the shared engine (utils/exportPDF.jsx)
  async function exportScenePdf(sceneId) {
    try {
      await exportProjectMutation.mutateAsync({
        scenarioId: activeScenarioId,
        strategy: new LocationScenesPDFStrategy({ filterSceneId: sceneId, locationName: previewLocation?.name })
      });
    } catch(e) {
      console.error('PDF export failed', e);
    }
  }

  async function exportAllScenesPdf(locationScenes) {
    try {
      await exportProjectMutation.mutateAsync({
        scenarioId: activeScenarioId,
        strategy: new LocationScenesPDFStrategy({ filterLocationId: previewLocation?.id, locationName: previewLocation?.name })
      });
    } catch(e) {
      console.error('PDF batch export failed', e);
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموقع من المكتبة؟')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const locList = useMemo(() => Array.isArray(locations) ? locations : [], [locations]);

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
      if (filterType && loc.type !== filterType) return false;
      // Status
      if (filterStatus && (loc.status || 'REVIEW') !== filterStatus) return false;
      return true;
    });
  }, [locList, searchTerm, filterType, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = locList.length;
    const interior = locList.filter(l => l.type === 'INT').length;
    const exterior = locList.filter(l => l.type === 'EXT').length;
    const available = locList.filter(l => l.status === 'AVAILABLE').length;
    const unavailable = locList.filter(l => l.status === 'UNAVAILABLE' || l.status === 'BUSY').length;
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

  const hasActiveFilters = searchTerm || filterType || filterStatus;

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
        <AdvancedFilterBar 
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
              <LocationCard 
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
         <LocationModal 
            location={editingLocation}
            onClose={() => { setShowModal(false); setEditingLocation(null); }}
         />
      )}

      <LocationPreviewModal
        previewLocation={previewLocation}
        sceneCounts={sceneCounts}
        totalScenes={totalScenes}
        allScenes={allScenes}
        onClose={() => setPreviewLocation(null)}
        onExportAllScenesPdf={exportAllScenesPdf}
        onExportScenePdf={exportScenePdf}
      />
    </div>
  );
}

