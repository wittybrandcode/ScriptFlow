import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | string;

export interface TopBarConfig {
  title?: string;
  subtitle?: string;
  actions?: any;
  showBack?: boolean;
  onBack?: () => void;
  [key: string]: any;
}

export interface UIState {
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (val: boolean) => void;
  
  // Sidebar Smart Context (Registration Pattern)
  sidebarContext: any;
  setSidebarContext: (ctx: any) => void;
  clearSidebarContext: () => void;

  topBarConfig: TopBarConfig | null;
  setTopBarConfig: (config: TopBarConfig | null) => void;
  
  pinnedSceneId: string | null;
  setPinnedSceneId: (id: string | number | null) => void;
  
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  
  loading: boolean;
  setLoading: (status: boolean) => void;
  
  activeScenarioId: string | null;
  setActiveScenarioId: (id: string | number | null) => void;
  clearActiveScenario: () => void;

  showDebugGrid: boolean;
  toggleDebugGrid: () => void;
  
  showDebugMargins: boolean;
  toggleDebugMargins: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      
      sidebarExpanded: true,
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (val) => set({ sidebarExpanded: val }),
      
      sidebarContext: null,
      setSidebarContext: (ctx) => set({ sidebarContext: ctx }),
      clearSidebarContext: () => set({ sidebarContext: null }),

      topBarConfig: null,
      setTopBarConfig: (config) => set({ topBarConfig: config }),
      
      pinnedSceneId: null,
      setPinnedSceneId: (id) => set({ pinnedSceneId: id ? String(id) : null }),
      
      saveStatus: 'saved',
      setSaveStatus: (status) => set({ saveStatus: status }),
      
      loading: false,
      setLoading: (status) => set({ loading: status }),
      
      activeScenarioId: null,
      setActiveScenarioId: (id) => set({ activeScenarioId: id ? String(id) : null }),
      clearActiveScenario: () => set({ activeScenarioId: null }),

      showDebugGrid: false,
      toggleDebugGrid: () => set((state) => ({ showDebugGrid: !state.showDebugGrid })),
      
      showDebugMargins: false,
      toggleDebugMargins: () => set((state) => ({ showDebugMargins: !state.showDebugMargins })),
    }),
    {
      name: 'scriptflow-ui-storage',
      partialize: (state) => ({ 
        sidebarExpanded: state.sidebarExpanded,
        pinnedSceneId: state.pinnedSceneId,
        activeScenarioId: state.activeScenarioId,
        showDebugGrid: state.showDebugGrid,
        showDebugMargins: state.showDebugMargins,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
    }
  )
);
