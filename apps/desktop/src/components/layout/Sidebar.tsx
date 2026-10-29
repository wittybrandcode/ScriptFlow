import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Monitor, Home, LayoutDashboard, Clapperboard, User, Users, 
  MapPin, BarChart3, Tv, LogOut, PanelLeftClose, 
  PanelLeftOpen, TrendingUp, GitBranch, CalendarRange
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useScenarioQuery } from '../../hooks/queries/useScenarios';
import { useEpisodesQuery } from '../../hooks/queries/useEpisodes';
import { ROUTES } from '../../constants/routes';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
  children: React.ReactNode;
  label: string;
  show: boolean;
}

// Tooltip Component
function SidebarTooltip({ children, label, show }: SidebarTooltipProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let targetRight = window.innerWidth - rect.left;
      
      const safetyMargin = 16;
      if (targetRight < safetyMargin) {
        targetRight = safetyMargin;
      } else if (targetRight > window.innerWidth - safetyMargin) {
        targetRight = window.innerWidth - safetyMargin;
      }

      setCoords({
        top: rect.top + rect.height / 2,
        right: targetRight
      });
    }
  }, [visible]);

  if (!show) return <>{children}</>;

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={() => setVisible(true)} 
        onMouseLeave={() => setVisible(false)}
        className="w-full"
      >
        {children}
      </div>
      {visible && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          style={{ top: coords.top, right: coords.right + 12 }}
          className="fixed -translate-y-1/2 px-2.5 py-1.5 bg-foreground text-background text-[11px] font-bold rounded-md shadow-lg whitespace-nowrap z-[9999] animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
        >
          {label}
          <div className="absolute -right-[8px] top-1/2 -translate-y-1/2 border-[4px] border-transparent border-l-foreground" />
        </div>,
        document.body
      )}
    </>
  );
}

interface NavItemProps {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  path: string;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
  badge?: string | number;
}

// Nav Item Component
function NavItem({ icon: Icon, label, active, expanded, onClick, badge }: NavItemProps): React.JSX.Element {
  return (
    <SidebarTooltip label={label} show={!expanded}>
      <button 
        type="button"
        onClick={onClick}
        className={`
          w-full flex items-center gap-2.5 rounded-lg transition-all duration-200 group relative
          ${expanded ? 'px-3 py-2' : 'justify-center p-2'}
          ${active 
            ? 'bg-primary text-white shadow-md shadow-primary/20' 
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }
        `}
      >
        {/* Active indicator bar */}
        {active && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-white rounded-l-full" />
        )}

        <Icon size={17} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
        
        {expanded && (
          <>
            <span className="flex-1 text-right text-xs font-bold truncate">{label}</span>
            {badge && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
              }`}>
                {badge}
              </span>
            )}
          </>
        )}
      </button>
    </SidebarTooltip>
  );
}

interface SmartContextProps {
  context: {
    title?: string;
    stats?: Array<{ label: string; value: string | number }>;
    actions?: Array<{ label: string; icon?: React.ComponentType<{ size?: number }>; onClick: () => void }>;
    badge?: { text: string; color?: 'amber' | 'emerald' | 'rose' | 'primary' };
  } | null;
}

// Smart Context Panel
function SmartContextPanel({ context }: SmartContextProps): React.JSX.Element | null {
  if (!context) return null;
  
  return (
    <div className="px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {context.title && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em] shrink-0">
            {context.title}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {context.stats && context.stats.length > 0 && (
        <div className={`grid gap-1.5 mb-2 ${context.stats.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {context.stats.map((stat, i) => (
            <div key={i} className="bg-secondary/50 rounded-lg p-2 text-center border border-border/50">
              <div className="text-sm font-black text-foreground leading-none">{stat.value}</div>
              <div className="text-[9px] font-bold text-muted-foreground mt-1 truncate">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {context.actions && context.actions.length > 0 && (
        <div className="space-y-1">
          {context.actions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <button 
                type="button"
                key={i}
                onClick={action.onClick}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-all text-xs font-bold border border-primary/10"
              >
                {ActionIcon && <ActionIcon size={13} />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {context.badge && (
        <div className={`mt-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-center border ${
          context.badge.color === 'amber' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
          context.badge.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
          context.badge.color === 'rose' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
          'bg-primary/10 text-primary border-primary/20'
        }`}>
          {context.badge.text}
        </div>
      )}
    </div>
  );
}

export default function Sidebar(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarExpanded, toggleSidebar, sidebarContext } = useUIStore();
  const { activeScenarioId, clearActiveScenario } = useUIStore();
  const { data: activeScenario } = useScenarioQuery(activeScenarioId || '');
  const { data: episodes = [] } = useEpisodesQuery(activeScenarioId || '');

  const expanded = sidebarExpanded;

  const isActive = (path: string) => {
    if (path === ROUTES.HOME) return location.pathname === ROUTES.HOME;
    return location.pathname.startsWith(path);
  };

  const hasEpisodes = episodes.length > 0;

  const projectNavItems = [
    { icon: LayoutDashboard, label: 'لوحة المعلومات', path: ROUTES.DASHBOARD },
    { icon: Clapperboard, label: 'مكتبة المشاهد', path: ROUTES.SCENE_LIBRARY },
    ...(hasEpisodes ? [{ icon: Tv, label: 'الحلقات', path: ROUTES.EPISODES }] : []),
    { icon: User, label: 'الشخصيات', path: ROUTES.CHARACTERS },
    { icon: GitBranch, label: 'شبكة العلاقات', path: ROUTES.RELATIONSHIPS },
    { icon: MapPin, label: 'مكتبة المواقع', path: ROUTES.LOCATIONS },
    { icon: Users, label: 'طاقم العمل', path: ROUTES.CREW },
    { icon: CalendarRange, label: 'جدول التصوير', path: ROUTES.TIMELINE },
    { icon: BarChart3, label: 'تقارير الإنتاج', path: ROUTES.REPORTS },
    { icon: TrendingUp, label: 'التحليلات', path: ROUTES.ANALYTICS },
  ];

  return (
    <aside 
      className={`${
        expanded ? 'w-[190px]' : 'w-[52px]'
      } border-l border-border bg-card flex flex-col transition-all duration-200 ease-in-out relative z-30 shrink-0 h-full`}
    >
      {/* Brand Header */}
      <div className={`h-12 flex items-center shrink-0 border-b border-border/50 ${expanded ? 'px-3 justify-between' : 'justify-center'}`}>
        {expanded ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center shadow-sm shadow-primary/30">
                <Monitor size={14} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-foreground leading-none">SCRIPTFLOW</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.15em] mt-0.5">Enterprise Edition</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
              title="طي القائمة"
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        ) : (
          <button 
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="توسيع القائمة"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-1.5 py-3 space-y-1">
        {expanded && (
          <div className="px-2 mb-1 text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.15em]">
            عام
          </div>
        )}
        <NavItem 
          icon={Home} label="مكتبة المشاريع" path={ROUTES.HOME} 
          active={isActive(ROUTES.HOME)} expanded={expanded}
          onClick={() => navigate(ROUTES.HOME)}
        />

        {activeScenarioId && (
          <>
            {expanded && (
              <div className="px-2 mt-4 mb-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">المشروع</span>
              </div>
            )}
            {!expanded && <div className="h-px bg-border/50 mx-2 my-2" />}
            
            {projectNavItems.map(item => (
              <NavItem 
                key={item.path}
                icon={item.icon} 
                label={item.label} 
                path={item.path}
                active={isActive(item.path)} 
                expanded={expanded}
                onClick={() => navigate(item.path)}
              />
            ))}
          </>
        )}

        {!activeScenarioId && expanded && location.pathname === ROUTES.HOME && (
          <div className="mt-4 mx-1 px-3 py-4 text-center border border-dashed border-border/80 rounded-xl bg-secondary/10">
            <Clapperboard size={20} className="mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-[10px] font-bold text-muted-foreground/60 leading-relaxed">اختر مشروعاً من المكتبة للبدء</p>
          </div>
        )}
      </div>

      {/* Smart Context Panel */}
      {expanded && sidebarContext && (
        <div className="shrink-0 border-t border-border/50 py-2">
          <SmartContextPanel context={sidebarContext} />
        </div>
      )}

      {/* Active Project Footer */}
      {activeScenarioId && activeScenario && (
        <div className={`shrink-0 border-t border-border/50 ${expanded ? 'p-2.5' : 'p-1.5 flex justify-center'}`}>
          {expanded ? (
            <div className="bg-secondary/40 rounded-lg p-2.5 border border-border/50">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">المشروع النشط</p>
              <p className="text-xs font-black text-foreground truncate mb-2">{activeScenario.title}</p>
              <button 
                type="button"
                onClick={() => { clearActiveScenario(); navigate(ROUTES.HOME); }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <LogOut size={11} className="rotate-180" />
                إنهاء الجلسة
              </button>
            </div>
          ) : (
            <SidebarTooltip label={activeScenario.title} show={true}>
              <div 
                className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => navigate(ROUTES.DASHBOARD)}
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
            </SidebarTooltip>
          )}
        </div>
      )}
    </aside>
  );
}
