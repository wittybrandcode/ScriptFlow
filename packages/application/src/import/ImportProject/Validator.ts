import { z } from 'zod';

export const ImportProjectSchema = z.object({
  scenario: z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    cover_image: z.string().optional(),
    cover_video: z.string().optional(),
    status: z.string().optional(),
    genre: z.string().optional(),
    notes: z.string().optional(),
  }),
  episodes: z.array(z.any()).optional(),
  scenes: z.array(z.any()).optional(),
  characters: z.array(z.any()).optional(),
  locations: z.array(z.any()).optional(),
  crew: z.array(z.any()).optional(),
  shoot_days: z.array(z.any()).optional(),
  scene_characters: z.array(z.any()).optional(),
  character_relationships: z.array(z.any()).optional(),
  location_images: z.array(z.any()).optional(),
  crew_assignments: z.array(z.any()).optional(),
  production_tasks: z.array(z.any()).optional(),
});

export const validateImportPayload = (payload: unknown) => {
  return ImportProjectSchema.parse(payload);
};
