import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SceneRepository } from '@scriptflow/database';
import { generateId } from '@scriptflow/core';
import { queryKeys } from './index';

const sceneRepo = new SceneRepository();

export const sceneApi = {
  findById: (id: string) => sceneRepo.findById(id),
  getByScenarioId: (scenarioId: string) => sceneRepo.getByScenarioId(scenarioId),
  getByEpisodeId: (episodeId: string) => sceneRepo.getByEpisodeId(episodeId),
};

export const sceneKeys = {
  all: ['scenes'] as const,
  byScenario: (scenarioId: string) => queryKeys.scenes(scenarioId),
  byEpisode: (episodeId: string) => ['scenes', 'episode', episodeId] as const,
  byShootDay: (shootDayId: string) => ['scenes', 'shootDay', shootDayId] as const,
  detail: (id: string) => ['scenes', 'detail', id] as const,
};

/**
 * Fetch all scenes for a scenario.
 */
export function useScenesQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: queryKeys.scenes(scenarioId as string),
    queryFn: () => sceneRepo.getByScenarioId(scenarioId as any),
    enabled: !!scenarioId,
  });
}

/**
 * Fetch scenes by episode.
 */
export function useScenesByEpisodeQuery(episodeId: string | null) {
  return useQuery({
    queryKey: sceneKeys.byEpisode(episodeId as string),
    queryFn: () => sceneRepo.getByEpisodeId(episodeId as string),
    enabled: !!episodeId,
  });
}

/**
 * Fetch a single scene by ID.
 */
export function useSceneDetailQuery(sceneId: string | null) {
  return useQuery({
    queryKey: sceneKeys.detail(sceneId as string),
    queryFn: () => sceneRepo.findById(sceneId as string),
    enabled: !!sceneId,
  });
}

/**
 * Create a new scene.
 */
export function useCreateSceneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const record: any = { ...data, id: data.id || generateId('scn') };
      if ((record.scene_number === undefined || record.scene_number === null) && record.scenario_id) {
        const existing = await sceneRepo.getByScenarioId(record.scenario_id);
        const maxNum = existing.reduce((max, s) => Math.max(max, s.scene_number || 0), 0);
        record.scene_number = maxNum + 1;
      } else if (record.scene_number === undefined || record.scene_number === null) {
        record.scene_number = 1;
      }
      await sceneRepo.insert(record as any);
      if (record.scenario_id) {
        const { updateScenarioPageNumbering } = await import('../../utils/paginationCalculator');
        await updateScenarioPageNumbering(record.scenario_id);
      }
      return record;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
      if (variables.scenario_id) {
        queryClient.invalidateQueries({ queryKey: ['pageNumbering', 'scenario', variables.scenario_id] });
      }
    },
  });
}

/**
 * Update a scene.
 */
export function useUpdateSceneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      await sceneRepo.update(id, data as any);
      const updated = await sceneRepo.findById(id);
      if (updated && updated.scenario_id) {
        const { updateScenarioPageNumbering } = await import('../../utils/paginationCalculator');
        await updateScenarioPageNumbering(updated.scenario_id);
      }
      return { id, data };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
      queryClient.invalidateQueries({ queryKey: sceneKeys.detail(variables.id) });
      const scenarioId = result.data.scenario_id;
      if (scenarioId) {
        queryClient.invalidateQueries({ queryKey: ['pageNumbering', 'scenario', scenarioId] });
      }
    },
  });
}

/**
 * Soft delete a scene.
 */
export function useDeleteSceneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sceneId: string) => {
      const scene = await sceneRepo.findById(sceneId);
      await sceneRepo.softDelete(sceneId);
      if (scene && scene.scenario_id) {
        const { updateScenarioPageNumbering } = await import('../../utils/paginationCalculator');
        await updateScenarioPageNumbering(scene.scenario_id);
      }
      return sceneId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
      queryClient.invalidateQueries({ queryKey: ['pageNumbering'] });
    },
  });
}

/**
 * Reorder scenes.
 */
export function useReorderScenesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sceneIds: string[]) => {
      await sceneRepo.reorderScenes(sceneIds);
      if (sceneIds.length > 0) {
        const firstScene = await sceneRepo.findById(sceneIds[0]);
        if (firstScene && firstScene.scenario_id) {
          const { updateScenarioPageNumbering } = await import('../../utils/paginationCalculator');
          await updateScenarioPageNumbering(firstScene.scenario_id);
        }
      }
      return sceneIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
      queryClient.invalidateQueries({ queryKey: ['pageNumbering'] });
    },
  });
}

// ==========================================
// REMINDERS
// ==========================================

export const reminderKeys = {
  all: ['reminders'] as const,
  byScene: (sceneId: string) => ['reminders', 'scene', sceneId] as const,
  byScenario: (scenarioId: string) => ['reminders', 'scenario', scenarioId] as const,
};

export function useRemindersQuery(sceneId: string | null) {
  return useQuery({
    queryKey: reminderKeys.byScene(sceneId as string),
    queryFn: () => sceneRepo.getReminders(sceneId as string),
    enabled: !!sceneId,
  });
}

export function useAllRemindersQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: reminderKeys.byScenario(scenarioId as string),
    queryFn: () => sceneRepo.getAllReminders(scenarioId as string),
    enabled: !!scenarioId,
  });
}

export function useAddReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sceneId, content }: { sceneId: string; content: string }) => {
      const reminder = await sceneRepo.addReminder(sceneId, content);
      return reminder;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.byScene(variables.sceneId) });
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}

export function useUpdateReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCompleted, content }: { id: string; isCompleted: boolean; content: string }) => {
      await sceneRepo.updateReminder(id, isCompleted, content);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}

export function useDeleteReminderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await sceneRepo.deleteReminder(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
}

import { CloneScene, CloneSceneRequest } from '@scriptflow/application';
import { ScriptBlockRepository } from '@scriptflow/database';

export function useCloneSceneMutation() {
  const queryClient = useQueryClient();
  const blockRepo = new ScriptBlockRepository();
  const cloneSceneOp = new CloneScene(sceneRepo, blockRepo);

  return useMutation({
    mutationFn: async (request: CloneSceneRequest) => {
      const outcome = await cloneSceneOp.execute(request);
      if (!outcome.success) {
        throw new Error(outcome.error?.message || 'Failed to clone scene');
      }
      return outcome.value;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sceneKeys.all });
    },
  });
}

export const fetchSceneDetailApi = (id: string) => sceneRepo.findById(id);