import { z } from 'zod';

/**
 * Schema for scenario validation on import.
 */
export const scenarioSchema = z.object({
  title: z.string().min(1, 'عنوان السيناريو مطلوب'),
  description: z.string().optional(),
  characters: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    color: z.string().optional(),
    age: z.string().optional(),
    role: z.string().optional()
  })).optional(),
  scenes: z.array(z.object({
    scene_number: z.number().int().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    location_type: z.enum(['INT', 'EXT', 'INT/EXT']).optional(),
    location_name: z.string().optional(),
    time_of_day: z.string().optional(),
    dialogues: z.array(z.object({
      character_name: z.string().min(1),
      text: z.string().optional(),
      tone: z.string().optional()
    })).optional()
  })).optional()
});

/**
 * Schema for individual scene validation.
 */
export const sceneSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  location_type: z.enum(['INT', 'EXT', 'INT/EXT']),
  location_name: z.string().min(1, 'اسم المكان مطلوب'),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional()
});

export type ScenarioImportData = z.infer<typeof scenarioSchema>;
export type SceneValidationData = z.infer<typeof sceneSchema>;
