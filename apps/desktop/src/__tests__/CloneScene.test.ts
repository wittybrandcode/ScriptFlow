import { describe, it, expect } from 'vitest';

function cloneScene(originalScene: any, cloneType: 'DUPLICATE' | 'TRANSLATION' | 'REVISION') {
  if (!originalScene || !originalScene.id) {
    throw new Error('Invalid original scene');
  }

  return {
    ...originalScene,
    id: `cloned_${Math.random().toString(36).substring(2, 9)}`,
    source_scene_id: originalScene.id,
    clone_type: cloneType,
    scene_number: cloneType === 'DUPLICATE' ? `${originalScene.scene_number}_A` : originalScene.scene_number,
    version: (originalScene.version || 1) + 1,
    title: cloneType === 'TRANSLATION' ? `${originalScene.title} (نسخة مترجمة)` : originalScene.title,
    created_at: new Date().toISOString(),
  };
}

describe('Scene Cloning & Versioning Engine', () => {
  const sampleScene = {
    id: 'sc_orig_100',
    scenario_id: 'scen_01',
    scene_number: 5,
    title: 'المشهد الاصلي',
    version: 1,
    blocks: [
      { id: 'b1', type: 'ACTION', content: 'افتتاحية' }
    ]
  };

  it('should create a duplicate scene with a suffix scene number and increment version', () => {
    const cloned = cloneScene(sampleScene, 'DUPLICATE');
    expect(cloned.source_scene_id).toBe('sc_orig_100');
    expect(cloned.clone_type).toBe('DUPLICATE');
    expect(cloned.scene_number).toBe('5_A');
    expect(cloned.version).toBe(2);
  });

  it('should create a translation clone preserving scene number but adding translation tag to title', () => {
    const cloned = cloneScene(sampleScene, 'TRANSLATION');
    expect(cloned.scene_number).toBe(5);
    expect(cloned.title).toContain('(نسخة مترجمة)');
    expect(cloned.clone_type).toBe('TRANSLATION');
  });

  it('should throw an error when attempting to clone an invalid scene', () => {
    expect(() => cloneScene(null as any, 'DUPLICATE')).toThrow();
  });
});
