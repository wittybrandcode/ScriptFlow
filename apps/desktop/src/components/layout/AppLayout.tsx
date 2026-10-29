import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useScenarioStatsQuery } from '../../hooks/queries/useScenarios';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import PremiumSidebar from './PremiumSidebar';
import Topbar from './Topbar';

export interface AppLayoutProps {
  children?: React.ReactNode;
}

/**
 * AppLayout - Stable architectural shell for ScriptFlow Enterprise.
 * Coordinates sidebar, topbar, toast alerts, and content area.
 */
export default function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  const { theme } = useTheme();
  const saveStatus = useUIStore(s => s.saveStatus);
  const hasHydrated = useUIStore(s => s.hasHydrated);
  const activeScenarioId = useUIStore(s => s.activeScenarioId);
  
  const { toasts } = useToast();
  const currentToast = toasts[toasts.length - 1];

  const { data: stats } = useScenarioStatsQuery(activeScenarioId || '');

  if (!hasHydrated) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-background ${theme}`}>
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-primary animate-pulse" />
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Syncing Environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden ${theme}`}>
      
      {/* 1: Luxury Sidebar */}
      <PremiumSidebar />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* 2: Interactive Topbar */}
        <Topbar />

        {/* Dynamic Route Viewport */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar bg-secondary/10">
           {children}
        </main>

        {/* 3: System Status Footer */}
        <footer className="h-6 border-t border-border bg-card/90 flex items-center justify-between px-3 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.1em] z-10 shrink-0">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                 <span className={saveStatus === 'saved' ? 'text-emerald-500/80' : 'text-amber-500/80'}>
                    {saveStatus === 'saved' ? 'Data Synchronized' : 'Syncing Data...'}
                 </span>
              </div>
              <div className="hidden sm:block text-[8px] opacity-70">Build 3.0.2 ENT</div>
           </div>

           {/* Dynamic Action Notifications */}
           <div className="flex-1 flex justify-center items-center overflow-hidden">
             {currentToast && (
                <div key={currentToast.id} className={`flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300
                   ${currentToast.type === 'success' ? 'text-emerald-500' : 
                     currentToast.type === 'error' ? 'text-rose-500' : 'text-blue-500'}`}
                >
                   {currentToast.type === 'success' && <CheckCircle2 size={13} className="shrink-0" />}
                   {currentToast.type === 'error' && <AlertCircle size={13} className="shrink-0" />}
                   {(currentToast.type === 'info' || !currentToast.type) && <Info size={13} className="shrink-0" />}
                   
                   <span className="text-[11px] tracking-normal font-black truncate max-w-[400px]">
                      {currentToast.message}
                   </span>
                </div>
             )}
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                 <span>{stats?.totalDialogues || 0} Dialogues</span>
                 <span>{stats?.totalScenes || 0} Scenes</span>
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
}
