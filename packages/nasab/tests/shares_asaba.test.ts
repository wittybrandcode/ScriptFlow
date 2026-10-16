import { describe, it, expect } from 'vitest';
import { SharesEngine } from '../src/engine/SharesEngine';
import { AsabaEngine } from '../src/engine/AsabaEngine';
import { Heir } from '../src/types/Kinship';
import { CalculationResult } from '../src/engine/BaseEngine';

describe('Phase 5: Fard & Asaba Engines', () => {
  it('should correctly assign Fard and Asaba for Wife, Mother, and Son', () => {
    const heirs: Heir[] = [
      { id: 'wife1', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'mom', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'son', type: 'SON', gender: 'MALE' }
    ];

    let result: CalculationResult = { baseOrigin: 1, shares: {}, steps: [] };
    result = SharesEngine.assignFixedShares(heirs, result);
    result = AsabaEngine.assignAsaba(heirs, result);

    // Wife: 1/8 due to Son
    expect(result.shares['wife1'].fraction).toBe('1/8');
    expect(result.shares['wife1'].type).toBe('FARD_SHARED');

    // Mother: 1/6 due to Son
    expect(result.shares['mom'].fraction).toBe('1/6');
    expect(result.shares['mom'].type).toBe('FARD');

    // Son: Asaba
    expect(result.shares['son'].type).toBe('ASABA');
    expect((result.shares['son'] as any).asabaType).toBe('ASABA_BIN_NAFS'); 
  });

  it('should handle Al-Akdariya basic share assignment', () => {
    // Husband, Mother, Grandfather, Full Sister
    const heirs: Heir[] = [
      { id: 'h1', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'gf1', type: 'GRANDFATHER', gender: 'MALE' },
      { id: 's1', type: 'FULL_SISTER', gender: 'FEMALE' }
    ];

    let result: CalculationResult = { baseOrigin: 1, shares: {}, steps: [] };
    result = SharesEngine.assignFixedShares(heirs, result);
    result = AsabaEngine.assignAsaba(heirs, result);

    expect(result.shares['h1'].fraction).toBe('1/2');
    expect(result.shares['m1'].fraction).toBe('1/3');
    
    // Grandfather gets 1/6 + Asaba ? Actually, without descendants he gets Asaba normally unless it's a specific madhab. 
    // In our current simple SharesEngine: Grandfather is not assigned Fard without male descendant, so he gets ASABA.
    expect(result.shares['gf1'].type).toBe('ASABA');
    
    // Sister gets 1/2
    expect(result.shares['s1'].fraction).toBe('1/2');
  });
});
