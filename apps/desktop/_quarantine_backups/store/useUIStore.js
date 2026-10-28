import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      
      sidebarExpanded: true,
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (val) => set({ sidebarExpanded: val }),
      
      // Sidebar Smart Context (Registration Pattern)
      sidebarContext: null,
      setSidebarContext: (ctx) => set({ sidebarContext: ctx }),
      clearSidebarContext: () => set({ sidebarContext: null }),

      topBarConfig: null,
      setTopBarConfig: (config) => set({ topBarConfig: config }),
      
      pinnedSceneId: null,
      setPinnedSceneId: (id) => set({ pinnedSceneId: id }),
      
      saveStatus: 'saved',
      setSaveStatus: (status) => set({ saveStatus: status }),
      
      loading: false,
      setLoading: (status) => set({ loading: status }),
      
      activeScenarioId: null,
      setActiveScenarioId: (id) => set({ activeScenarioId: id }),
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
