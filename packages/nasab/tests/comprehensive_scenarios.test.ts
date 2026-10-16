import { describe, it, expect } from 'vitest';
import { BaseEngine } from '../src/engine/BaseEngine';
import { Heir } from '../src/types/Kinship';

describe('Comprehensive Fiqh Scenarios (17+ Cases)', () => {

  const solve = (heirs: Heir[]) => new BaseEngine('COMMON').solve(heirs);

  it('1. Only Husband (gets 1/2)', () => {
    const heirs: Heir[] = [{ id: '1', type: 'SPOUSE_MALE', gender: 'MALE' }];
    const res = solve(heirs);
    expect(res.shares['1'].fraction).toBe('1/2');
  });

  it('2. Only Wife (gets 1/4)', () => {
    const heirs: Heir[] = [{ id: '1', type: 'SPOUSE_FEMALE', gender: 'FEMALE' }];
    const res = solve(heirs);
    expect(res.shares['1'].fraction).toBe('1/4');
  });

  it('3. 10 Daughters share 2/3 equally, then Radd distributes remainder', () => {
    const heirs: Heir[] = Array.from({length: 10}, (_, i) => ({ id: `${i}`, type: 'DAUGHTER', gender: 'FEMALE' }));
    const res = solve(heirs);
    // 10 daughters: each gets 1/15 (2/3 ÷ 10). Radd distributes the remaining 1/3,
    // giving each an additional 1/30, total = 1/10 each
    expect(res.shares['0'].fraction).toBe('1/10');
  });

  it('4. 1 Daughter + 10 Daughter_Of_Son with Radd', () => {
    const heirs: Heir[] = [
      { id: 'd', type: 'DAUGHTER', gender: 'FEMALE' },
      ...Array.from({length: 10}, (_, i) => ({ id: `ds${i}`, type: 'DAUGHTER_OF_SON', gender: 'FEMALE' } as Heir))
    ];
    const res = solve(heirs);
    // Daughter: 1/2 + Radd share of remainder
    // Daughter_of_Son (each): 1/60 + Radd share
    // After Radd: daughter = 3/4, each DoS = 1/40
    expect(res.shares['d'].fraction).toBe('3/4');
    expect(res.shares['ds0'].fraction).toBe('1/40');
  });

  it('5. 4 Wives + 1 Son', () => {
    const heirs: Heir[] = [
      { id: 's', type: 'SON', gender: 'MALE' },
      ...Array.from({length: 4}, (_, i) => ({ id: `w${i}`, type: 'SPOUSE_FEMALE', gender: 'FEMALE' } as Heir))
    ];
    const res = solve(heirs);
    expect(res.shares['s'].type).toBe('ASABA');
    expect(res.shares['w0'].fraction).toBe('1/32'); // 1/8 / 4 = 1/32
  });

  it('6. 4 Wives + 1 Father', () => {
    const heirs: Heir[] = [
      { id: 'f', type: 'FATHER', gender: 'MALE' },
      ...Array.from({length: 4}, (_, i) => ({ id: `w${i}`, type: 'SPOUSE_FEMALE', gender: 'FEMALE' } as Heir))
    ];
    const res = solve(heirs);
    expect(res.shares['w0'].fraction).toBe('1/16'); // 1/4 / 4 = 1/16
    expect(res.shares['f'].type).toBe('ASABA');
    expect(res.shares['f'].fraction).toBe('3/4'); // remainder
  });

  it('7. 2 Full Sisters block Paternal Sister, Radd distributes remainder', () => {
    const heirs: Heir[] = [
      { id: 'fs1', type: 'FULL_SISTER', gender: 'FEMALE' },
      { id: 'fs2', type: 'FULL_SISTER', gender: 'FEMALE' },
      { id: 'ps', type: 'AGNATIC_SISTER', gender: 'FEMALE' }
    ];
    const res = solve(heirs);
    // Each full sister gets 1/3 (2/3 ÷ 2). No other fard heirs, so Radd applies.
    // After Radd: 1/3 + 1/6 = 1/2 each. Agnatic sister blocked.
    expect(res.shares['fs1'].fraction).toBe('1/2');
    expect(res.shares['ps']).toBeUndefined();
  });

  it('8. 2 Daughters block Daughter_Of_Son (tested via BlockingEngine)', () => {
    const heirs: Heir[] = [
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd2', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'ds', type: 'DAUGHTER_OF_SON', gender: 'FEMALE' }
    ];
    solve(heirs);
    expect(heirs.find(h => h.id === 'ds')?.isBlocked).toBe(true);
  });

  it('9. Father + Mother + 1 Daughter', () => {
    const heirs: Heir[] = [
      { id: 'f', type: 'FATHER', gender: 'MALE' },
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'd', type: 'DAUGHTER', gender: 'FEMALE' }
    ];
    const res = solve(heirs);
    expect(res.shares['d'].fraction).toBe('1/2');
    expect(res.shares['m'].fraction).toBe('1/6');
    // Father gets 1/6 + Asaba = 1/6 + 1/6 = 2/6 = 1/3
    expect(res.shares['f'].type).toBe('FARD_PLUS_ASABA');
    expect(res.shares['f'].fraction).toBe('1/3'); 
  });

  it('10. Father + Mother + 1 Son', () => {
    const heirs: Heir[] = [
      { id: 'f', type: 'FATHER', gender: 'MALE' },
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 's', type: 'SON', gender: 'MALE' }
    ];
    const res = solve(heirs);
    expect(res.shares['f'].fraction).toBe('1/6');
    expect(res.shares['m'].fraction).toBe('1/6');
    expect(res.shares['s'].type).toBe('ASABA');
    expect(res.shares['s'].fraction).toBe('2/3'); // 4/6
  });

  it('11. Husband + Mother + 1 Full Brother', () => {
    const heirs: Heir[] = [
      { id: 'h', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'fb', type: 'FULL_BROTHER', gender: 'MALE' }
    ];
    const res = solve(heirs);
    expect(res.shares['h'].fraction).toBe('1/2');
    expect(res.shares['m'].fraction).toBe('1/3'); // because < 2 siblings
    expect(res.shares['fb'].type).toBe('ASABA');
    expect(res.shares['fb'].fraction).toBe('1/6');
  });

  it('12. Husband + Mother + 2 Full Brothers', () => {
    const heirs: Heir[] = [
      { id: 'h', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'fb1', type: 'FULL_BROTHER', gender: 'MALE' },
      { id: 'fb2', type: 'FULL_BROTHER', gender: 'MALE' }
    ];
    const res = solve(heirs);
    expect(res.shares['h'].fraction).toBe('1/2');
    expect(res.shares['m'].fraction).toBe('1/6'); // because >= 2 siblings
    expect(res.shares['fb1'].type).toBe('ASABA');
    expect(res.shares['fb1'].fraction).toBe('1/6'); // remainder is 1/3, divided by 2
  });

  it('13. 1 Paternal Sister + 1 Maternal Sister with Radd', () => {
    const heirs: Heir[] = [
      { id: 'ps', type: 'AGNATIC_SISTER', gender: 'FEMALE' },
      { id: 'ms', type: 'UTERINE_SISTER', gender: 'FEMALE' }
    ];
    const res = solve(heirs);
    // Paternal Sister: 1/2, Maternal Sister: 1/6. Total: 2/3. Radd applies.
    // After Radd: PS = 3/4, MS = 1/4
    expect(res.shares['ps'].fraction).toBe('3/4');
    expect(res.shares['ms'].fraction).toBe('1/4');
  });

  it('14. Full Uncle gets Asaba if no closer relatives', () => {
    const heirs: Heir[] = [
      { id: 'w', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'u', type: 'FULL_UNCLE', gender: 'MALE' }
    ];
    const res = solve(heirs);
    expect(res.shares['w'].fraction).toBe('1/4');
    expect(res.shares['u'].type).toBe('ASABA');
    expect(res.shares['u'].fraction).toBe('3/4');
  });

  it('15. Agnatic Uncle gets Asaba if no Full Uncle', () => {
    const heirs: Heir[] = [
      { id: 'au', type: 'AGNATIC_UNCLE', gender: 'MALE' }
    ];
    const res = solve(heirs);
    expect(res.shares['au'].type).toBe('ASABA');
    expect(res.shares['au'].fraction).toBe('1');
  });

  it('16. Husband + 2 Uterine Brothers + 2 Paternal Sisters', () => {
    const heirs: Heir[] = [
      { id: 'h', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'ub1', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: 'ub2', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: 'ps1', type: 'AGNATIC_SISTER', gender: 'FEMALE' },
      { id: 'ps2', type: 'AGNATIC_SISTER', gender: 'FEMALE' }
    ];
    const res = solve(heirs);
    // Husband: 1/2
    // Uterines: 1/3
    // Pat Sisters: 2/3
    // Total: 3/6 + 2/6 + 4/6 = 9/6 -> Awl to 9.
    expect(res.awlOrigin).toBe(9);
    expect(res.shares['h'].fraction).toBe('3/9');
    expect(res.shares['ub1'].fraction).toBe('1/9');
    expect(res.shares['ps1'].fraction).toBe('2/9');
  });

  it('17. Grandmothers share 1/6', () => {
    const heirs: Heir[] = [
      { id: 'gm1', type: 'GRANDMOTHER_M', gender: 'FEMALE' },
      { id: 'gm2', type: 'GRANDMOTHER_P', gender: 'FEMALE' },
      { id: 'u', type: 'FULL_UNCLE', gender: 'MALE' }
    ];
    const res = solve(heirs);
    expect(res.shares['gm1'].fraction).toBe('1/12'); // 1/6 / 2
    expect(res.shares['gm2'].fraction).toBe('1/12');
    expect(res.shares['u'].type).toBe('ASABA');
    expect(res.shares['u'].fraction).toBe('5/6');
  });

  it('18. Grandmother_M is blocked by Mother, Mother gets all via Radd', () => {
    const heirs: Heir[] = [
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'gm', type: 'GRANDMOTHER_M', gender: 'FEMALE' }
    ];
    const res = solve(heirs);
    expect(heirs.find(h => h.id === 'gm')?.isBlocked).toBe(true);
    // Mother gets 1/3 + remainder via Radd = 1
    expect(res.shares['m'].fraction).toBe('1');
  });

});
