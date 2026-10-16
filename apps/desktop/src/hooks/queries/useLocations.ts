import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationRepository, LocationImageRepository } from '@scriptflow/database';
import { generateId } from '@scriptflow/core';
import { resolveMediaUrl, unresolveMediaUrl, processAndSaveMedia } from '../../services/mediaStorage';

const locationRepo = new LocationRepository();
const locationImageRepo = new LocationImageRepository();

export const locationKeys = {
  all: ['locations'] as const,
  byScenario: (scenarioId: string) => ['locations', 'scenario', scenarioId] as const,
  detail: (id: string) => ['locations', 'detail', id] as const,
};

/**
 * Fetch all locations for a specific scenario.
 */
export function useLocationsQuery(scenarioId: string | null) {
  return useQuery({
    queryKey: locationKeys.byScenario(scenarioId as string),
    queryFn: async () => {
      const list = await locationRepo.getByScenarioId(scenarioId as any);
      let allLocationImages: any[] = [];
      try {
        allLocationImages = await locationImageRepo.getByScenarioId(scenarioId as string);
      } catch (e) {
        console.warn('Failed to fetch location_images:', e);
      }

      const imagesByLoc: Record<string, any[]> = {};
      for (const img of allLocationImages) {
        if (!imagesByLoc[img.location_id]) imagesByLoc[img.location_id] = [];
        imagesByLoc[img.location_id].push({
          id: img.id,
          url: resolveMediaUrl(img.image_url),
          image_url: resolveMediaUrl(img.image_url),
          is_primary: Boolean(img.is_primary),
          sort_order: img.sort_order || 0
        });
      }

      return list.map((l: any) => {
        const locImages = imagesByLoc[l.id] || [];
        const mainResolvedImage = resolveMediaUrl(l.image);
        const primaryImg = locImages.find(img => img.is_primary)?.url || locImages[0]?.url || mainResolvedImage;

        return {
          ...l,
          image: primaryImg,
          images: locImages.length > 0 
            ? locImages 
            : (mainResolvedImage ? [{ id: 'primary', url: mainResolvedImage, image_url: mainResolvedImage, is_primary: true }] : [])
        };
      });
    },
    enabled: !!scenarioId,
  });
}

/**
 * Fetch a single location by ID.
 */
export function useLocationDetailQuery(locationId: string | null) {
  return useQuery({
    queryKey: locationKeys.detail(locationId as string),
    queryFn: async () => {
      const l: any = await locationRepo.findById(locationId as string);
      if (!l) return null;
      return {
        ...l,
        image: resolveMediaUrl(l.image),
      };
    },
    enabled: !!locationId,
  });
}

/**
 * Helper to save all images for a location into location_images table & disk.
 */
async function saveLocationGallery(scenarioId: string, locationId: string, rawImages: any[]) {
  if (!scenarioId || !locationId) return;
  try {
    // Delete existing records for clean overwrite
    await locationImageRepo.deleteAllBy('location_id', locationId);

    if (!rawImages || rawImages.length === 0) return;

    // Prepare objects for media processing
    const processedItems = rawImages.map((imgItem, idx) => {
      const rawUrl = imgItem.url || imgItem.image_url || (typeof imgItem === 'string' ? imgItem : '');
      const cleanUrl = unresolveMediaUrl(rawUrl, scenarioId);
      return {
        id: imgItem.id && !imgItem.id.startsWith('primary') ? imgItem.id : generateId('lim'),
        location_id: locationId,
        url: cleanUrl,
        is_primary: imgItem.is_primary ? 1 : 0,
        sort_order: idx
      };
    });

    // Save base64 files to disk
    await processAndSaveMedia(scenarioId, processedItems, [
      { field: 'url', prefix: 'locimg' }
    ]);

    // Insert into location_images table
    for (const item of processedItems) {
      if (item.url) {
        await locationImageRepo.insert({
          id: item.id,
          location_id: locationId,
          image_url: item.url,
          is_primary: item.is_primary,
          sort_order: item.sort_order
        });
      }
    }
  } catch (err) {
    console.error('Failed to save location gallery:', err);
  }
}

/**
 * Mutation to create a new location.
 */
export function useCreateLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const cleanData: any = { ...data, id: data.id || generateId('loc') };
      if (cleanData.parent_location_id === '') cleanData.parent_location_id = null;
      const scenarioId = cleanData.scenario_id;

      const rawImages = Array.isArray(cleanData.images) ? [...cleanData.images] : [];
      delete cleanData.images;

      if (scenarioId && cleanData.image) {
        cleanData.image = unresolveMediaUrl(cleanData.image, scenarioId);
        await processAndSaveMedia(scenarioId, cleanData, [
          { field: 'image', prefix: 'location' }
        ]);
      }

      await locationRepo.insert(cleanData as any);

      if (scenarioId) {
        await saveLocationGallery(scenarioId, cleanData.id, rawImages);
      }

      return cleanData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

/**
 * Mutation to bulk create locations.
 */
export function useBulkCreateLocationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<Record<string, any>>) => {
      const records = items.map(data => ({
        ...data,
        id: data.id || generateId('loc'),
      }));
      await locationRepo.bulkInsert(records as any[]);
      return records;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

/**
 * Mutation to update a location.
 */
export function useUpdateLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const cleanData: any = { ...data };
      if (cleanData.parent_location_id === '') cleanData.parent_location_id = null;
      let scenarioId = cleanData.scenario_id;
      if (!scenarioId) {
        const existing: any = await locationRepo.findById(id);
        if (existing) scenarioId = existing.scenario_id;
      }

      const rawImages = Array.isArray(cleanData.images) ? [...cleanData.images] : [];
      delete cleanData.images;

      if (scenarioId && cleanData.image) {
        cleanData.image = unresolveMediaUrl(cleanData.image, scenarioId);
        await processAndSaveMedia(scenarioId, cleanData, [
          { field: 'image', prefix: 'location' }
        ]);
      }

      await locationRepo.update(id, cleanData as any);

      if (scenarioId) {
        await saveLocationGallery(scenarioId, id, rawImages);
      }

      return { id, data: cleanData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}

/**
 * Mutation to soft delete a location.
 */
export function useDeleteLocationMutation(_scenarioId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (locationId: string) => {
      await locationRepo.softDelete(locationId);
      return locationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all });
    },
  });
}
