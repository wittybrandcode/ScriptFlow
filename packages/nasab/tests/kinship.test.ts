import { describe, it, expect } from 'vitest';
import { KinshipEngine } from '../src/engine/KinshipEngine';
import { Heir } from '../src/types/Kinship';

describe('KinshipEngine', () => {
  it('should resolve dual kinship by keeping the higher weight relation', () => {
    // A person (id: 'person1') is both a FULL_BROTHER and an AGNATIC_UNCLE to the deceased.
    const dualKinship: Heir[] = [
      { id: 'person1', type: 'AGNATIC_UNCLE', gender: 'MALE' },
      { id: 'person1', type: 'FULL_BROTHER', gender: 'MALE' },
      { id: 'person2', type: 'MOTHER', gender: 'FEMALE' }
    ];

    const resolved = KinshipEngine.resolveDualKinship(dualKinship);
    
    expect(resolved).toHaveLength(2);
    
    const p1 = resolved.find(h => h.id === 'person1');
    expect(p1).toBeDefined();
    // FULL_BROTHER (weight 75) > AGNATIC_UNCLE (weight 55)
    expect(p1?.type).toBe('FULL_BROTHER');
  });

  it('should not affect unique heirs', () => {
    const heirs: Heir[] = [
      { id: '1', type: 'SON', gender: 'MALE' },
      { id: '2', type: 'DAUGHTER', gender: 'FEMALE' }
    ];

    const resolved = KinshipEngine.resolveDualKinship(heirs);
    expect(resolved).toHaveLength(2);
    expect(resolved.find(h => h.id === '1')?.type).toBe('SON');
    expect(resolved.find(h => h.id === '2')?.type).toBe('DAUGHTER');
  });
});
