import { describe, it, expect } from 'vitest';
import { BaseEngine } from '../src/engine/BaseEngine';
import { Heir } from '../src/types/Kinship';

describe('BaseEngine Radd & Asaba Edge Cases', () => {
  const engine = new BaseEngine();

  it('should NOT apply Radd when Father is present as FARD_PLUS_ASABA (BUG-03)', () => {
    // Father + Daughter. Father gets Fard 1/6 + Asaba. No Radd.
    const heirs: Heir[] = [
      { id: 'father', type: 'FATHER', gender: 'MALE' },
      { id: 'daughter', type: 'DAUGHTER', gender: 'FEMALE' }
    ];

    const result = engine.solve(heirs);

    // Daughter gets 1/2
    // Father gets 1/6 (FARD_PLUS_ASABA) + remainder (1 - 1/2 - 1/6 = 1/3)
    // Total Father share = 1/6 + 1/3 = 1/2
    // No Radd applied because Father is Asaba.
    expect(result.shares['daughter'].fraction).toBe('1/2');
    expect(result.shares['father'].fraction).toBe('1/2');
  });

  it('should apply Radd when Mother and Daughter exist without any Asaba', () => {
    // Mother (1/6) + Daughter (1/2 = 3/6)
    // Sum = 4/6 < 1. Remainder = 2/6.
    // Ratio is Mother:Daughter = (1/6):(3/6) = 1:3.
    // Mother gets: 1/6 + (2/6 * 1/4) = 4/24 + 2/24 = 6/24 = 1/4
    // Daughter gets: 3/6 + (2/6 * 3/4) = 12/24 + 6/24 = 18/24 = 3/4
    const heirs: Heir[] = [
      { id: 'mother', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'daughter', type: 'DAUGHTER', gender: 'FEMALE' }
    ];

    const result = engine.solve(heirs);

    expect(result.shares['mother'].fraction).toBe('1/4');
    expect(result.shares['daughter'].fraction).toBe('3/4');
  });

  it('should apply Radd and exclude Spouses from receiving any returned shares', () => {
    // Wife + Mother + Daughter
    // Wife gets 1/8. Mother gets 1/6. Daughter gets 1/2.
    // Sum of shares = 1/8 + 1/6 + 1/2 = 3/24 + 4/24 + 12/24 = 19/24.
    // Remainder = 5/24.
    // Ratio of Radd-eligible heirs: Mother:Daughter = (1/6):(1/2) = 1:3.
    // Mother total fraction: 1/6 + (5/24 * 1/4) = 1/6 + 5/96 = 16/96 + 5/96 = 21/96 = 7/32.
    // Daughter total fraction: 1/2 + (5/24 * 3/4) = 1/2 + 15/96 = 48/96 + 15/96 = 63/96 = 21/32.
    // Wife total fraction: 1/8 = 4/32.
    // Sum = 7/32 + 21/32 + 4/32 = 32/32 = 1.
    const heirs: Heir[] = [
      { id: 'wife', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'mother', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'daughter', type: 'DAUGHTER', gender: 'FEMALE' }
    ];

    const result = engine.solve(heirs);

    expect(result.shares['wife'].fraction).toBe('4/32');
    expect(result.shares['mother'].fraction).toBe('7/32');
    expect(result.shares['daughter'].fraction).toBe('21/32');
  });
});
