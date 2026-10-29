import React, { useState, useEffect } from 'react';
import {
  FileText,
  Droplet,
  Hash,
  Palette,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  ClipboardList,
  LucideIcon
} from 'lucide-react';

export interface RevisionColorOption {
  key: string;
  label: string;
  hex: string;
  textColor: string;
}

export const REVISION_COLORS: RevisionColorOption[] = [
  { key: 'WHITE', label: 'أبيض (أصلي)', hex: '#FFFFFF', textColor: '#000' },
  { key: 'BLUE', label: 'أزرق', hex: '#CCEEFF', textColor: '#003366' },
  { key: 'PINK', label: 'وردي', hex: '#FFD6E0', textColor: '#660033' },
  { key: 'YELLOW', label: 'أصفر', hex: '#FFF9C4', textColor: '#6D5D00' },
  { key: 'GREEN', label: 'أخضر', hex: '#C8E6C9', textColor: '#1B5E20' },
  { key: 'GOLDENROD', label: 'ذهبي', hex: '#FFE082', textColor: '#5D4037' },
  { key: 'SALMON', label: 'سلموني', hex: '#FFAB91', textColor: '#BF360C' },
  { key: 'CHERRY', label: 'كرزي', hex: '#F48FB1', textColor: '#880E4F' },
  { key: 'TAN', label: 'بني فاتح', hex: '#D7CCC8', textColor: '#3E2723' },
];

export const WATERMARK_POSITIONS = [
  { key: 'center', label: 'وسط الصفحة' },
  { key: 'diagonal', label: 'قطري' },
];

export interface ExportSettings {
  enablePageNumbers: boolean;
  pageNumberPosition: string;
  enableWatermark: boolean;
  watermarkText: string;
  watermarkPosition: string;
  watermarkOpacity: number;
  revisionColor: string;
  revisionDate: string;
  revisionDraft: string;
  enableCoverPage: boolean;
  directorName: string;
  writerName: string;
  productionCompany: string;
  enableCallSheet: boolean;
  callSheetDate: string;
  callSheetCallTime: string;
  callSheetCrewNotes: string;
  enableHeader: boolean;
  headerText: string;
  enableFooter: boolean;
  footerText: string;
}

export interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
  scenarioTitle?: string;
  directorName?: string;
  writerName?: string;
  sceneCount?: number;
}

interface SectionHeaderProps {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  isActive: boolean;
}

export default function ExportSettingsModal({ 
  isOpen, 
  onClose, 
  onExport, 
  scenarioTitle, 
  directorName, 
  writerName, 
  sceneCount 
}: ExportSettingsModalProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    // Page numbering
    enablePageNumbers: true,
    pageNumberPosition: 'bottom-center', // 'top-right', 'bottom-center', 'bottom-right'
    
    // Watermark
    enableWatermark: false,
    watermarkText: 'سري - للاطلاع فقط',
    watermarkPosition: 'diagonal',
    watermarkOpacity: 0.08,
    
    // Revision
    revisionColor: 'WHITE',
    revisionDate: new Date().toISOString().split('T')[0],
    revisionDraft: '1',
    
    // Cover page
    enableCoverPage: true,
    directorName: '',
    writerName: '',
    productionCompany: '',
    
    // Call Sheet
    enableCallSheet: false,
    callSheetDate: new Date().toISOString().split('T')[0],
    callSheetCallTime: '07:00',
    callSheetCrewNotes: '',
    
    // Header/Footer
    enableHeader: true,
    headerText: '',
    enableFooter: true,
    footerText: 'SCRIPTFLOW PRO — CONFIDENTIAL',
  });

  const [expandedSection, setExpandedSection] = useState<string | null>('page');

  // Sync props to state settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(prev => ({
        ...prev,
        directorName: directorName || prev.directorName || '',
        writerName: writerName || prev.writerName || '',
        headerText: scenarioTitle || prev.headerText || '',
      }));
    }
  }, [isOpen, directorName, writerName, scenarioTitle]);

  if (!isOpen) return null;

  const update = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const SectionHeader: React.FC<SectionHeaderProps> = ({ id, icon: Icon, title, subtitle, isActive }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        isActive ? 'bg-primary/5 border border-primary/20' : 'hover:bg-secondary/50 border border-transparent'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isActive ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
      }`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 text-right">
        <p className="text-xs font-black text-foreground">{title}</p>
        <p className="text-[10px] font-bold text-muted-foreground">{subtitle}</p>
      </div>
      {isActive ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-[560px] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border bg-gradient-to-l from-card to-secondary/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-foreground">إعدادات التصدير السينمائي</h2>
            <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
              {scenarioTitle || 'سيناريو'} — {sceneCount || 1} مشهد
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
          
          {/* Section 1: Page Numbering */}
          <SectionHeader id="page" icon={Hash} title="ترقيم الصفحات" subtitle="هيدر وفوتر تلقائي" isActive={expandedSection === 'page'} />
          {expandedSection === 'page' && (
            <div className="pr-11 pb-3 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.enablePageNumbers} onChange={e => update('enablePageNumbers', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                <span className="text-xs font-bold text-foreground">تفعيل ترقيم الصفحات</span>
              </label>
              {settings.enablePageNumbers && (
                <select value={settings.pageNumberPosition} onChange={e => update('pageNumberPosition', e.target.value)}
                  className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50">
                  <option value="bottom-center">أسفل - وسط</option>
                  <option value="bottom-right">أسفل - يمين</option>
                  <option value="top-right">أعلى - يمين</option>
                </select>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.enableHeader} onChange={e => update('enableHeader', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                <span className="text-xs font-bold text-foreground">إظهار الهيدر</span>
              </label>
              {settings.enableHeader && (
                <input type="text" value={settings.headerText} onChange={e => update('headerText', e.target.value)}
                  placeholder="نص الهيدر (اختياري - سيُستخدم عنوان المشروع)"
                  className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.enableFooter} onChange={e => update('enableFooter', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                <span className="text-xs font-bold text-foreground">إظهار الفوتر</span>
              </label>
              {settings.enableFooter && (
                <input type="text" value={settings.footerText} onChange={e => update('footerText', e.target.value)}
                  placeholder="نص الفوتر"
                  className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
              )}
            </div>
          )}

          {/* Section 2: Watermark */}
          <SectionHeader id="watermark" icon={Droplet} title="العلامة المائية (Watermark)" subtitle="حماية من التسريب" isActive={expandedSection === 'watermark'} />
          {expandedSection === 'watermark' && (
            <div className="pr-11 pb-3 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.enableWatermark} onChange={e => update('enableWatermark', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                <span className="text-xs font-bold text-foreground">تفعيل العلامة المائية</span>
              </label>
              {settings.enableWatermark && (
                <>
                  <input type="text" value={settings.watermarkText} onChange={e => update('watermarkText', e.target.value)}
                    placeholder="نص العلامة المائية"
                    className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
                  <div className="flex gap-2">
                    {WATERMARK_POSITIONS.map(wp => (
                      <button key={wp.key}
                        type="button"
                        onClick={() => update('watermarkPosition', wp.key)}
                        className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all ${
                          settings.watermarkPosition === wp.key
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                        }`}
                      >{wp.label}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0">الشفافية:</span>
                    <input type="range" min="0.02" max="0.25" step="0.01" value={settings.watermarkOpacity}
                      onChange={e => update('watermarkOpacity', parseFloat(e.target.value))}
                      className="flex-1 accent-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground w-10 text-center">{Math.round(settings.watermarkOpacity * 100)}%</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Section 3: Revision Color */}
          <SectionHeader id="revision" icon={Palette} title="لون المراجعة (Revision)" subtitle="تتبع التعديلات" isActive={expandedSection === 'revision'} />
          {expandedSection === 'revision' && (
            <div className="pr-11 pb-3 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-3 gap-1.5">
                {REVISION_COLORS.map(rc => (
                  <button key={rc.key}
                    type="button"
                    onClick={() => update('revisionColor', rc.key)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                      settings.revisionColor === rc.key
                        ? 'border-primary ring-1 ring-primary/30 shadow-sm'
                        : 'border-border hover:border-primary/30'
                    }`}
                    style={{ backgroundColor: rc.hex, color: rc.textColor }}
                  >
                    <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: rc.hex }} />
                    {rc.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">تاريخ المراجعة</label>
                  <input type="date" value={settings.revisionDate} onChange={e => update('revisionDate', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-bold text-muted-foreground block mb-1">رقم المسودة</label>
                  <input type="text" value={settings.revisionDraft} onChange={e => update('revisionDraft', e.target.value)}
                    className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Cover Page */}
          <SectionHeader id="cover" icon={Eye} title="صفحة الغلاف" subtitle="معلومات الإنتاج" isActive={expandedSection === 'cover'} />
          {expandedSection === 'cover' && (
            <div className="pr-11 pb-3 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.enableCoverPage} onChange={e => update('enableCoverPage', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                <span className="text-xs font-bold text-foreground">إدراج صفحة غلاف</span>
              </label>
              {settings.enableCoverPage && (
                <>
                  <input type="text" value={settings.directorName} onChange={e => update('directorName', e.target.value)}
                    placeholder="اسم المخرج"
                    className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
                  <input type="text" value={settings.writerName} onChange={e => update('writerName', e.target.value)}
                    placeholder="اسم الكاتب"
                    className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
                  <input type="text" value={settings.productionCompany} onChange={e => update('productionCompany', e.target.value)}
                    placeholder="شركة الإنتاج (اختياري)"
                    className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
                </>
              )}
            </div>
          )}

          {/* Section 5: Call Sheet */}
          <SectionHeader id="callsheet" icon={ClipboardList} title="كشف الاستدعاء (Call Sheet)" subtitle="ملحق توزيع الطاقم" isActive={expandedSection === 'callsheet'} />
          {expandedSection === 'callsheet' && (
            <div className="pr-11 pb-3 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.enableCallSheet} onChange={e => update('enableCallSheet', e.target.checked)} className="accent-primary w-4 h-4 rounded" />
                <span className="text-xs font-bold text-foreground">إلحاق كشف الاستدعاء بالتصدير</span>
              </label>
              {settings.enableCallSheet && (
                <>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-muted-foreground block mb-1">تاريخ التصوير</label>
                      <input type="date" value={settings.callSheetDate} onChange={e => update('callSheetDate', e.target.value)}
                        className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="w-28">
                      <label className="text-[10px] font-bold text-muted-foreground block mb-1">ساعة الحضور</label>
                      <input type="time" value={settings.callSheetCallTime} onChange={e => update('callSheetCallTime', e.target.value)}
                        className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>
                  <textarea value={settings.callSheetCrewNotes} onChange={e => update('callSheetCrewNotes', e.target.value)}
                    placeholder="ملاحظات إضافية للطاقم..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg text-xs font-bold p-2 focus:outline-none focus:border-primary/50 resize-none" />
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/10 flex items-center gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary transition-all">
            إلغاء
          </button>
          <button
            onClick={() => onExport(settings)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <Download size={16} />
            تصدير PDF
          </button>
        </div>
      </div>
    </div>
  );
}
