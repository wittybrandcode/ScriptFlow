import { describe, it, expect } from 'vitest';
import { AdvancedMathEngine } from '../src/engine/AdvancedMathEngine';
import { CalculationResult } from '../src/engine/BaseEngine';

describe('AdvancedMathEngine', () => {
  it('should calculate GCD correctly', () => {
    expect(AdvancedMathEngine.gcd(48, 18)).toBe(6n);
    expect(AdvancedMathEngine.gcd(7, 3)).toBe(1n);
    expect(AdvancedMathEngine.gcd(12, 0)).toBe(12n);
  });

  it('should calculate LCM correctly', () => {
    expect(AdvancedMathEngine.lcm(4, 6)).toBe(12n);
    expect(AdvancedMathEngine.lcmArray([2, 3, 4])).toBe(12n);
    expect(AdvancedMathEngine.lcmArray([6, 8, 3])).toBe(24n);
  });

  it('should process BaseOrigin and detect Awl (>1)', () => {
    const result: CalculationResult = {
      baseOrigin: 1,
      shares: {
        'h1': { fraction: '1/2', type: 'FARD' },
        'h2': { fraction: '1/2', type: 'FARD' },
        'h3': { fraction: '1/6', type: 'FARD' } // Exceeds 1 (7/6)
      },
      steps: []
    };

    const total = AdvancedMathEngine.processBaseOrigin(result);
    expect(result.baseOrigin).toBe(6);
    expect(total).toBeGreaterThan(1);
    expect(total).toBeCloseTo(1.1666, 3); // 7/6 = 1.1666...
  });

  it('should apply Awl correctly', () => {
    const result: CalculationResult = {
      baseOrigin: 6,
      shares: {
        'husband': { fraction: '1/2', type: 'FARD' }, // 3/6
        'sister1': { fraction: '1/2', type: 'FARD' }, // 3/6
        'sister2': { fraction: '1/6', type: 'FARD' }  // 1/6
      },
      steps: []
    };

    // total is 7/6. Base is 6. Awl base should be 7.
    const awledResult = AdvancedMathEngine.applyAwl(result);
    expect(awledResult.awlOrigin).toBe(7);
    expect(awledResult.shares['husband'].fraction).toBe('3/7');
    expect(awledResult.shares['sister1'].fraction).toBe('3/7');
    expect(awledResult.shares['sister2'].fraction).toBe('1/7');
    expect(awledResult.shares['husband'].type).toBe('FARD_AWL');
  });
});
