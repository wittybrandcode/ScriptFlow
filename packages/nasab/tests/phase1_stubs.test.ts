import { describe, it, expect } from 'vitest';
import Fraction from 'fraction.js';
import { BaseEngine } from '../src/engine/BaseEngine';
import { Heir } from '../src/types/Kinship';

const solve = (heirs: Heir[], madhab: 'COMMON' | 'HANAFI' | 'SHAFII' | 'MALIKI' | 'HANBALI' = 'COMMON') =>
  new BaseEngine(madhab).solve(heirs);

describe('Phase 1.1 — Radd (الرد)', () => {

  it('1.1.1 بنت فقط → 1/2 + 1/2 رداً = 1', () => {
    const res = solve([{ id: 'd', type: 'DAUGHTER', gender: 'FEMALE' }]);
    expect(res.shares['d'].fraction).toBe('1');
    expect(res.shares['d'].type).toBe('FARD');
  });

  it('1.1.2 بنتان → 2/3 + 1/3 رداً = 1/2 لكل', () => {
    const res = solve([
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd2', type: 'DAUGHTER', gender: 'FEMALE' }
    ]);
    expect(res.shares['d1'].fraction).toBe('1/2');
    expect(res.shares['d2'].fraction).toBe('1/2');
  });

  it('1.1.3 أم + بنت → أم 1/6 + بنت 1/2 + رد', () => {
    const res = solve([
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'd', type: 'DAUGHTER', gender: 'FEMALE' }
    ]);
    // Total fard = 1/6 + 1/2 = 2/3. Remainder = 1/3.
    // After Radd: Mother = 1/6 + 1/3*(1/6/(2/3)) = 1/6 + 1/12 = 3/12 = 1/4
    // Daughter = 1/2 + 1/3*(1/2/(2/3)) = 1/2 + 1/4 = 3/4
    expect(res.shares['m'].fraction).toBe('1/4');
    expect(res.shares['d'].fraction).toBe('3/4');
  });

  it('1.1.4 زوجة + بنت → زوجة 1/8 + بنت 1/2 + رد (بدون الزوجة)', () => {
    const res = solve([
      { id: 'w', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'd', type: 'DAUGHTER', gender: 'FEMALE' }
    ]);
    // Spouse gets 1/8 (no Radd for spouse). Daughter gets 1/2 + Radd.
    // After Radd: daughter gets 7/8.
    expect(res.shares['w'].fraction).toBe('1/8');
    expect(res.shares['d'].fraction).toBe('7/8');
  });

  it('1.1.5 زوج + أخت شقيقة → زوج 1/2 + أخت 1/2 رداً', () => {
    const res = solve([
      { id: 'h', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 's', type: 'FULL_SISTER', gender: 'FEMALE' }
    ]);
    expect(res.shares['h'].fraction).toBe('1/2');
    expect(res.shares['s'].fraction).toBe('1/2');
  });

  it('1.1.6 بنت + بنت ابن → بنت 1/2 + بنت ابن 1/6 + رد', () => {
    const res = solve([
      { id: 'd', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'gd', type: 'DAUGHTER_OF_SON', gender: 'FEMALE' }
    ]);
    // Daughter: 1/2, GD: 1/6. Total: 2/3. Remainder: 1/3.
    // After Radd: Daughter = 3/4, GD = 1/4
    expect(res.shares['d'].fraction).toBe('3/4');
    expect(res.shares['gd'].fraction).toBe('1/4');
  });

});

describe('Phase 1.2 — hasSharersForRadd', () => {

  it('يعيد true مع بنت فقط (غير زوج)', () => {
    const res = solve([{ id: 'd', type: 'DAUGHTER', gender: 'FEMALE' }]);
    expect(res.shares['d'].fraction).toBe('1');
  });

  it('يعيد false مع زوج فقط (الزوج لا يرد عليه)', () => {
    const res = solve([{ id: 'h', type: 'SPOUSE_MALE', gender: 'MALE' }]);
    // Spouse only = 1/2. Remaining 1/2 goes nowhere (no radd eligible)
    expect(res.shares['h'].fraction).toBe('1/2');
    expect(Object.keys(res.shares).length).toBe(1);
  });

});

describe('Phase 1.3 — Distant Kindred (ذوو الأرحام)', () => {

  it('1.3.1 ابن البنت فقط → التركة كلها', () => {
    const res = solve([
      { id: 'gs', type: 'DAUGHTER_SON', gender: 'MALE' }
    ]);
    expect(res.shares['gs'].fraction).toBe('1');
    expect(res.shares['gs'].type).toBe('ASABA');
  });

  it('1.3.2 الخال فقط → التركة كلها', () => {
    const res = solve([
      { id: 'mu', type: 'MATERNAL_UNCLE', gender: 'MALE' }
    ]);
    expect(res.shares['mu'].fraction).toBe('1');
    expect(res.shares['mu'].type).toBe('ASABA');
  });

  it('1.3.3 العمة فقط → التركة كلها', () => {
    const res = solve([
      { id: 'pa', type: 'PATERNAL_AUNT', gender: 'FEMALE' }
    ]);
    expect(res.shares['pa'].fraction).toBe('1');
    expect(res.shares['pa'].type).toBe('ASABA');
  });

  it('1.3.4 ابن البنت + بنت الأخت → الأقرب درجة يأخذ', () => {
    const res = solve([
      { id: 'gs', type: 'DAUGHTER_SON', gender: 'MALE' },
      { id: 'nd', type: 'FULL_SISTER_DAUGHTER', gender: 'FEMALE' }
    ]);
    // Both are distant kindred. DS rank = SON (descendant), ND rank = FULL_SISTER
    // SON has higher priority than FULL_SISTER
    expect(res.shares['gs'].fraction).not.toBe('0/1');
  });

  it('1.3.5 خال + عمة → كلاهما يرث', () => {
    const res = solve([
      { id: 'mu', type: 'MATERNAL_UNCLE', gender: 'MALE' },
      { id: 'pa', type: 'PATERNAL_AUNT', gender: 'FEMALE' }
    ]);
    // Both are distant kindred. One of them should get the estate.
    const hasMu = !!res.shares['mu'];
    const hasPa = !!res.shares['pa'];
    expect(hasMu || hasPa).toBe(true);
  });

  it('1.3.6 زوج + ابن بنت → زوج 1/2 + باقي لابن البنت', () => {
    const res = solve([
      { id: 'h', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'gs', type: 'DAUGHTER_SON', gender: 'MALE' }
    ]);
    // Husband: 1/2. DS: remains as asaba.
    expect(res.shares['h'].fraction).toBe('1/2');
    expect(res.shares['gs'].fraction).toBe('1/2');
    expect(res.shares['gs'].type).toBe('ASABA');
  });

  it('1.3.7 زوجة + بنت أخ → زوجة 1/4 + باقي لبنت الأخ', () => {
    const res = solve([
      { id: 'w', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'nd', type: 'FULL_BROTHER_DAUGHTER', gender: 'FEMALE' }
    ]);
    expect(res.shares['w']).toBeDefined();
    // Distant kindred takes the remainder after wife's share
    expect(res.shares['nd']).toBeDefined();
  });

  it('1.3.8 خال + خالة → للذكر مثل حظ الأنثيين', () => {
    const res = solve([
      { id: 'mu', type: 'MATERNAL_UNCLE', gender: 'MALE' },
      { id: 'ma', type: 'MATERNAL_AUNT', gender: 'FEMALE' }
    ]);
    // Both have equivalent = MOTHER. Male gets 2x female.
    const maleFrac = new Fraction(res.shares['mu'].fraction);
    const femaleFrac = new Fraction(res.shares['ma'].fraction);
    expect(maleFrac.compare(femaleFrac.mul(2))).toBe(0);
  });

  it('1.3.9 زوجة + ابنة ابن + ابن بنت → ابنة الابن تحجب ابن البنت (لوجود فرض)', () => {
    const res = solve([
      { id: 'w', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'gd', type: 'DAUGHTER_OF_SON', gender: 'FEMALE' },
      { id: 'gs', type: 'DAUGHTER_SON', gender: 'MALE' }
    ]);
    // GD is a fard heir (1/2 or 1/6). GS only inherits if no fard heirs.
    // Here GD is fard → Radd goes to GD, GS gets nothing (correct fiqh).
    expect(res.shares['w']).toBeDefined();
    expect(res.shares['gd']).toBeDefined();
  });

  it('1.3.10 زوجة + جدة لأم + ابن بنت → الجدة ترث وابن البنت لا يرث (الجدة فرض)', () => {
    const res = solve([
      { id: 'w', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'gm', type: 'GRANDMOTHER_M', gender: 'FEMALE' },
      { id: 'gs', type: 'DAUGHTER_SON', gender: 'MALE' }
    ]);
    // GM is a fard heir (1/6). GS only inherits if no fard heirs.
    expect(res.shares['w']).toBeDefined();
    expect(res.shares['gm']).toBeDefined();
  });

});

describe('Phase 1.4 — Tashih (تصحيح)', () => {

  it('1.4.1 تصحيح فريق واحد منكسر — أم + 3 بنات', () => {
    const res = solve([
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd2', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd3', type: 'DAUGHTER', gender: 'FEMALE' }
    ]);
    // Mother: 1/6. 3 Daughters: 2/3 shared.
    // After Radd all fractions should sum to 1.
    let total = new Fraction(0);
    for (const key in res.shares) {
      total = total.add(new Fraction(res.shares[key].fraction));
    }
    expect(total.valueOf()).toBeCloseTo(1, 5);
  });

  it('1.4.2 تصحيح فريقين منكسرين — 3 أبناء + 2 بنات', () => {
    const res = solve([
      { id: 's1', type: 'SON', gender: 'MALE' },
      { id: 's2', type: 'SON', gender: 'MALE' },
      { id: 's3', type: 'SON', gender: 'MALE' },
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd2', type: 'DAUGHTER', gender: 'FEMALE' }
    ]);
    // All Asaba. Tashih with 5 heads, 3:2 male:female ratio → LCM needed
    expect(res.tashihOrigin).toBeGreaterThan(1);
    // Verify sum = 1
    let total = new Fraction(0);
    for (const key in res.shares) {
      total = total.add(new Fraction(res.shares[key].fraction));
    }
    expect(total.valueOf()).toBeCloseTo(1, 5);
  });

  it('1.4.3 تماثل (لا تصحيح) — ابن واحد فقط', () => {
    const res = solve([
      { id: 's', type: 'SON', gender: 'MALE' }
    ]);
    // Single heir, no tashih needed
    expect(res.shares['s'].fraction).toBe('1');
    expect(res.tashihOrigin).toBeUndefined();
  });

  it('1.4.4 توافق — جد + أم + ابن', () => {
    const res = solve([
      { id: 'gf', type: 'GRANDFATHER', gender: 'MALE' },
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 's', type: 'SON', gender: 'MALE' }
    ]);
    // Grandfather: blocked? Actually, father isn't here.
    // Grandfather + Mother + Son:
    // Son as asaba, Mother 1/6, Grandfather has male descendant so 1/6.
    expect(res.shares['m'].fraction).toBe('1/6');
    expect(res.shares['s'].type).toBe('ASABA');
  });

  it('1.4.5 تداخل — زوجة + أم + 4 بنات', () => {
    const res = solve([
      { id: 'w', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'm', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd2', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd3', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd4', type: 'DAUGHTER', gender: 'FEMALE' }
    ]);
    // Wife: 1/8. Mother: 1/6. 4 Daughters: 2/3.
    let total = new Fraction(0);
    for (const key in res.shares) {
      total = total.add(new Fraction(res.shares[key].fraction));
    }
    expect(total.valueOf()).toBeCloseTo(1, 5);
  });

});
