import { useState, useEffect } from 'react';
import { X, FileText, FileArchive, CheckCircle2, ChevronRight, FileOutput, Loader2, Shield, Settings, Info } from 'lucide-react';

const REVISION_COLORS = [
  { value: 'WHITE', label: 'أبيض (مسودة أولى)' },
  { value: 'BLUE', label: 'أزرق (مراجعة 2)' },
  { value: 'PINK', label: 'وردي (مراجعة 3)' },
  { value: 'YELLOW', label: 'أصفر (مراجعة 4)' },
  { value: 'GREEN', label: 'أخضر (مراجعة 5)' },
  { value: 'GOLDENROD', label: 'ذهبي (مراجعة 6)' },
  { value: 'SALMON', label: 'سلموني (مراجعة 7)' },
  { value: 'CHERRY', label: 'كرزي (مراجعة 8)' },
  { value: 'TAN', label: 'بني (مراجعة 9)' },
];

export interface ExportWizardPayload {
  exportType: 'SINGLE_PDF' | 'ZIP_EPISODES';
  includeMasterCover: boolean;
  includeEpisodeCovers: boolean;
  includeSceneCovers: boolean;
  exportLevel: 'PROJECT' | 'EPISODE' | 'SCENE';
  targetEntityId: string | number | null;
  exportSettings: {
    writerName: string;
    directorName: string;
    productionCompany: string;
    revisionDraft: string;
    revisionDate: string;
    revisionColor: string;
    enableWatermark: boolean;
    watermarkText: string;
    watermarkOpacity: number;
    enablePagination: boolean;
    paginationPosition: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ExportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario?: any;
  onConfirm: (payload: any) => void | Promise<void>;
  isExporting: boolean;
  exportLevel?: 'PROJECT' | 'EPISODE' | 'SCENE';
  targetEntity?: any;
}

export default function ExportWizardModal({ 
  isOpen, 
  onClose, 
  scenario, 
  onConfirm, 
  isExporting, 
  exportLevel = 'PROJECT',
  targetEntity = null
}: ExportWizardModalProps) {
  // 'SINGLE_PDF' | 'ZIP_EPISODES'
  const [exportType, setExportType] = useState<'SINGLE_PDF' | 'ZIP_EPISODES'>('SINGLE_PDF');
  
  // Formatting options
  const [includeMasterCover, setIncludeMasterCover] = useState<boolean>(exportLevel === 'PROJECT');
  const [includeEpisodeCovers, setIncludeEpisodeCovers] = useState<boolean>(exportLevel !== 'SCENE');
  const [includeSceneCovers, setIncludeSceneCovers] = useState<boolean>(false);

  // Production Info
  const [writerName, setWriterName] = useState<string>('');
  const [directorName, setDirectorName] = useState<string>('');
  const [productionCompany, setProductionCompany] = useState<string>('');
  
  // Revision Info
  const [revisionDraft, setRevisionDraft] = useState<string>('');
  const [revisionDate, setRevisionDate] = useState<string>('');
  const [revisionColor, setRevisionColor] = useState<string>('WHITE');

  // Security / Pagination
  const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>('سري للغاية / CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(8); // opacity in percentage
  const [enablePagination, setEnablePagination] = useState<boolean>(true);
  const [paginationPosition, setPaginationPosition] = useState<string>('bottom-center'); // 'bottom-center' | 'bottom-left' | 'top-left'

  // Sync state values when scenario changes (loaded from db) or modal opens
  useEffect(() => {
    if (scenario) {
      setWriterName(scenario.writer_name || '');
      setDirectorName(scenario.director_name || '');
      setIncludeMasterCover(scenario.include_master_cover !== undefined ? scenario.include_master_cover === 1 : exportLevel === 'PROJECT');
      setIncludeEpisodeCovers(scenario.include_episode_covers !== undefined ? scenario.include_episode_covers === 1 : exportLevel !== 'SCENE');
      setIncludeSceneCovers(scenario.include_scene_covers !== undefined ? scenario.include_scene_covers === 1 : false);
    }
  }, [scenario, isOpen, exportLevel]);

  // Adjust defaults when exportLevel changes
  useEffect(() => {
    if (scenario) {
      setIncludeMasterCover(exportLevel === 'PROJECT' && (scenario.include_master_cover !== undefined ? scenario.include_master_cover === 1 : true));
      setIncludeEpisodeCovers(exportLevel !== 'SCENE' && (scenario.include_episode_covers !== undefined ? scenario.include_episode_covers === 1 : true));
      setIncludeSceneCovers(scenario.include_scene_covers !== undefined ? scenario.include_scene_covers === 1 : false);
    } else {
      setIncludeMasterCover(exportLevel === 'PROJECT');
      setIncludeEpisodeCovers(exportLevel !== 'SCENE');
      setIncludeSceneCovers(false);
    }
    setExportType('SINGLE_PDF'); // ZIP is only available for full project
  }, [exportLevel, isOpen, scenario]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm({
      exportType,
      includeMasterCover,
      includeEpisodeCovers,
      includeSceneCovers,
      exportLevel,
      targetEntityId: targetEntity?.id || null,
      exportSettings: {
        writerName,
        directorName,
        productionCompany,
        revisionDraft,
        revisionDate,
        revisionColor,
        enableWatermark,
        watermarkText,
        watermarkOpacity: watermarkOpacity / 100, // Pass fraction to CSS
        enablePagination,
        paginationPosition
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[1000] animate-in fade-in duration-300 p-4">
      <div 
        dir="rtl"
        className="w-full max-w-3xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden scale-in-center animate-in zoom-in-95 duration-300 flex flex-col font-sans max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-secondary/30 border-b border-border p-6 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm">
              <FileOutput size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight">
                {exportLevel === 'PROJECT' && 'معالج التصدير الشامل'}
                {exportLevel === 'EPISODE' && 'معالج تصدير حلقة سينمائية'}
                {exportLevel === 'SCENE' && 'معالج تصدير مشهد مستقل'}
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                {exportLevel === 'PROJECT' && (
                  <>تصدير نص المشروع: <span className="text-primary font-bold">{scenario?.title || 'مشروع بدون عنوان'}</span></>
                )}
                {exportLevel === 'EPISODE' && (
                  <>تصدير الحلقة <span className="text-primary font-bold">{targetEntity?.episode_number || targetEntity?.number || ''}</span>: <span className="text-primary font-bold">{targetEntity?.title || 'حلقة بدون عنوان'}</span></>
                )}
                {exportLevel === 'SCENE' && (
                  <>تصدير المشهد <span className="text-primary font-bold">{targetEntity?.scene_number || targetEntity?.number || ''}</span>: <span className="text-primary font-bold">{targetEntity?.title || 'مشهد بدون عنوان'}</span></>
                )}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-background relative space-y-8 custom-scrollbar">
          
          {/* Loading Overlay when exporting */}
          {isExporting && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 size={48} className="text-primary animate-spin mb-4" />
              <h4 className="text-lg font-black text-foreground">جاري معالجة التصدير...</h4>
              <p className="text-sm text-muted-foreground mt-2 font-medium">يرجى الانتظار وعدم إغلاق النافذة، قد يستغرق هذا بعض الوقت لتهيئة الفواصل والصفحات.</p>
            </div>
          )}

          {/* SECTION 1: Export Type */}
          {exportLevel === 'PROJECT' && (
            <div className="space-y-4">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Settings size={14} />
              نوع وصيغة التصدير
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option: Single PDF */}
              <button 
                onClick={() => setExportType('SINGLE_PDF')}
                disabled={isExporting}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all duration-200 text-right ${exportType === 'SINGLE_PDF' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-primary/40 bg-card hover:bg-secondary/30'}`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exportType === 'SINGLE_PDF' ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                    <FileText size={20} />
                  </div>
                  {exportType === 'SINGLE_PDF' && <CheckCircle2 size={20} className="text-primary" />}
                </div>
                <h5 className={`font-black text-base mb-1 ${exportType === 'SINGLE_PDF' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  ملف PDF واحد ضخم
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  دمج جميع الحلقات والمشاهد في ملف PDF سينمائي متصل. ممتاز للقراءة والطباعة.
                </p>
              </button>

              {/* Option: ZIP package */}
              <button 
                onClick={() => setExportType('ZIP_EPISODES')}
                disabled={isExporting}
                className={`flex flex-col items-start p-5 rounded-2xl border-2 transition-all duration-200 text-right ${exportType === 'ZIP_EPISODES' ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10' : 'border-border hover:border-amber-500/40 bg-card hover:bg-secondary/30'}`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exportType === 'ZIP_EPISODES' ? 'bg-amber-500 text-white' : 'bg-secondary text-muted-foreground'}`}>
                    <FileArchive size={20} />
                  </div>
                  {exportType === 'ZIP_EPISODES' && <CheckCircle2 size={20} className="text-amber-500" />}
                </div>
                <h5 className={`font-black text-base mb-1 ${exportType === 'ZIP_EPISODES' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  ملفات منفصلة (ZIP)
                </h5>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  مجلد مضغوط ZIP يحتوي على ملفات PDF مجزأة لكل حلقة على حدة للتصوير والإنتاج المجدول.
                </p>
              </button>
            </div>
          </div>
          )}

          {/* SECTION 2: General Info & Covers */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Info size={14} />
              بيانات العمل والأغلفة
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">اسم الكاتب / المؤلف</label>
                <input 
                  type="text" 
                  value={writerName} 
                  onChange={e => setWriterName(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="المؤلف"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">اسم المخرج</label>
                <input 
                  type="text" 
                  value={directorName} 
                  onChange={e => setDirectorName(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="المخرج"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">جهة الإنتاج</label>
                <input 
                  type="text" 
                  value={productionCompany} 
                  onChange={e => setProductionCompany(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="الشركة المنتجة"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">رقم النسخة / المسودة</label>
                <input 
                  type="text" 
                  value={revisionDraft} 
                  onChange={e => setRevisionDraft(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="مثال: المسودة 2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">تاريخ النسخة</label>
                <input 
                  type="date" 
                  value={revisionDate} 
                  onChange={e => setRevisionDate(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">لون المراجعة (معيار هوليوود)</label>
                <select 
                  value={revisionColor} 
                  onChange={e => setRevisionColor(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  {REVISION_COLORS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden mt-4">
              {exportLevel === 'PROJECT' && (
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-foreground">تضمين غلاف رئيسي للمشروع</span>
                    <span className="text-[10px] text-muted-foreground">صفحة مستقلة باسم العمل والشركة في بداية الملف.</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${includeMasterCover ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                    <input type="checkbox" className="sr-only" checked={includeMasterCover} onChange={() => setIncludeMasterCover(!includeMasterCover)} disabled={isExporting} />
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${includeMasterCover ? '-translate-x-5' : '-translate-x-1'}`} />
                  </div>
                </label>
              )}

              {exportLevel === 'PROJECT' && (
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-foreground">تضمين فواصل الحلقات</span>
                    <span className="text-[10px] text-muted-foreground">صفحة فاصلة خاصة قبل بدء كل حلقة.</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${includeEpisodeCovers ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                    <input type="checkbox" className="sr-only" checked={includeEpisodeCovers} onChange={() => setIncludeEpisodeCovers(!includeEpisodeCovers)} disabled={isExporting} />
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${includeEpisodeCovers ? '-translate-x-5' : '-translate-x-1'}`} />
                  </div>
                </label>
              )}

              {exportLevel === 'EPISODE' && (
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-foreground">تضمين غلاف للحلقة</span>
                    <span className="text-[10px] text-muted-foreground">صفحة مستقلة باسم الحلقة ورقمها في بداية التصدير.</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${includeEpisodeCovers ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                    <input type="checkbox" className="sr-only" checked={includeEpisodeCovers} onChange={() => setIncludeEpisodeCovers(!includeEpisodeCovers)} disabled={isExporting} />
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${includeEpisodeCovers ? '-translate-x-5' : '-translate-x-1'}`} />
                  </div>
                </label>
              )}

              {exportLevel === 'SCENE' && (
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-foreground">تضمين صفحة غلاف مستقلة للمشهد (Page de Garde)</span>
                    <span className="text-[10px] text-muted-foreground">صفحة غلاف تحتوي على الكاتب والمخرج ورقم المشهد والزمان والمكان في بداية الملف.</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${includeMasterCover ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                    <input type="checkbox" className="sr-only" checked={includeMasterCover} onChange={() => setIncludeMasterCover(!includeMasterCover)} disabled={isExporting} />
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${includeMasterCover ? '-translate-x-5' : '-translate-x-1'}`} />
                  </div>
                </label>
              )}

              {exportLevel !== 'SCENE' && (
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-foreground">تضمين فواصل المشاهد (أغلفة المشاهد)</span>
                    <span className="text-[10px] text-muted-foreground">صفحة فاصلة مستقلة لكل مشهد (تؤثر على ترقيم الصفحات).</span>
                  </div>
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${includeSceneCovers ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                    <input type="checkbox" className="sr-only" checked={includeSceneCovers} onChange={() => setIncludeSceneCovers(!includeSceneCovers)} disabled={isExporting} />
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${includeSceneCovers ? '-translate-x-5' : '-translate-x-1'}`} />
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* SECTION 3: Protection & Pagination */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} />
              خيارات الترقيم والعلامة المائية (الحماية)
            </h4>
            
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
              {/* Pagination settings */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${enablePagination ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                    <input type="checkbox" className="sr-only" checked={enablePagination} onChange={() => setEnablePagination(!enablePagination)} disabled={isExporting} />
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enablePagination ? '-translate-x-5' : '-translate-x-1'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">تفعيل ترقيم الصفحات</label>
                    <p className="text-[10px] text-muted-foreground">ترقيم الصفحات بشكل تلقائي (لا يشمل الأغلفة).</p>
                  </div>
                </div>

                {enablePagination && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">موقع الترقيم:</span>
                    <select 
                      value={paginationPosition} 
                      onChange={e => setPaginationPosition(e.target.value)} 
                      className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="bottom-center">أسفل المنتصف</option>
                      <option value="bottom-left">أسفل اليسار</option>
                      <option value="top-left">أعلى اليسار</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Watermark toggle */}
              <div className="border-t border-border/50 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${enableWatermark ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                    <input type="checkbox" className="sr-only" checked={enableWatermark} onChange={() => setEnableWatermark(!enableWatermark)} disabled={isExporting} />
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enableWatermark ? '-translate-x-5' : '-translate-x-1'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">طباعة علامة مائية لحماية النص</label>
                    <p className="text-[10px] text-muted-foreground">علامة مائية مائلة متكررة لمنع التسريب.</p>
                  </div>
                </div>

                {enableWatermark && (
                  <div className="flex flex-col md:flex-row gap-3 flex-1 max-w-md">
                    <input 
                      type="text" 
                      value={watermarkText} 
                      onChange={e => setWatermarkText(e.target.value)} 
                      className="flex-1 px-3 py-1.5 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none"
                      placeholder="نص العلامة المائية"
                    />
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">الشفافية: {watermarkOpacity}%</span>
                      <input 
                        type="range" 
                        min="5" 
                        max="25" 
                        value={watermarkOpacity} 
                        onChange={e => setWatermarkOpacity(Number(e.target.value))} 
                        className="w-full accent-primary h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-secondary/30 border-t border-border p-6 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl border border-border text-foreground font-bold hover:bg-background transition-colors text-sm disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={isExporting}
            className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all text-sm flex items-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                بدء التصدير
                <ChevronRight size={16} className="rotate-180" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
