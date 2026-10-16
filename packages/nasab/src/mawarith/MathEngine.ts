import Fraction from '../core/Fraction';
import { Gender } from '../core/enums';
import { MawarithContext } from './types';

/**
 * محرك الحساب الرياضي للمواريث.
 * النقطة الوحيدة التي تتعامل مع مكتبة Fraction.js. باقي المحركات تمرر الحصص كنصوص ('1/6').
 * يُطبّق: الفروض، العول، الرد، والتعصيب.
 */
export class MathEngine {
  /**
   * يُوزّع الحصص الكسرية على الورثة ويُطبّق العول والرد والتعصيب.
   * يُعدّل `ctx.heirs` مباشرةً بإضافة `share` و`exactShare` و`notes`.
   *
   * @param ctx - سياق المواريث الذي بناه CategoryEngine
   */
  static evaluate(ctx: MawarithContext): void {
    // Convert string fard shares to Fraction objects for computation
    const fardFractions = new Map<string, Fraction>();
    ctx.fardShares.forEach((val, id) => {
      fardFractions.set(id, new Fraction(val));
    });

    // Handle multiple holders of same fard (e.g. 4 wives sharing 1/8)
    // Group by relation to detect shared fards
    const relationGroups = new Map<string, { ids: string[]; fard: Fraction }>();
    ctx.heirs.forEach(h => {
      if (!h.isBlocked && fardFractions.has(h.person.id)) {
        const key = h.relation;
        if (!relationGroups.has(key)) {
          relationGroups.set(key, { ids: [], fard: fardFractions.get(h.person.id)! });
        }
        relationGroups.get(key)!.ids.push(h.person.id);
      }
    });

    // Divide shared fards among group members
    relationGroups.forEach(({ ids, fard }) => {
      if (ids.length > 1) {
        const perPerson = fard.div(ids.length);
        ids.forEach(id => fardFractions.set(id, perPerson));
      }
    });

    let totalFard = new Fraction(0);
    fardFractions.forEach(val => { totalFard = totalFard.add(val); });

    let baseMultiplier = new Fraction(1);
    let awlApplied = false;

    if (totalFard.valueOf() > 1) {
      awlApplied = true;
      baseMultiplier = new Fraction(1).div(totalFard);
    } else if (totalFard.valueOf() < 1 && !ctx.asaba && fardFractions.size > 0) {
      let fardWithoutSpouse = new Fraction(0);
      let fardOfSpouses = new Fraction(0);
      fardFractions.forEach((val, id) => {
        const isSpouse = ctx.relatives.spouses.some(s => s.id === id);
        if (isSpouse) fardOfSpouses = fardOfSpouses.add(val);
        else fardWithoutSpouse = fardWithoutSpouse.add(val);
      });

      if (fardWithoutSpouse.valueOf() > 0) {
        const remainderForRadd = new Fraction(1).sub(fardOfSpouses);
        const raddMultiplier = remainderForRadd.div(fardWithoutSpouse);
        
        ctx.heirs.forEach(h => {
          if (fardFractions.has(h.person.id) && !ctx.relatives.spouses.some(s => s.id === h.person.id)) {
            fardFractions.set(h.person.id, fardFractions.get(h.person.id)!.mul(raddMultiplier));
            h.notes += ' (مع الرد)';
          }
        });
        totalFard = new Fraction(0);
        fardFractions.forEach(val => { totalFard = totalFard.add(val); });
      }
    }

    ctx.heirs.forEach(h => {
      if (fardFractions.has(h.person.id)) {
        const finalFard = fardFractions.get(h.person.id)!.mul(baseMultiplier);
        h.exactShare = finalFard.toFraction(true);
        h.share = `${h.exactShare}`;
        if (awlApplied) h.notes += ' (بالعول)';
      }
    });

    if (ctx.asaba && totalFard.valueOf() < 1) {
      const remainder = new Fraction(1).sub(totalFard);
      let totalParts = 0;
      ctx.asaba.persons.forEach(p => {
        totalParts += (p.gender === Gender.MALE) ? ctx.asaba!.maleWeight : ctx.asaba!.femaleWeight;
      });

      if (totalParts > 0) {
        const partValue = remainder.div(totalParts);
        ctx.asaba.persons.forEach(p => {
          const weight = (p.gender === Gender.MALE) ? ctx.asaba!.maleWeight : ctx.asaba!.femaleWeight;
          const exactShare = partValue.mul(weight);
          
          const existingHeir = ctx.heirs.find(h => h.person.id === p.id && !h.isBlocked);
          if (existingHeir) {
            const combined = fardFractions.get(p.id)!.add(exactShare);
            existingHeir.exactShare = combined.toFraction(true);
            existingHeir.share = combined.toFraction(true);
          } else {
            ctx.heirs.push({
              person: p,
              relation: (p.gender === Gender.MALE) ? (ctx.asaba!.relation.includes('إخوة') ? 'أخ' : ctx.asaba!.relation) : (ctx.asaba!.relation.includes('إخوة') ? 'أخت' : ctx.asaba!.relation),
              share: exactShare.toFraction(true),
              exactShare: exactShare.toFraction(true),
              notes: `${ctx.asaba!.asabaType}`
            });
          }
        });
      }
    }

    // Sort the final heirs array
    ctx.heirs.sort((a,b) => {
      if (a.isBlocked && !b.isBlocked) return 1;
      if (!a.isBlocked && b.isBlocked) return -1;
      if (a.exactShare && b.exactShare) return new Fraction(b.exactShare).valueOf() - new Fraction(a.exactShare).valueOf();
      return 0;
    });
  }

  /** يحسب المضاعف المشترك الأصغر (Least Common Multiple) */
  static lcm(a: number, b: number): number {
    return Math.abs(a * b) / MathEngine.gcd(a, b);
  }

  /** يحسب القاسم المشترك الأكبر (Greatest Common Divisor) */
  static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a;
  }
}
