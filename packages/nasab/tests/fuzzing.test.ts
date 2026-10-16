import { describe, it, expect } from 'vitest';
import Fraction from 'fraction.js';
import fc from 'fast-check';
import { BaseEngine } from '../src/engine/BaseEngine';
import { Heir, HeirType } from '../src/types/Kinship';
import { Gender } from '../src/core/enums';
import { ValidationEngine } from '../src/engine/ValidationEngine';



function countArb(max: number) {
  return fc.integer({ min: 0, max: Math.min(max, 6) });
}

const familyArb: fc.Arbitrary<{ heirs: Heir[]; id: number }> =
  fc.record({
    deceasedIsMale: fc.boolean(),
    spouses: countArb(4),
    father: countArb(1),
    mother: countArb(1),
    grandfather: countArb(1),
    grandmoth: countArb(2),
    sons: countArb(8),
    daughters: countArb(8),
    sonsOfSons: countArb(5),
    daughtersOfSons: countArb(5),
    fullBro: countArb(5),
    fullSis: countArb(5),
    agnBro: countArb(5),
    agnSis: countArb(5),
    utBro: countArb(3),
    utSis: countArb(3),
    uncles: countArb(3),
    agnUncles: countArb(3),
  }).map(cfg => {
    const heirs: Heir[] = [];
    let id = 0;
    const add = (type: HeirType, gender: Gender, count: number) => {
      for (let i = 0; i < count; i++) {
        heirs.push({ id: `h${++id}`, type, gender });
      }
    };
    const isMale = cfg.deceasedIsMale;
    add(isMale ? 'SPOUSE_FEMALE' : 'SPOUSE_MALE',
        isMale ? Gender.FEMALE : Gender.MALE, cfg.spouses);
    add('FATHER', Gender.MALE, cfg.father);
    add('MOTHER', Gender.FEMALE, cfg.mother);
    add('GRANDFATHER', Gender.MALE, cfg.grandfather);
    add('GRANDMOTHER_P', Gender.FEMALE, cfg.grandmoth);
    add('SON', Gender.MALE, cfg.sons);
    add('DAUGHTER', Gender.FEMALE, cfg.daughters);
    add('SON_OF_SON', Gender.MALE, cfg.sonsOfSons);
    add('DAUGHTER_OF_SON', Gender.FEMALE, cfg.daughtersOfSons);
    add('FULL_BROTHER', Gender.MALE, cfg.fullBro);
    add('FULL_SISTER', Gender.FEMALE, cfg.fullSis);
    add('AGNATIC_BROTHER', Gender.MALE, cfg.agnBro);
    add('AGNATIC_SISTER', Gender.FEMALE, cfg.agnSis);
    add('UTERINE_BROTHER', Gender.MALE, cfg.utBro);
    add('UTERINE_SISTER', Gender.FEMALE, cfg.utSis);
    add('FULL_UNCLE', Gender.MALE, cfg.uncles);
    add('AGNATIC_UNCLE', Gender.MALE, cfg.agnUncles);
    return { heirs, id };
  });

const unblockableTypes = new Set(['SPOUSE_MALE', 'SPOUSE_FEMALE', 'FATHER', 'MOTHER', 'SON', 'DAUGHTER']);

describe('Fuzzing — اختبار العشوائية المتقدم', () => {
  const NUM = 100_000;

  it(`تشغيل ${NUM.toLocaleString()} عائلة عشوائية والتحقق من 4 ثوابت فقهية`, { timeout: 180_000 }, () => {
    fc.assert(
      fc.property(familyArb, ({ heirs }) => {
        fc.pre(heirs.length > 0);

        const engine = new BaseEngine('COMMON');
        let result: ReturnType<typeof engine.solve> | undefined;
        try {
          ValidationEngine.validate(heirs);
          result = engine.solve(heirs);
        } catch (e: any) {
          if (!e.code || !e.code.startsWith('VAL_')) throw e;
          return; // validation error, skip invariants
        }
        if (!result) return;

        // الثابت 1: مجموع الحصص يساوي 1 (العول يعدّل الأساس وليس الحصص)
        let total = new Fraction(0);
        for (const key in result.shares) {
          total = total.add(new Fraction(result.shares[key].fraction));
        }
        const EPS = 1e-9;
        expect(Math.abs(total.valueOf() - 1)).toBeLessThan(EPS);

        // الثابت 2: الستة لا يُحجبون أبداً
        for (const h of heirs) {
          if (unblockableTypes.has(h.type)) {
            expect(h.isBlocked).toBeFalsy();
          }
        }

        // الثابت 3: كل محجوب حصته 0/1
        for (const h of heirs) {
          if (h.isBlocked) {
            const share = result.shares[h.id];
            if (share) expect(share.fraction).toBe('0/1');
          }
        }

        // الثابت 4: لا NaN ولا Infinity ولا قيم سالبة
        expect(Number.isFinite(result.baseOrigin)).toBe(true);
        expect(result.baseOrigin).toBeGreaterThan(0);
        for (const key in result.shares) {
          const frac = new Fraction(result.shares[key].fraction);
          expect(frac.valueOf()).not.toBeNaN();
          expect(frac.valueOf()).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: NUM, verbose: false }
    );
  });
});
