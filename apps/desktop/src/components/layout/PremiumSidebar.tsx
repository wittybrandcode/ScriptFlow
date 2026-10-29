import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';
import { useScenarioQuery } from '../../hooks/queries/useScenarios';
import { 
  Film, Users, MapPin, BarChart2, Calendar, GitBranch, 
  Home, LayoutDashboard, Tv, FileText, LogOut, ChevronRight,
  Trash2, Lock, Settings
} from 'lucide-react';

export interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const PremiumSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useUIStore();
  const { activeScenarioId, clearActiveScenario } = useUIStore();
  const { data: activeScenario } = useScenarioQuery(activeScenarioId || '');

  const navItems: NavItemConfig[] = [
    { name: 'الرئيسية', path: '/', icon: Home },
  ];

  if (activeScenarioId) {
    navItems.push(
      { name: 'لوحة المعلومات', path: '/insights', icon: LayoutDashboard },
      { name: 'محرر السيناريو', path: '/scenarios', icon: Film },
      { name: 'الحلقات', path: '/episodes', icon: Tv },
      { name: 'شخصيات العمل', path: '/characters', icon: Users },
      { name: 'شجرة العلاقات', path: '/relationships', icon: GitBranch },
      { name: 'مواقع التصوير', path: '/locations', icon: MapPin },
      { name: 'طاقم العمل', path: '/crew', icon: Users },
      { name: 'جدول الإنتاج', path: '/timeline', icon: Calendar },
      { name: 'تقارير الإنتاج', path: '/reports', icon: FileText },
      { name: 'لوحة التحليلات', path: '/analytics', icon: BarChart2 }
    );
  }

  return (
    <aside 
      className={`relative h-full border-l border-neutral-900 bg-black transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col ${
        sidebarExpanded ? 'w-64' : 'w-16'
      }`}
    >
      <div className={`flex flex-col h-full transition-all duration-300 ${sidebarExpanded ? 'p-6' : 'py-6 px-2'}`}>
        
        {/* App Logo */}
        <div className={`flex items-center mb-8 px-2 ${sidebarExpanded ? 'justify-between' : 'justify-center'}`}>
          {sidebarExpanded ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-white flex items-center justify-center shrink-0 shadow-md">
                  <Film className="h-5 w-5 text-black" />
                </div>
                <span className="text-xl font-bold tracking-wider font-outfit text-white">
                  SCRIPTFLOW
                </span>
              </div>
              <button 
                type="button"
                onClick={toggleSidebar}
                className="text-neutral-400 hover:text-white transition-colors duration-200 p-1.5 hover:bg-neutral-900 rounded-lg shrink-0"
                title="طي القائمة"
              >
                <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <button 
              type="button"
              onClick={toggleSidebar}
              className="h-10 w-10 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-colors duration-200 shadow-sm"
              title="توسيع القائمة"
            >
              <Film className="h-5 w-5 text-white" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-0 pl-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={!sidebarExpanded ? item.name : undefined}
              className={({ isActive }) => `
                flex items-center rounded-lg transition-all duration-200 group
                ${sidebarExpanded ? 'gap-4 px-4 py-3' : 'justify-center p-3'}
                ${isActive 
                  ? 'bg-neutral-900 text-white font-medium shadow-sm border border-neutral-800/80' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/50'
                }
              `}
            >
              <item.icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
              {sidebarExpanded && <span className="text-sm truncate">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer Action Buttons */}
        <div className={`mt-auto border-t border-neutral-900 pt-4 flex ${sidebarExpanded ? 'flex-row gap-2 px-2' : 'flex-col gap-2 items-center px-0'}`}>
          
          <NavLink
            to="/settings"
            title="الإعدادات"
            className={({ isActive }) => `
              flex items-center justify-center rounded-xl transition-all duration-200 h-11 flex-1
              ${isActive 
                ? 'bg-neutral-900 text-white font-medium border border-neutral-800/80' 
                : 'bg-neutral-900/30 hover:bg-neutral-800 border border-neutral-800/50 text-neutral-400 hover:text-white'
              }
            `}
          >
            <Settings size={20} className="transition-transform hover:rotate-90 duration-500" />
          </NavLink>

          <NavLink
            to="/trash"
            title="سلة المحذوفات"
            className={({ isActive }) => `
              flex items-center justify-center rounded-xl transition-all duration-200 h-11 flex-1
              ${isActive 
                ? 'bg-neutral-900 text-white font-medium border border-neutral-800/80' 
                : 'bg-neutral-900/30 hover:bg-neutral-800 border border-neutral-800/50 text-neutral-400 hover:text-white hover:text-rose-400'
              }
            `}
          >
            <Trash2 size={20} className="transition-transform hover:-translate-y-0.5 duration-300" />
          </NavLink>

          <button 
            type="button"
            onClick={() => { if(activeScenarioId && activeScenario) { clearActiveScenario(); navigate('/'); } }}
            disabled={!(activeScenarioId && activeScenario)}
            className={`flex items-center justify-center rounded-xl transition-all duration-300 h-11 flex-1
              ${(activeScenarioId && activeScenario) 
                ? 'bg-neutral-900/30 hover:bg-neutral-800 border border-neutral-800/50 text-neutral-400 hover:text-white cursor-pointer' 
                : 'bg-transparent border border-neutral-900 text-neutral-700/50 cursor-not-allowed'
              }`}
            title={(activeScenarioId && activeScenario) ? "إغلاق المشروع والعودة للمكتبة" : "لا يوجد مشروع مفتوح"}
          >
            <LogOut size={20} className="rotate-180" />
          </button>

          <button 
            type="button"
            onClick={() => {
              localStorage.removeItem('scriptflow_auth_token');
              localStorage.removeItem('scriptflow_unlocked');
              window.location.reload();
            }}
            className="flex items-center justify-center rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all h-11 flex-1"
            title="قفل التطبيق"
          >
            <Lock size={20} />
          </button>
        </div>

      </div>
    </aside>
  );
};

export default PremiumSidebar;
