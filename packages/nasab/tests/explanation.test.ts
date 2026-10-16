import { describe, it, expect } from 'vitest';
import { BaseEngine } from '../src/engine/BaseEngine';
import { ExplanationEngine } from '../src/engine/ExplanationEngine';
import { Heir } from '../src/types/Kinship';

describe('ExplanationEngine', () => {
  it('should generate a correct Arabic report for Al-Akdariya', () => {
    const heirs: Heir[] = [
      { id: 'h1', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'gf1', type: 'GRANDFATHER', gender: 'MALE' },
      { id: 's1', type: 'FULL_SISTER', gender: 'FEMALE' }
    ];

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);

    const report = ExplanationEngine.generateReport(heirs, result);

    expect(report.summary).toContain('أصل المسألة: 6');

    const husbandReport = report.heirs.find(h => h.heirId === 'h1');
    expect(husbandReport?.nameAr).toBe('زوج');
    expect(husbandReport?.reason).toContain('بعد العول');

    const grandfatherReport = report.heirs.find(h => h.heirId === 'gf1');
    expect(grandfatherReport?.reason).toContain('(8/27)');
  });

  it('should generate correct blocking reasons', () => {
    const heirs: Heir[] = [
      { id: 'f1', type: 'FATHER', gender: 'MALE' },
      { id: 'gf1', type: 'GRANDFATHER', gender: 'MALE' },
      { id: 'b1', type: 'FULL_BROTHER', gender: 'MALE' }
    ];

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);

    const report = ExplanationEngine.generateReport(heirs, result);

    const gfReport = report.heirs.find(h => h.heirId === 'gf1');
    expect(gfReport?.isBlocked).toBe(true);
    expect(gfReport?.reason).toBe('محجوب لوجود أب');

    const broReport = report.heirs.find(h => h.heirId === 'b1');
    expect(broReport?.isBlocked).toBe(true);
    expect(broReport?.reason).toBe('محجوب لوجود أب');
  });

  it('should generate correct reason for Radd', () => {
    const heirs: Heir[] = [
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' }
    ];
    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);
    const report = ExplanationEngine.generateReport(heirs, result);

    const motherReport = report.heirs.find(h => h.heirId === 'm1');
    expect(motherReport?.reason).toContain('فرضاً ورداً');
  });

  it('should generate correct reason for Distant Kindred', () => {
    const heirs: Heir[] = [
      { id: 'dk1', type: 'DAUGHTER_DAUGHTER', gender: 'FEMALE' }
    ];
    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);
    const report = ExplanationEngine.generateReport(heirs, result);

    const dkReport = report.heirs.find(h => h.heirId === 'dk1');
    expect(dkReport?.nameAr).toBe('بنت بنت');
    expect(dkReport?.reason).toBe('من ذوي الأرحام (بالتنزيل)');
  });
});
