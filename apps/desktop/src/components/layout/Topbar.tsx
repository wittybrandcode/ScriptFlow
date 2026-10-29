import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  CheckCircle2,
  Save,
  AlertCircle
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useScenarioQuery } from '../../hooks/queries/useScenarios';

export interface TopBarAction {
  id?: string | number;
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onClick?: (e?: any) => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  disabled?: boolean;
  title?: string;
}

interface TopBarButtonProps {
  action: TopBarAction;
}

// Unified Button Component for TopBar
const TopBarButton: React.FC<TopBarButtonProps> = ({ action }) => {
  const { label, icon: Icon, onClick, variant = 'ghost', disabled, title } = action;
  
  const baseClasses = "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    outline: "border border-border bg-background hover:bg-secondary text-foreground",
    ghost: "hover:bg-secondary text-muted-foreground hover:text-foreground",
    danger: "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
    success: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
  };

  if (onClick) {
    return (
      <button 
        type="button"
        onClick={onClick} 
        className={`${baseClasses} ${variants[variant] || variants.ghost}`}
        disabled={disabled}
        title={title || label}
      >
        {Icon && <Icon size={14} className={label ? "shrink-0" : ""} />}
        {label && <span>{label}</span>}
      </button>
    );
  }

  return (
    <div 
      className={`${baseClasses} ${variants[variant] || variants.ghost}`}
      title={title || label}
    >
      {Icon && <Icon size={14} className={label ? "shrink-0" : ""} />}
      {label && <span>{label}</span>}
    </div>
  );
};

export interface BreadcrumbItem {
  label: string;
  path: string;
  active?: boolean;
}

export default function Topbar(): React.JSX.Element {
  const location = useLocation();
  const topBarConfig = useUIStore(s => s.topBarConfig);
  const saveStatus = useUIStore(s => s.saveStatus);
  const activeScenarioId = useUIStore(s => s.activeScenarioId);
  const { data: activeScenario } = useScenarioQuery(activeScenarioId || '');

  // Breadcrumbs Generator (Smart Fallback)
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (topBarConfig?.breadcrumbs) return topBarConfig.breadcrumbs;

    const path = location.pathname;
    const parts: BreadcrumbItem[] = [
      { label: 'SCRIPTFLOW', path: '/', active: path === '/' }
    ];

    if (activeScenarioId) {
      parts.push({ 
        label: activeScenario?.title || 'المشروع', 
        path: '/insights', 
        active: path === '/insights' 
      });
      
      if (topBarConfig?.pageName) {
         parts.push({ label: topBarConfig.pageName, path: location.pathname, active: true });
      } else {
         if (path.includes('/scenarios')) {
           parts.push({ label: 'مكتبة المشاهد', path: '/scenarios', active: true });
         } else if (path.includes('/characters')) {
           parts.push({ label: 'الشخصيات', path: '/characters', active: true });
         } else if (path.includes('/scene/')) {
           parts.push({ label: 'محرر المشاهد', path: location.pathname, active: true });
         } else if (path.includes('/locations')) {
           parts.push({ label: 'مواقع التصوير', path: '/locations', active: true });
         } else if (path.includes('/episodes')) {
           parts.push({ label: 'الحلقات', path: '/episodes', active: true });
         } else if (path.includes('/crew')) {
           parts.push({ label: 'طاقم العمل', path: '/crew', active: true });
         } else if (path.includes('/reports')) {
           parts.push({ label: 'التقارير', path: '/reports', active: true });
         }
      }
    }

    return parts;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-10 border-b border-border bg-card/90 flex items-center justify-between px-3 z-20 shrink-0 shadow-sm">
      
      {/* Left: Smart Breadcrumbs + Dynamic Actions */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-1 overflow-hidden shrink-0">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.path}-${idx}`}>
              {idx > 0 && <ChevronLeft size={12} className="text-muted-foreground/50 flex-shrink-0" />}
              <Link 
                to={crumb.path || '#'}
                className={`text-xs transition-all truncate ${
                  crumb.active 
                    ? 'text-foreground font-black tracking-wide' 
                    : 'text-muted-foreground hover:text-primary font-bold'
                }`}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Left Actions */}
        {topBarConfig?.actions && Array.isArray(topBarConfig.actions) && topBarConfig.actions.length > 0 && (
          <div className="flex items-center gap-1.5 animate-in fade-in duration-200 overflow-x-auto scrollbar-none max-w-[50vw]">
             <div className="h-4 w-[1px] bg-border/50 mx-1 shrink-0" />
             {topBarConfig.actions.map((action: TopBarAction, idx: number) => (
               <TopBarButton key={action.id || idx} action={action} />
             ))}
          </div>
        )}
      </div>

      {/* Right: Global Actions + Dynamic Right Actions */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Right Actions */}
        {topBarConfig?.rightActions && Array.isArray(topBarConfig.rightActions) && topBarConfig.rightActions.length > 0 && (
          <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
             {topBarConfig.rightActions.map((action: TopBarAction, idx: number) => (
               <TopBarButton key={action.id || idx} action={action} />
             ))}
             <div className="h-4 w-[1px] bg-border mx-1" />
          </div>
        )}

        {/* Save Status Indicator */}
        {saveStatus && saveStatus !== 'idle' && (
           <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/30 border border-border/50 text-[10px] font-bold shrink-0">
              {saveStatus === 'saving' && <><Save size={12} className="animate-pulse text-amber-500" /><span className="text-muted-foreground hidden sm:inline">جاري الحفظ...</span></>}
              {saveStatus === 'saved' && <><CheckCircle2 size={12} className="text-emerald-500/80" /></>}
              {saveStatus === 'error' && <><AlertCircle size={12} className="text-destructive" /><span className="text-destructive hidden sm:inline">خطأ بالحفظ</span></>}
           </div>
        )}
      </div>
    </header>
  );
}
