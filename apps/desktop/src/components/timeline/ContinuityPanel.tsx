import React, { useMemo, useState } from 'react';
import { analyzeContinuity } from '../../utils/continuityAnalyzer';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  ScanSearch
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  actor: User,
  location: MapPin,
  turnaround: Clock,
};

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; badge: string; label: string }> = {
  error: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    icon: 'text-rose-500',
    badge: 'bg-rose-500 text-white',
    label: 'خطأ حرج'
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    badge: 'bg-amber-500 text-white',
    label: 'تحذير'
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-500',
    badge: 'bg-blue-500 text-white',
    label: 'ملاحظة'
  }
};

const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface ContinuityPanelProps {
  shootDays?: any[];
  characters?: any[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function ContinuityPanel({ 
  shootDays = [], 
  characters = [], 
  isOpen, 
  onToggle 
}: ContinuityPanelProps): React.JSX.Element {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const allWarnings = useMemo(() => {
    return analyzeContinuity(shootDays, characters) as any[];
  }, [shootDays, characters]);

  const activeWarnings = useMemo(() => {
    return allWarnings.filter(w => !dismissedIds.has(w.id));
  }, [allWarnings, dismissedIds]);

  const filteredWarnings = useMemo(() => {
    if (filterCategory === 'all') return activeWarnings;
    return activeWarnings.filter(w => w.category === filterCategory);
  }, [activeWarnings, filterCategory]);

  const errorCount = activeWarnings.filter(w => w.type === 'error').length;
  const warningCount = activeWarnings.filter(w => w.type === 'warning').length;
  const infoCount = activeWarnings.filter(w => w.type === 'info').length;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleResetAll = () => {
    setDismissedIds(new Set());
  };

  // Collapsed state: show a small badge on the toggle button
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
          errorCount > 0
            ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
            : warningCount > 0
              ? 'bg-amber-500 text-white border-amber-600'
              : activeWarnings.length > 0
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-card text-muted-foreground border-border hover:bg-secondary'
        }`}
        title="محلل الاستمرارية"
        aria-label="محلل الاستمرارية"
      >
        <ShieldAlert size={18} />
        <span className="text-xs font-black">
          {activeWarnings.length > 0
            ? `${activeWarnings.length} تنبيه`
            : 'لا تنبيهات'}
        </span>
        {errorCount > 0 && (
          <span className="bg-white/30 text-white px-1.5 py-0.5 rounded-full text-[10px] font-black">
            {errorCount} حرج
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[420px] max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-l from-card to-secondary/20 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ScanSearch size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-foreground leading-tight">محلل الاستمرارية</h3>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
            فحص لوجستيات جدول التصوير تلقائياً
          </p>
        </div>

        {/* Badge Summary */}
        <div className="flex items-center gap-1.5 shrink-0">
          {errorCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{errorCount}</span>
          )}
          {warningCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{warningCount}</span>
          )}
          {infoCount > 0 && (
            <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{infoCount}</span>
          )}
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors shrink-0"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/30 bg-secondary/10">
        {[
          { key: 'all', label: 'الكل', count: activeWarnings.length, icon: null },
          { key: 'actor', label: 'ممثلون', count: activeWarnings.filter(w => w.category === 'actor').length, icon: User },
          { key: 'location', label: 'مواقع', count: activeWarnings.filter(w => w.category === 'location').length, icon: MapPin },
          { key: 'turnaround', label: 'استمرارية', count: activeWarnings.filter(w => w.category === 'turnaround').length, icon: Clock },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterCategory(f.key)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              filterCategory === f.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            {f.icon && <f.icon size={10} />}
            {f.label}
            {f.count > 0 && (
              <span className={`px-1 rounded-full text-[9px] ${
                filterCategory === f.key ? 'bg-white/20' : 'bg-secondary'
              }`}>{f.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2">
        {filteredWarnings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <p className="text-sm font-black text-foreground">لا توجد تنبيهات!</p>
            <p className="text-[11px] font-bold text-muted-foreground mt-1">
              جدول التصوير متسق لوجستياً.
            </p>
            {dismissedIds.size > 0 && (
              <button
                onClick={handleResetAll}
                className="mt-4 text-[10px] font-bold text-primary hover:underline"
              >
                إعادة إظهار {dismissedIds.size} تنبيه مخفي
              </button>
            )}
          </div>
        ) : (
          filteredWarnings.map(warning => {
            const style = TYPE_STYLES[warning.type] || TYPE_STYLES.info;
            const TypeIcon = TYPE_ICONS[warning.type] || Info;
            const CatIcon = ICON_MAP[warning.category] || ShieldAlert;
            const isExpanded = expandedId === warning.id;

            return (
              <div
                key={warning.id}
                className={`relative group ${style.bg} border ${style.border} rounded-xl p-3 transition-all duration-200 hover:shadow-md cursor-pointer`}
                onClick={() => setExpandedId(isExpanded ? null : warning.id)}
              >
                <div className="flex items-start gap-2.5">
                  {/* Icon */}
                  <div className={`mt-0.5 shrink-0 ${style.icon}`}>
                    <TypeIcon size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-0.5">
                        <CatIcon size={9} />
                        {warning.category === 'actor' ? 'ممثل' : warning.category === 'location' ? 'موقع' : 'استمرارية'}
                      </span>
                    </div>

                    <p className="text-xs font-black text-foreground leading-relaxed">
                      {warning.title}
                    </p>

                    {isExpanded && (
                      <p className="text-[11px] font-bold text-muted-foreground mt-2 leading-relaxed animate-in fade-in duration-200">
                        {warning.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-secondary transition-all text-muted-foreground`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(warning.id);
                      }}
                      title="إخفاء التنبيه"
                      aria-label="إخفاء التنبيه"
                    >
                      <X size={12} />
                    </button>
                    {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {dismissedIds.size > 0 && filteredWarnings.length > 0 && (
        <div className="px-4 py-2 border-t border-border/30 bg-secondary/10 flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground">
            {dismissedIds.size} تنبيه مخفي
          </span>
          <button
            onClick={handleResetAll}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            إعادة الكل
          </button>
        </div>
      )}
    </div>
  );
}
