import { Gender } from '../core/enums';
import { Person } from '../core/types';
import { MawarithContext } from './types';

/**
 * محرك القواعد الفقهية.
 * يُعيّن الفروض والتعصيب والحجب وفق أحكام الشريعة الإسلامية (رأي الجمهور).
 * الحصص مُعبّر عنها كنصوص ('1/6', '1/4') وليس كائنات Fraction.
 */
export class RulesEngine {
  /**
   * يُطبّق قواعد الفروض والتعصيب والحجب على سياق المواريث.
   * يُعدّل `ctx` مباشرةً (يُضيف ورثة، يُعيّن فروض، يُعيّن عصبة).
   *
   * @param ctx - سياق المواريث الذي بناه CategoryEngine
   */
  static applyRules(ctx: MawarithContext): void {
    const r = ctx.relatives;

    // 1. Spouses
    if (r.spouses.length > 0) {
      if (ctx.isMale) {
        const fard = ctx.hasDescendant ? '1/8' : '1/4';
        // For multiple wives, MathEngine will handle the division
        r.spouses.forEach(w => ctx.addFard(w, 'زوجة', fard, ctx.hasDescendant ? 'لوجود الفرع الوارث' : 'لعدم وجود الفرع الوارث'));
      } else {
        const fard = ctx.hasDescendant ? '1/4' : '1/2';
        ctx.addFard(r.spouses[0], 'زوج', fard, ctx.hasDescendant ? 'لوجود الفرع الوارث' : 'لعدم وجود الفرع الوارث');
      }
    }

    // 2. Mother & Grandmother
    const father = r.fathers[0] || null;
    const mother = r.mothers[0] || null;

    if (mother) {
      if (ctx.hasDescendant || ctx.siblingsCount >= 2) {
        ctx.addFard(mother, 'أم', '1/6', 'لوجود الفرع الوارث أو جمع من الإخوة');
      } else {
        if (r.spouses.length > 0 && father && ctx.siblingsCount === 0 && !ctx.hasDescendant) {
          // المسألة العمرية (الغراوين): ثلث الباقي — MathEngine handles the math
          const ghariShareStr = ctx.isMale ? '1/4' : '1/6';
          ctx.addFard(mother, 'أم', ghariShareStr, 'المسألة العمرية (الغراوين): الأم تأخذ ثلث الباقي');
        } else {
          ctx.addFard(mother, 'أم', '1/3', 'لعدم وجود الفرع الوارث أو جمع الإخوة');
        }
      }
      ctx.block(r.grandmothers, 'جدة', 'محجوبة بوجود الأم');
    } else {
      if (r.grandmothers.length > 0) {
        ctx.addFard(r.grandmothers[0], 'جدة', '1/6', 'جدة صحيحة للفرض 1/6');
        if (r.grandmothers.length > 1) {
          r.grandmothers.slice(1).forEach(gm => ctx.addFard(gm, 'جدة', '1/6', 'جدة صحيحة للفرض 1/6'));
        }
      }
    }

    // 3. Father & Grandfather
    let nearestMaleAscendant: Person | null = null;
    let nearestMaleAscendantLabel = '';
    
    if (father) {
      nearestMaleAscendant = father;
      nearestMaleAscendantLabel = 'أب';
      ctx.block(r.grandfathers, 'جد', 'محجوب بوجود الأب');
    } else if (r.grandfathers.length > 0) {
      nearestMaleAscendant = r.grandfathers[0];
      nearestMaleAscendantLabel = 'جد صحيح';
      if (r.grandfathers.length > 1) ctx.block(r.grandfathers.slice(1), 'جد', 'مستبعد للتسهيل - جد أبعد');
    }

    if (nearestMaleAscendant) {
      if (ctx.hasMaleDescendant) {
        ctx.addFard(nearestMaleAscendant, nearestMaleAscendantLabel, '1/6', 'لوجود الفرع الوارث المذكر');
      } else if (ctx.hasFemaleDescendant) {
        ctx.addFard(nearestMaleAscendant, nearestMaleAscendantLabel, '1/6', 'فرضا 1/6 بالإضافة للباقي تعصيبا');
        ctx.asaba = { persons: [nearestMaleAscendant], relation: nearestMaleAscendantLabel, asabaType: 'عصبة بالنفس', maleWeight: 1, femaleWeight: 1 };
      } else {
        ctx.asaba = { persons: [nearestMaleAscendant], relation: nearestMaleAscendantLabel, asabaType: 'عصبة بالنفس', maleWeight: 1, femaleWeight: 1 };
      }
    }

    // 4. Descendants (Sons & Daughters)
    if (r.sons.length > 0) {
      ctx.asaba = { persons: [...r.sons, ...r.daughters], relation: 'أبناء وبنات', asabaType: 'عصبة بالغير', maleWeight: 2, femaleWeight: 1 };
      ctx.block(r.grandsons, 'حفيد', 'محجوب بالابن');
      ctx.block(r.granddaughters, 'حفيدة', 'محجوبة بالابن');
    } else if (r.daughters.length > 0) {
      const fard = r.daughters.length === 1 ? '1/2' : '2/3';
      r.daughters.forEach(d => ctx.addFard(d, 'ابنة', fard, r.daughters.length === 1 ? 'لانفرادها' : 'للتعدد'));

      if (r.grandsons.length > 0) {
        if (ctx.asaba === null) {
          ctx.asaba = { persons: [...r.grandsons, ...r.granddaughters], relation: 'أحفاد من الابن', asabaType: 'عصبة بالغير', maleWeight: 2, femaleWeight: 1 };
        }
      } else if (r.granddaughters.length > 0) {
        if (r.daughters.length === 1) {
          r.granddaughters.forEach(gd => ctx.addFard(gd, 'حفيدة (بنت ابن)', '1/6', 'السدس تكملة الثلثين'));
        } else {
          ctx.block(r.granddaughters, 'حفيدة (بنت ابن)', 'محجوبة لاستغراق البنات الثلثين');
        }
      }
    } else {
      if (r.grandsons.length > 0) {
        ctx.asaba = { persons: [...r.grandsons, ...r.granddaughters], relation: 'أحفاد من الابن', asabaType: 'عصبة بالغير', maleWeight: 2, femaleWeight: 1 };
      } else if (r.granddaughters.length > 0) {
        const fard = r.granddaughters.length === 1 ? '1/2' : '2/3';
        r.granddaughters.forEach(gd => ctx.addFard(gd, 'حفيدة (بنت ابن)', fard, r.granddaughters.length === 1 ? 'لانفرادها' : 'للتعدد'));
      }
    }

    // 5. Maternal Siblings
    if (!father && !nearestMaleAscendant && !ctx.hasDescendant) {
      const maternalSibs = [...r.maternalBrothers, ...r.maternalSisters];
      if (maternalSibs.length === 1) {
        ctx.addFard(maternalSibs[0], maternalSibs[0].gender === Gender.MALE ? 'أخ لأم' : 'أخت لأم', '1/6', 'لانفراده/ها');
      } else if (maternalSibs.length > 1) {
        maternalSibs.forEach(s => ctx.addFard(s, s.gender === Gender.MALE ? 'أخ لأم' : 'أخت لأم', '1/3', 'يتقاسمون الثلث بالتساوي'));
      }
    } else {
      ctx.block([...r.maternalBrothers, ...r.maternalSisters], 'أخ/أخت لأم', 'محجوب بالأب/الجد أو الفرع الوارث');
    }

    // 6. Full Siblings
    let fullSibsAsabaTaken = false;
    if (nearestMaleAscendant || ctx.hasMaleDescendant) {
      ctx.block([...r.fullBrothers, ...r.fullSisters], 'أخ/أخت شقيق', 'محجوب بالأب أو الفرع الوارث المذكر');
    } else if (!ctx.asaba && r.sons.length === 0) {
      if (r.fullBrothers.length > 0) {
        ctx.asaba = { persons: [...r.fullBrothers, ...r.fullSisters], relation: 'إخوة أشقاء', asabaType: 'عصبة بالغير', maleWeight: 2, femaleWeight: 1 };
        fullSibsAsabaTaken = true;
      } else if (r.fullSisters.length > 0) {
        if (ctx.hasFemaleDescendant) {
          ctx.asaba = { persons: r.fullSisters, relation: 'أخت شقيقة', asabaType: 'عصبة مع الغير', maleWeight: 1, femaleWeight: 1 };
          fullSibsAsabaTaken = true;
        } else {
          const fard = r.fullSisters.length === 1 ? '1/2' : '2/3';
          r.fullSisters.forEach(s => ctx.addFard(s, 'أخت شقيقة', fard, r.fullSisters.length === 1 ? 'لانفرادها' : 'للتعدد'));
        }
      }
    }

    // 7. Paternal Siblings
    if (nearestMaleAscendant || ctx.hasMaleDescendant || r.fullBrothers.length > 0 || fullSibsAsabaTaken) {
      ctx.block([...r.paternalBrothers, ...r.paternalSisters], 'أخ/أخت لأب', 'محجوب بالأب/الفرع المذكر/الإخوة الأشقاء');
    } else if (!ctx.asaba && r.sons.length === 0) {
      if (r.paternalBrothers.length > 0) {
        ctx.asaba = { persons: [...r.paternalBrothers, ...r.paternalSisters], relation: 'إخوة لأب', asabaType: 'عصبة بالغير', maleWeight: 2, femaleWeight: 1 };
      } else if (r.paternalSisters.length > 0) {
        if (ctx.hasFemaleDescendant) {
          ctx.asaba = { persons: r.paternalSisters, relation: 'أخت لأب', asabaType: 'عصبة مع الغير', maleWeight: 1, femaleWeight: 1 };
        } else if (r.fullSisters.length === 1) {
          r.paternalSisters.forEach(s => ctx.addFard(s, 'أخت لأب', '1/6', 'تكملة للثلثين (مع أخت شقيقة واحدة)'));
        } else if (r.fullSisters.length === 0) {
          const fard = r.paternalSisters.length === 1 ? '1/2' : '2/3';
          r.paternalSisters.forEach(s => ctx.addFard(s, 'أخت لأب', fard, r.paternalSisters.length === 1 ? 'لانفرادها' : 'للتعدد'));
        } else {
          ctx.block(r.paternalSisters, 'أخت لأب', 'محجوبة لاستغراق الأخوات الشقيقات الثلثين');
        }
      }
    } else {
      ctx.block([...r.paternalBrothers, ...r.paternalSisters], 'أخ/أخت لأب', 'حجب أو استغراق العصبة');
    }

    // 8. Other Extended Asabat
    if (!ctx.asaba) {
      if (r.nephews.length > 0) {
        ctx.asaba = { persons: r.nephews, relation: 'أبناء الإخوة', asabaType: 'عصبة بالنفس', maleWeight: 1, femaleWeight: 1 };
        ctx.block(r.uncles, 'أعمام', 'محجوب بأبناء الإخوة');
      } else if (r.uncles.length > 0) {
        ctx.asaba = { persons: r.uncles, relation: 'أعمام/أخوال', asabaType: 'عصبة بالنفس', maleWeight: 1, femaleWeight: 1 };
      }
    } else {
      if (r.nephews.length > 0) ctx.block(r.nephews, 'ابن أخ/أخت', 'محجوب بالعصبة الأقرب الجهة');
      if (r.uncles.length > 0) ctx.block(r.uncles, 'عم/خال', 'محجوب بالعصبة الأقرب الجهة');
    }

    // Block Zawil Arham and generic Lineage mismatchers
    ctx.block(r.aunts, 'عمة/خالة', 'من ذوي الأرحام');
    ctx.block(r.nieces, 'ابنة أخ/أخت', 'من ذوي الأرحام');
  }

  static applyDynamicLineageIsolation(ctx: MawarithContext, allNodes: Person[]): void {
    if (ctx.deceased.lineageId) {
      allNodes.forEach(n => {
        if (!n.isDeceased && n.id !== ctx.deceased.id) {
          if (!ctx.heirs.some(h => h.person.id === n.id)) {
            const isFardOwner = ctx.relatives.spouses.some(s=>s.id===n.id) || 
                                ctx.relatives.mothers.some(m=>m.id===n.id) || 
                                ctx.relatives.grandmothers.some(g=>g.id===n.id) || 
                                ctx.relatives.maternalBrothers.some(m=>m.id===n.id) || 
                                ctx.relatives.maternalSisters.some(m=>m.id===n.id);
            if (!isFardOwner && n.lineageId !== ctx.deceased.lineageId) {
              ctx.heirs.push({
                person: n,
                relation: 'قريب بعيد/ذوي أرحام',
                share: 'لا يرث',
                isBlocked: true,
                notes: `تم استبعاده ديناميكياً بـ (O(1)) لاختلاف نسبه مع الميت (${ctx.deceased.lineageId})`
              });
            }
          }
        }
      });
    }
  }
}
