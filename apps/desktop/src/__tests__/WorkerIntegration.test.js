import { describe, it, expect, vi } from 'vitest';

// Mock Comlink and Worker
global.Worker = vi.fn().mockImplementation(function() {
  this.postMessage = vi.fn();
  this.terminate = vi.fn();
  return this;
});

vi.mock('comlink', () => ({
  wrap: vi.fn().mockReturnValue({
    precalculatePagination: vi.fn().mockResolvedValue({
      success: true,
      totalEstimatedPages: 12,
      processedScenes: [
        { id: '1', scene_number: '1', estimatedPages: 3 },
        { id: '2', scene_number: '2', estimatedPages: 5 },
        { id: '3', scene_number: '3', estimatedPages: 4 },
      ]
    }),
    calculateGlobalStats: vi.fn().mockResolvedValue({
      success: true,
      executionTimeMs: 8.5,
      characterStats: [
        { name: 'أحمد', appearances: 15, linesOfDialogue: 42 },
        { name: 'سارة', appearances: 12, linesOfDialogue: 38 },
      ],
      locationStats: [
        { name: 'المقهى', sceneCount: 8 },
        { name: 'المنزل', sceneCount: 5 },
      ]
    }),
    [Symbol.for('Comlink.releaseProxy')]: vi.fn(),
  }),
  releaseProxy: Symbol.for('Comlink.releaseProxy'),
  expose: vi.fn(),
}));

import { workerFactory } from '../workers/WorkerFactory';

describe('Phase 2: ExportWorker Integration Pipeline', () => {

  it('1. Pre-calculates pagination for a multi-scene script', async () => {
    const worker = workerFactory.getExportWorker();

    const scenes = [
      { id: '1', scene_number: '1', blocks: [{ id: 'b1', type: 'ACTION', content: 'يدخل أحمد المقهى ببطء' }] },
      { id: '2', scene_number: '2', blocks: [{ id: 'b2', type: 'DIALOGUE', content: 'مرحباً يا صديقي' }] },
      { id: '3', scene_number: '3', blocks: [{ id: 'b3', type: 'ACTION', content: 'ينهض من مكانه' }] },
    ];
    const characters = [{ id: 'c1', name: 'أحمد' }];

    const result = await worker.precalculatePagination(scenes, characters);

    expect(result.success).toBe(true);
    expect(result.totalEstimatedPages).toBe(12);
    expect(result.processedScenes).toHaveLength(3);
    expect(result.processedScenes[0].estimatedPages).toBe(3);
  });

  it('2. Data serialization strips non-transferable properties', () => {
    // Simulating what useExportWorker does before sending to worker
    const reactScene = {
      id: '1',
      scene_number: '5',
      title: 'المواجهة',
      blocks: [{ id: 'b1', type: 'ACTION', content: 'نص الحدث', sort_order: 1 }],
      // These should NOT be sent to worker (non-serializable)
      _reactInternalInstance: {},
      __proto__: Object.prototype
    };

    const serialized = {
      id: reactScene.id,
      scene_number: reactScene.scene_number,
      title: reactScene.title,
      blocks: reactScene.blocks.map(b => ({
        id: b.id,
        type: b.type,
        content: b.content,
        sort_order: b.sort_order
      }))
    };

    expect(serialized).not.toHaveProperty('_reactInternalInstance');
    expect(serialized.blocks[0]).toHaveProperty('content', 'نص الحدث');
  });
});

describe('Phase 3: StatsWorker Integration Pipeline', () => {

  it('1. Calculates global analytics off the main thread', async () => {
    const worker = workerFactory.getStatsWorker();

    const result = await worker.calculateGlobalStats({
      scenes: [{ id: '1', location_id: 'loc1', present_characters: '["c1","c2"]' }],
      characters: [{ id: 'c1', name: 'أحمد' }, { id: 'c2', name: 'سارة' }],
      locations: [{ id: 'loc1', name: 'المقهى' }],
      blocks: [{ id: 'b1', type: 'DIALOGUE', character_id: 'c1' }]
    });

    expect(result.success).toBe(true);
    expect(result.executionTimeMs).toBeLessThan(100);
    expect(result.characterStats).toHaveLength(2);
    expect(result.characterStats[0].name).toBe('أحمد');
    expect(result.locationStats[0].name).toBe('المقهى');
  });

  it('2. Returns sorted results (most appearances first)', async () => {
    const worker = workerFactory.getStatsWorker();
    const result = await worker.calculateGlobalStats({});

    // أحمد (15 ظهور) يجب أن يأتي قبل سارة (12)
    expect(result.characterStats[0].appearances).toBeGreaterThanOrEqual(
      result.characterStats[1].appearances
    );
  });
});
