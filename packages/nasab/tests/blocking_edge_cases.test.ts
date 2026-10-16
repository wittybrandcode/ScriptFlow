import { describe, it, expect } from 'vitest';
import { BlockingEngine } from '../src/engine/BlockingEngine';
import { Heir } from '../src/types/Kinship';

describe('BlockingEngine Edge Cases', () => {
  it('should block Uterine siblings when a Daughter exists (BUG-01)', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: '2', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: '3', type: 'UTERINE_SISTER', gender: 'FEMALE' }
    ];

    const result = BlockingEngine.applyBlocking(heirs);
    expect(result.find(h => h.type === 'DAUGHTER')?.isBlocked).toBeFalsy();
    expect(result.find(h => h.type === 'UTERINE_BROTHER')?.isBlocked).toBe(true);
    expect(result.find(h => h.type === 'UTERINE_SISTER')?.isBlocked).toBe(true);
  });

  it('should block Uterine siblings when a Granddaughter exists (BUG-01)', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'DAUGHTER_OF_SON', gender: 'FEMALE' },
      { id: '2', type: 'UTERINE_BROTHER', gender: 'MALE' }
    ];

    const result = BlockingEngine.applyBlocking(heirs);
    expect(result.find(h => h.type === 'DAUGHTER_OF_SON')?.isBlocked).toBeFalsy();
    expect(result.find(h => h.type === 'UTERINE_BROTHER')?.isBlocked).toBe(true);
  });

  it('should block Uterine siblings when a Grandfather is present and Father is absent (BUG-02)', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'GRANDFATHER', gender: 'MALE' },
      { id: '2', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: '3', type: 'UTERINE_SISTER', gender: 'FEMALE' }
    ];

    const result = BlockingEngine.applyBlocking(heirs);
    expect(result.find(h => h.type === 'GRANDFATHER')?.isBlocked).toBeFalsy();
    expect(result.find(h => h.type === 'UTERINE_BROTHER')?.isBlocked).toBe(true);
    expect(result.find(h => h.type === 'UTERINE_SISTER')?.isBlocked).toBe(true);
  });

  it('should block Uterine siblings by Father when both Father and Grandfather exist', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'FATHER', gender: 'MALE' },
      { id: '2', type: 'GRANDFATHER', gender: 'MALE' },
      { id: '3', type: 'UTERINE_BROTHER', gender: 'MALE' }
    ];

    const result = BlockingEngine.applyBlocking(heirs);
    const uterine = result.find(h => h.type === 'UTERINE_BROTHER');
    expect(uterine?.isBlocked).toBe(true);
    expect(uterine?.blockedBy).toContain('1'); // Father is the blocker (by priority)
  });
});
