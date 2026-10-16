import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EpisodeRepository } from '@scriptflow/database';
import { generateId } from '@scriptflow/core';

const episodeRepo = new EpisodeRepository();

export const episodeKeys = {
  all: ['episodes'] as const,
  byScenario: (scenarioId: string) => ['episodes', 'scenario', scenarioId] as const,
  detail: (id: string) => ['episodes', 'detail', id] as const,
  stats: (scenarioId: string) => ['episodes', 'stats', scenarioId] as const,
};

export function useEpisodeStatsQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: episodeKeys.stats(scenarioId as string),
    queryFn: () => episodeRepo.getStats(scenarioId as string),
    enabled: !!scenarioId,
  });
}

/**
 * Fetch all episodes for a scenario.
 */
export function useEpisodesQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: episodeKeys.byScenario(scenarioId as string),
    queryFn: () => episodeRepo.getByScenarioId(scenarioId as any),
    enabled: !!scenarioId,
  });
}

/**
 * Create a new episode.
 */
export function useCreateEpisodeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const record = { ...data, id: data.id || generateId('epi') };
      await episodeRepo.insert(record as any);
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: episodeKeys.all });
    },
  });
}

/**
 * Update an episode.
 */
export function useUpdateEpisodeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      await episodeRepo.update(id, data as any);
      return { id, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: episodeKeys.all });
    },
  });
}

/**
 * Delete an episode (hard delete).
 */
export function useDeleteEpisodeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (episodeId: string) => {
      await episodeRepo.delete(episodeId);
      return episodeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: episodeKeys.all });
    },
  });
}
