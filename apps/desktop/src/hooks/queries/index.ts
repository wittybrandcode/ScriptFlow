/**
 * Barrel export for all React Query hooks.
 * 
 * Usage in components:
 *   import { useLocationsQuery, useCreateCharacterMutation } from '@/hooks/queries';
 */
export * from './useLocations';
export * from './useCharacters';
export * from './useCrew';
export * from './useScenes';
export * from './useProductionTasks';

export * from './useEpisodes';
export * from './useTones';
export * from './useSnapshots';
export * from './useScenarios';
export * from './useTimeline';
export * from './usePageNumbering';
export * from './useExport';

export const queryKeys = {
  scenes: (scenarioId: string) => ['scenes', 'scenario', scenarioId] as const,
  characters: (scenarioId: string) => ['characters', 'scenario', scenarioId] as const,
  timeline: (scenarioId: string) => ['timeline', scenarioId] as const,
  scenarioStats: (scenarioId: string) => ['scenarios', 'stats', scenarioId] as const,
  characterStats: (scenarioId: string) => ['characters', 'stats', scenarioId] as const,
  episodes: (scenarioId: string) => ['episodes', 'scenario', scenarioId] as const,
};
