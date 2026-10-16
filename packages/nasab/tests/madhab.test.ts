import { describe, it, expect } from 'vitest';
import { BaseEngine } from '../src/engine/BaseEngine';
import { Heir } from '../src/types/Kinship';

describe('Madhab Strategy Pattern', () => {
  it('should apply Al-Musharraka in Shafii Madhab', () => {
    const heirs: Heir[] = [
      { id: 'h1', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'ub1', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: 'ub2', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: 'fb1', type: 'FULL_BROTHER', gender: 'MALE' }
    ];

    const engine = new BaseEngine('SHAFII');
    const result = engine.solve(heirs);

    // Full Brother gets shared fraction FARD_MUSHARRAKA instead of ASABA
    expect(result.shares['fb1'].type).toBe('FARD_MUSHARRAKA');
    // There are 3 siblings total sharing 1/3, so each gets 1/9.
    // Tashih adjusts origin from 6 to 18, expressing each as 2/18.
    expect(result.shares['fb1'].fraction).toBe('2/18');
    expect(result.shares['ub1'].fraction).toBe('2/18');
  });

  it('should NOT apply Al-Musharraka in Hanafi Madhab', () => {
    const heirs: Heir[] = [
      { id: 'h1', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'ub1', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: 'ub2', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: 'fb1', type: 'FULL_BROTHER', gender: 'MALE' }
    ];

    const engine = new BaseEngine('HANAFI');
    const result = engine.solve(heirs);

    // Full Brother remains ASABA (and since total shares = 1, he gets 0/1)
    expect(result.shares['fb1'].type).toBe('ASABA');
    expect(result.shares['fb1'].fraction).toBe('0/1');
    // Uterines get 1/3 shared (1/6 each)
    expect(result.shares['ub1'].fraction).toBe('1/6');
  });

  it('should block Brothers with Grandfather in Hanafi Madhab', () => {
    const heirs: Heir[] = [
      { id: 'gf1', type: 'GRANDFATHER', gender: 'MALE' },
      { id: 'fb1', type: 'FULL_BROTHER', gender: 'MALE' }
    ];

    const engine = new BaseEngine('HANAFI');
    const result = engine.solve(heirs);

    expect(heirs.find(h => h.id === 'fb1')?.isBlocked).toBe(true);
    expect(result.shares['fb1']).toBeUndefined();
    expect(result.shares['gf1'].type).toBe('ASABA');
  });
});
