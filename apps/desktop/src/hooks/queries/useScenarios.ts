import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScenarioRepository } from '@scriptflow/database';
import { GenerateStatistics } from '@scriptflow/application';
import { generateId } from '@scriptflow/core';
import { resolveMediaUrl, processAndSaveMedia, unresolveMediaUrl } from '../../services/mediaStorage';

const scenarioRepo = new ScenarioRepository();
const generateStats = new GenerateStatistics();

export const scenarioKeys = {
  all: ['scenarios'] as const,
  detail: (id: string) => ['scenarios', 'detail', id] as const,
  stats: (id: string, episodeId?: string) => ['scenarios', 'stats', id, episodeId] as const,
};

export function useScenariosQuery() {
  return useQuery({
    queryKey: scenarioKeys.all,
    queryFn: async () => {
      const list = await scenarioRepo.getAllWithMetadata();
      return list.map(s => ({
        ...s,
        cover_image: resolveMediaUrl(s.cover_image),
        cover_video: resolveMediaUrl(s.cover_video),
      }));
    },
  });
}

export function useScenarioQuery(id: string | null) {
  return useQuery({
    queryKey: scenarioKeys.detail(id as string),
    queryFn: async () => {
      const s = await scenarioRepo.getByIdWithMetadata(id as string);
      if (!s) return null;
      return {
        ...s,
        cover_image: resolveMediaUrl(s.cover_image),
        cover_video: resolveMediaUrl(s.cover_video),
      };
    },
    enabled: !!id,
  });
}

export function useScenarioStatsQuery(id: string | null, episodeId?: string) {
  return useQuery({
    queryKey: scenarioKeys.stats(id as string, episodeId),
    queryFn: () => generateStats.execute(id as string, episodeId),
    enabled: !!id,
  });
}

export function useGlobalStatsQuery() {
  return useQuery({
    queryKey: ['scenarios', 'global-stats'],
    queryFn: () => generateStats.executeGlobalStats(),
  });
}

export function useCreateScenarioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const record = { id: generateId('prj'), title };
      await scenarioRepo.insert(record as any);
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
    },
  });
}

export function useUpdateScenarioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const cleanData = { ...data };
      if (cleanData.cover_image) cleanData.cover_image = unresolveMediaUrl(cleanData.cover_image, id);
      if (cleanData.cover_video) cleanData.cover_video = unresolveMediaUrl(cleanData.cover_video, id);
      await processAndSaveMedia(id, cleanData, [
        { field: 'cover_image', prefix: 'cover' },
        { field: 'cover_video', prefix: 'video' }
      ]);
      await scenarioRepo.update(id, cleanData as any);
      return { id, data: cleanData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(data.id) });
    },
  });
}

export function useDeleteScenarioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await scenarioRepo.softDelete(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: scenarioKeys.all });
      queryClient.invalidateQueries({ queryKey: scenarioKeys.detail(id) });
    },
  });
}
