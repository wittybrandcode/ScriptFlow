import Fraction from '../core/Fraction';
import { Person, Relation } from '../core/types';
import { InferenceEngine } from '../kinship/InferenceEngine';
import { CategoryEngine } from './CategoryEngine';
import { RulesEngine } from './RulesEngine';
import { MathEngine } from './MathEngine';
import { HeirShare, InheritanceResult } from './types';
import { MadhabOverrides } from './MadhabOverrides';
import { Madhab } from '../types/FiqhAST';
import { PluginManager } from '../plugins';

import { GraphSchema } from '../core/schema';

/**
 * المحرك الرئيسي لحساب المواريث الإسلامية.
 * يُنسّق بين محركات الاستدلال والتصنيف والقواعد والحساب الرياضي.
 *
 * @example
 * ```ts
 * const heirs = InheritanceEngine.calculate('deceased-id', nodes, edges);
 * heirs.forEach(h => console.log(h.person.name, h.share));
 * ```
 */
export class InheritanceEngine {
  /**
   * واجهة عالية المستوى تُرجع نتيجة مُهيكلة مع أساس المسألة وأعداد الحصص.
   * مُصممة للاستهلاك من واجهات ScriptFlow.
   *
   * @param deceasedId - معرّف الشخص المتوفى
   * @param nodes - قائمة كل الأشخاص في الشجرة
   * @param explicitEdges - العلاقات الصريحة (يُضاف إليها المستنتجة تلقائياً)
   * @param madhab - المذهب الفقهي المتبع 
   * @returns نتيجة مُهيكلة تشمل أساس المسألة، الحصص العددية، وأعلام العول/الرد
   */
  static calculateInheritance(deceasedId: string, nodes: Person[], explicitEdges: Relation[], madhab: Madhab = 'COMMON'): InheritanceResult {
    const heirs = InheritanceEngine.calculate(deceasedId, nodes, explicitEdges, madhab);
    
    let base = 1;
    const validShares: { heirId: string; fraction: Fraction; relationAr: string; notes?: string; isBlocked?: boolean }[] = [];
    
    for (const h of heirs) {
      if (h.exactShare && !h.isBlocked) {
        const frac = new Fraction(h.exactShare);
        validShares.push({ heirId: h.person.id, fraction: frac, relationAr: h.relation, notes: h.notes });
        base = MathEngine.lcm(base, Number(frac.d));
      } else if (h.isBlocked) {
        validShares.push({ heirId: h.person.id, fraction: new Fraction(0), relationAr: h.relation, notes: h.notes, isBlocked: true });
      }
    }

    const shares = validShares.map(s => ({
      heirId: s.heirId,
      share: s.isBlocked ? 0 : Math.round(s.fraction.mul(base).valueOf()),
      relationAr: s.relationAr,
      notes: s.notes,
      isBlocked: s.isBlocked,
    }));

    const awlApplied = heirs.some(h => h.notes?.includes('العول'));
    const raddApplied = heirs.some(h => h.notes?.includes('الرد'));
    const totalFard = validShares.filter(s => !s.isBlocked).reduce((sum, s) => sum.add(s.fraction), new Fraction(0));

    return { base, shares, awlApplied, raddApplied, totalFard: totalFard.toFraction(true) };
  }

  /**
   * يحسب حصص الورثة الشرعية للمتوفى.
   * لا يُعدّل المدخلات الأصلية (immutable). يُرجع نفس النتيجة لنفس المدخلات (deterministic).
   *
   * @param deceasedId - معرّف الشخص المتوفى
   * @param nodes - قائمة كل الأشخاص في الشجرة
   * @param explicitEdges - العلاقات الصريحة بين الأشخاص
   * @param madhab - المذهب
   * @returns قائمة الورثة مع حصصهم الكسرية وملاحظات الحجب
   *
   * @example
   * ```ts
   * const heirs = InheritanceEngine.calculate('dead', nodes, edges, 'SHAFII');
   * // heirs[0] = { person, relation: 'زوجة', share: '1/8', exactShare: '1/8', notes: '...' }
   * ```
   */
  static calculate(deceasedId: string, nodes: Person[], explicitEdges: Relation[], madhab: Madhab = 'COMMON'): HeirShare[] {
    // Phase 2.3: Zod Strict Validation for Input Integrity
    try {
      GraphSchema.parse({ persons: nodes, relations: explicitEdges });
    } catch (err: any) {
      throw new Error(`[Nasab] Invalid graph data: ${err.message}`);
    }

    const deceased = nodes.find(n => n.id === deceasedId);
    if (!deceased) return [];

    const inferredEdges = InferenceEngine.infer(nodes, explicitEdges);
    // FIX-09: Deep copy edges to prevent Mutation Leakage to consumer
    const allEdges = [
      ...explicitEdges.map(e => ({ ...e })),
      ...inferredEdges.map(e => ({ ...e }))
    ] as Relation[];

    // 1. Build Context
    const ctx = CategoryEngine.buildContext(deceased, nodes, allEdges);

    // 2. Apply Islamic Jurisprudence Rules
    RulesEngine.applyRules(ctx);

    // 3. Apply Dynamic Lineage Isolation
    RulesEngine.applyDynamicLineageIsolation(ctx, nodes);

    // 3.5. Apply Madhab-specific Overrides (e.g. Al-Musharraka)
    MadhabOverrides.apply(ctx, madhab);

    // 4. Mathematical Evaluation & Distribution
    MathEngine.evaluate(ctx);
    
    // 5. Trigger Plugins (including the new Evidence Jurisprudence System)
    PluginManager.triggerHook('onAfterInheritanceCalculation', ctx);

    return ctx.heirs;
  }
}



