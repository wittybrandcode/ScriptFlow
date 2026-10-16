import { describe, it, expect } from 'vitest';
import { BaseEngine } from '../src/engine/BaseEngine';
import { Heir } from '../src/types/Kinship';
import { ExplanationEngine } from '../src/engine/ExplanationEngine';

describe('Advanced & Strict Fiqh Cases', () => {

  it('should correctly calculate Al-Minbariya (المنبرية) with Awl to 27', () => {
    // Wife, 2 Daughters, Father, Mother
    const heirs: Heir[] = [
      { id: 'w1', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd2', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'f1', type: 'FATHER', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' }
    ];

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);
    const report = ExplanationEngine.generateReport(heirs, result);

    expect(result.baseOrigin).toBe(24);
    expect(result.awlOrigin).toBe(27);
    
    // Wife gets 3/27 (from 1/8)
    expect(result.shares['w1'].fraction).toBe('3/27');
    // Each Daughter gets 8/27 (from 2/3 divided by 2 = 8/24)
    expect(result.shares['d1'].fraction).toBe('8/27');
    expect(result.shares['d2'].fraction).toBe('8/27');
    // Father gets 4/27 (from 1/6)
    expect(result.shares['f1'].fraction).toBe('4/27');
    // Mother gets 4/27 (from 1/6)
    expect(result.shares['m1'].fraction).toBe('4/27');

    expect(report.summary).toContain('عالت المسألة إلى: 27');
  });

  it('should correctly calculate Al-Mubahala (المباهلة) with Awl to 8', () => {
    // Husband, Mother, Full Sister
    const heirs: Heir[] = [
      { id: 'h1', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 's1', type: 'FULL_SISTER', gender: 'FEMALE' }
    ];

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);

    expect(result.baseOrigin).toBe(6);
    expect(result.awlOrigin).toBe(8);

    expect(result.shares['h1'].fraction).toBe('3/8'); // From 1/2
    expect(result.shares['s1'].fraction).toBe('3/8'); // From 1/2
    expect(result.shares['m1'].fraction).toBe('2/8'); // From 1/3
  });

  it('should correctly calculate Al-Gharawain (الغراوين / العُمَريَّتان) - Mother gets 1/3 of Remainder', () => {
    // Husband, Mother, Father
    const heirs: Heir[] = [
      { id: 'h1', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'f1', type: 'FATHER', gender: 'MALE' }
    ];

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);

    // Husband gets 1/2. Remainder = 1/2.
    // Mother gets 1/3 of Remainder = 1/6.
    // Father gets Asaba = 1/3.
    expect(result.shares['h1'].fraction).toBe('1/2');
    expect(result.shares['m1'].fraction).toBe('1/6');
    expect(result.shares['f1'].fraction).toBe('1/3');
    expect(result.shares['f1'].type).toBe('ASABA');
  });

  it('should correctly distribute Asaba weights (3 Sons, 2 Daughters)', () => {
    const heirs: Heir[] = [
      { id: 's1', type: 'SON', gender: 'MALE' },
      { id: 's2', type: 'SON', gender: 'MALE' },
      { id: 's3', type: 'SON', gender: 'MALE' },
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd2', type: 'DAUGHTER', gender: 'FEMALE' }
    ];

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);

    // Total weights = (3 sons * 2) + (2 daughters * 1) = 8
    // Remainder is 1. So each son gets 2/8, each daughter gets 1/8.
    // Tashih adjusts origin to 8.
    expect(result.tashihOrigin).toBe(8);
    expect(result.shares['s1'].fraction).toBe('2/8');
    expect(result.shares['s3'].fraction).toBe('2/8');
    expect(result.shares['d1'].fraction).toBe('1/8');
    expect(result.shares['d2'].fraction).toBe('1/8');
  });

  it('should process extreme blocking chain', () => {
    // Father blocks Grandfather and Brothers.
    // Son blocks Siblings and Uncles.
    const heirs: Heir[] = [
      { id: 'f1', type: 'FATHER', gender: 'MALE' },
      { id: 'gf1', type: 'GRANDFATHER', gender: 'MALE' },
      { id: 's1', type: 'SON', gender: 'MALE' },
      { id: 'b1', type: 'FULL_BROTHER', gender: 'MALE' },
      { id: 'u1', type: 'FULL_UNCLE', gender: 'MALE' }
    ];

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);

    expect(heirs.find(h => h.id === 'gf1')?.isBlocked).toBe(true);
    expect(heirs.find(h => h.id === 'b1')?.isBlocked).toBe(true);
    expect(heirs.find(h => h.id === 'u1')?.isBlocked).toBe(true);

    expect(result.shares['f1'].fraction).toBe('1/6'); // Father gets 1/6 due to Son
    expect(result.shares['f1'].type).toBe('FARD');
    expect(result.shares['s1'].type).toBe('ASABA'); // Son gets Asaba
  });

});
