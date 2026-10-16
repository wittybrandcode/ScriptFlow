import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShootDayRepository } from '@scriptflow/database';
import { ManageTimeline } from '@scriptflow/application';
import { generateId } from '@scriptflow/core';
import { queryKeys } from './index';

const shootDayRepo = new ShootDayRepository();
const manageTimeline = new ManageTimeline();

export const timelineKeys = {
  all: ['timeline'] as const,
  scenario: (scenarioId: string) => queryKeys.timeline(scenarioId),
};

export function useTimelineQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: queryKeys.timeline(scenarioId!),
    queryFn: () => manageTimeline.getTimelineData(scenarioId!),
    enabled: !!scenarioId,
  });
}

export function useCreateShootDayMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scenarioId, data }: { scenarioId: string; data: any }) => {
      const record = {
        id: generateId('shd'),
        scenario_id: scenarioId,
        title: data.title || '',
        shoot_date: data.shoot_date || '',
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        status: data.status || 'DRAFT',
        notes: data.notes || '',
        day_type: data.day_type || 'SHOOT',
        primary_location_id: data.primary_location_id || null,
        weather_forecast: data.weather_forecast || '',
        call_time: data.call_time || '',
        wrap_time: data.wrap_time || '',
        estimated_cost: data.estimated_cost || 0,
        production_phase: data.production_phase || 'PRODUCTION',
        week_number: data.week_number || 1,
      };
      await shootDayRepo.insert(record as any);
      return { scenarioId, record };
    },
    onSuccess: ({ scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.scenario(scenarioId) });
    },
  });
}

export function useUpdateShootDayMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scenarioId, dayId, data }: { scenarioId: string; dayId: string; data: any }) => {
      await shootDayRepo.update(dayId, data);
      return { scenarioId };
    },
    onSuccess: ({ scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.scenario(scenarioId) });
    },
  });
}

export function useDeleteShootDayMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scenarioId, dayId }: { scenarioId: string; dayId: string }) => {
      await manageTimeline.deleteWithUnassign(dayId);
      return { scenarioId };
    },
    onSuccess: ({ scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: timelineKeys.scenario(scenarioId) });
    },
  });
}

export function useAssignSceneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scenarioId, sceneId, destDayId }: { scenarioId: string; sceneId: string; destDayId: string | null }) => {
      await manageTimeline.assignScene(sceneId, destDayId);
      return { scenarioId };
    },
    onSuccess: ({ scenarioId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeline(scenarioId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.scenarioStats(scenarioId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.characterStats(scenarioId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.episodes(scenarioId) });
    },
  });
}
