import Fraction from '../core/Fraction';
import { Heir } from '../types/Kinship';
import { Madhab } from '../types/FiqhAST';
import { ValidationEngine } from './ValidationEngine';

import { DualKinshipResolver } from './DualKinshipResolver';

import { BlockingEngine } from './BlockingEngine';
import { SharesEngine } from './SharesEngine';
import { AsabaEngine } from './AsabaEngine';
import { AdvancedMathEngine } from './AdvancedMathEngine';
import { PluginManager, PluginType, MadhabPlugin } from '../plugins';

export interface CalculationResult {
  baseOrigin: number;
  awlOrigin?: number;
  tashihOrigin?: number;
  shares: Record<string, { fraction: string; type: string }>;
  steps: string[];
}

/**
 * BaseEngine implementing the 10-step pipeline from `full_execution_pipeline.md`
 */
export class BaseEngine {
  private madhab: Madhab;

  constructor(madhab: Madhab = 'COMMON') {
    this.madhab = madhab;
  }

  public solve(heirs: Heir[]): CalculationResult {
    let currentHeirs = [...heirs];
    
    // Step 1: Validation
    this.validate(currentHeirs);
    
    // Hook: onBeforeGraphTraverse
    PluginManager.triggerHook('onBeforeGraphTraverse', { heirs: currentHeirs, madhab: this.madhab });

    // Step 2: Kinship Inference (Virtual heirs via Milk, etc. & Dual Kinship)
    currentHeirs = this.inferKinship(currentHeirs);
    
    // Step 3: Blocking Matrix
    const preBlockState = currentHeirs.map(h => ({ id: h.id, isBlocked: h.isBlocked }));
    currentHeirs = this.applyBlocking(currentHeirs);
    
    // Hook: onNodeExcluded
    currentHeirs.forEach((h, _index) => {
      const wasBlocked = preBlockState.find(p => p.id === h.id)?.isBlocked;
      if (!wasBlocked && h.isBlocked) {
        PluginManager.triggerHook('onNodeExcluded', h, `Blocked by Rule/Inheritance`, { madhab: this.madhab });
      }
    });

    // Hook: onNodeDiscovered (for active heirs)
    currentHeirs.filter(h => !h.isBlocked).forEach(h => {
      PluginManager.triggerHook('onNodeDiscovered', h, { madhab: this.madhab });
    });

    // Step 4: Fixed Shares
    let result = this.assignFixedShares(currentHeirs);
    
    // Step 5: Asaba Logic
    result = this.assignAsaba(currentHeirs, result);
    
    // Step 5.5: Madhab Overrides (Al-Musharraka, Grandfather blocking, etc.)
    if (this.madhab !== 'COMMON') {
      const plugins = PluginManager.getByType(PluginType.MADHAB) as MadhabPlugin[];
      const plugin = plugins.find(p => p.madhab === this.madhab);
      if (plugin) {
        result = plugin.applyOverrides(currentHeirs, result);
      }
    }
    
    // Math checks for Awl / Radd / Distant Kindred
    const totalSharesValue = AdvancedMathEngine.processBaseOrigin(result);
    
    if (totalSharesValue > 1) {
      // Step 6: Awl
      result = AdvancedMathEngine.applyAwl(result);
      // Step 6.5: Al-Akdariya special rule (الأكدرية)
      result = this.applyAkdariya(currentHeirs, result);
    } else if (totalSharesValue < 1) {
      const hasAsaba = this.hasAsaba(currentHeirs, result);
      if (hasAsaba) {
        // Step 7: Distribute remaining to Asaba
        result = this.distributeToAsaba(result);
      } else {
        const hasSharersForRadd = this.hasSharersForRadd(currentHeirs, result);
        if (hasSharersForRadd) {
          // Step 8: Radd
          result = this.applyRadd(currentHeirs, result);
        } else {
          // Step 9: Distant Kindred
          result = this.applyDistantKindred(currentHeirs, result);
        }
      }
    }
    
    // Step 10: Tashih
    result = this.applyTashih(result);
    
    // Hook: onShareCalculated
    Object.entries(result.shares).forEach(([id, share]) => {
      const heir = currentHeirs.find(h => h.id === id);
      if (heir) {
        PluginManager.triggerHook('onShareCalculated', heir, share, { madhab: this.madhab, result });
      }
    });

    // Step 11: Munasakhat is handled externally or recursively by a wrapper class
    
    return result;
  }

  // --- Step Stubs ---

  private validate(heirs: Heir[]): void {
    ValidationEngine.validate(heirs);
  }

  private inferKinship(heirs: Heir[]): Heir[] {
    return DualKinshipResolver.resolveDualKinship(heirs);
  }

  private applyBlocking(heirs: Heir[]): Heir[] {
    return BlockingEngine.applyBlocking(heirs);
  }

  private assignFixedShares(heirs: Heir[]): CalculationResult {
    const result: CalculationResult = { baseOrigin: 1, shares: {}, steps: [] };
    return SharesEngine.assignFixedShares(heirs, result);
  }

  private assignAsaba(heirs: Heir[], currentResult: CalculationResult): CalculationResult {
    return AsabaEngine.assignAsaba(heirs, currentResult);
  }

  private hasAsaba(heirs: Heir[], currentResult: CalculationResult): boolean {
    return Object.values(currentResult.shares).some(s => s.type === 'ASABA' || s.type === 'FARD_PLUS_ASABA');
  }

  private distributeToAsaba(currentResult: CalculationResult): CalculationResult {
    const fractions = Object.values(currentResult.shares)
      .filter(s => s.type === 'FARD' || s.type === 'FARD_SHARED' || s.type === 'FARD_PLUS_ASABA')
      .map(s => new Fraction(s.fraction));

    const totalFard = fractions.reduce((acc, val) => acc.add(val), new Fraction(0));
    const remainder = new Fraction(1).sub(totalFard);

    const asabaShares = Object.keys(currentResult.shares).filter(k => currentResult.shares[k].type === 'ASABA' || currentResult.shares[k].type === 'FARD_PLUS_ASABA');
    
    // Calculate total weights
    let totalWeight = 0;
    for (const key of asabaShares) {
       totalWeight += (currentResult.shares[key] as any).asabaWeight || 1;
    }

    // Distribute remainder according to weights
    if (totalWeight > 0) {
      for (const key of asabaShares) {
        const weight = (currentResult.shares[key] as any).asabaWeight || 1;
        const portion = remainder.mul(new Fraction(weight, totalWeight));
        
        if (currentResult.shares[key].type === 'FARD_PLUS_ASABA') {
           const existingFard = new Fraction(currentResult.shares[key].fraction);
           currentResult.shares[key].fraction = existingFard.add(portion).toFraction(true);
        } else {
           currentResult.shares[key].fraction = portion.toFraction(true);
        }
      }
    }

    return currentResult;
  }

  private readonly RADD_ELIGIBLE_TYPES = new Set(['FARD', 'FARD_SHARED', 'FARD_MUSHARRAKA']);

  /**
   * Checks if there are fard heirs eligible for Radd (spouses excluded).
   */
  private hasSharersForRadd(heirs: Heir[], currentResult: CalculationResult): boolean {
    const spouseIds = new Set(
      heirs.filter(h => h.type === 'SPOUSE_MALE' || h.type === 'SPOUSE_FEMALE').map(h => h.id)
    );
    return Object.entries(currentResult.shares).some(([id, share]) => {
      return this.RADD_ELIGIBLE_TYPES.has(share.type) && !spouseIds.has(id);
    });
  }

  /**
   * Apply Radd (الرد): redistribute surplus proportionally to fard heirs (excluding spouses).
   * Includes FARD, FARD_SHARED, and FARD_MUSHARRAKA types.
   */
  private applyRadd(heirs: Heir[], currentResult: CalculationResult): CalculationResult {
    // Identify share IDs that belong to spouses (they are excluded from Radd)
    const spouseIds = new Set(
      heirs.filter(h => h.type === 'SPOUSE_MALE' || h.type === 'SPOUSE_FEMALE').map(h => h.id)
    );

    const eligibleEntries = Object.entries(currentResult.shares).filter(([_id, share]) => {
      return share.type === 'FARD' || share.type === 'FARD_SHARED' || share.type === 'FARD_MUSHARRAKA';
    });

    const eligibleFractions = eligibleEntries.map(([_, s]) => new Fraction(s.fraction));
    const totalFard = eligibleFractions.reduce((acc, f) => acc.add(f), new Fraction(0));

    if (totalFard.compare(1) >= 0) return currentResult;

    const remainder = new Fraction(1).sub(totalFard);

    // Recalculate which heirs (excluding spouses) are actually eligible
    const raddEligible = Object.entries(currentResult.shares).filter(([id, share]) => {
      return this.RADD_ELIGIBLE_TYPES.has(share.type) && !spouseIds.has(id);
    });
    const raddFractions = raddEligible.map(([_, s]) => new Fraction(s.fraction));
    const raddTotal = raddFractions.reduce((acc, f) => acc.add(f), new Fraction(0));

    if (raddTotal.compare(0) <= 0) return currentResult;

    for (const [id, share] of raddEligible) {
      const heirFrac = new Fraction(share.fraction);
      const proportion = heirFrac.div(raddTotal);
      const addBack = remainder.mul(proportion);
      const newFrac = heirFrac.add(addBack);
      currentResult.shares[id].fraction = newFrac.toFraction(true);
    }

    return currentResult;
  }

  /**
   * Descent mapping for distant kindred (ذوو الأرحام).
   * Maps a distant kindred type to the closest equivalent inheritor type.
   */
  private static readonly DISTANT_KINDRED_MAP: Record<string, { equivalent: string; isMale: boolean }> = {
    DAUGHTER_SON: { equivalent: 'SON', isMale: true },
    DAUGHTER_DAUGHTER: { equivalent: 'DAUGHTER', isMale: false },
    FULL_SISTER_DAUGHTER: { equivalent: 'FULL_SISTER', isMale: false },
    FULL_BROTHER_DAUGHTER: { equivalent: 'FULL_SISTER', isMale: false },
    FULL_SISTER_SON: { equivalent: 'FULL_BROTHER', isMale: true },
    MATERNAL_UNCLE: { equivalent: 'MOTHER', isMale: true },
    MATERNAL_AUNT: { equivalent: 'MOTHER', isMale: false },
    PATERNAL_AUNT: { equivalent: 'FATHER', isMale: false },
    MATERNAL_GRANDFATHER: { equivalent: 'MOTHER', isMale: true },
  };

  /**
   * Apply Distant Kindred (ذوو الأرحام): assign shares based on descent mapping.
   * Distant kindred inherit the remainder after spouses' shares.
   */
  private applyDistantKindred(heirs: Heir[], currentResult: CalculationResult): CalculationResult {
    const distantHeirs = heirs.filter(h =>
      !h.isBlocked && h.type in BaseEngine.DISTANT_KINDRED_MAP
    );

    if (distantHeirs.length === 0) return currentResult;

    // Calculate the total fard shares taken (spouses only, since no radd-eligible fard)
    const spouseFractions = Object.entries(currentResult.shares)
      .filter(([_id, s]) => s.type === 'FARD' || s.type === 'FARD_SHARED')
      .map(([_, s]) => new Fraction(s.fraction));
    const totalSpouseFard = spouseFractions.reduce((acc, f) => acc.add(f), new Fraction(0));
    const remainder = new Fraction(1).sub(totalSpouseFard);

    if (remainder.compare(0) <= 0) return currentResult;

    // For multiple distant kindred, we need to handle the descent hierarchy
    // Group by equivalent type
    const groups = new Map<string, Heir[]>();
    for (const h of distantHeirs) {
      const mapping = BaseEngine.DISTANT_KINDRED_MAP[h.type];
      if (!groups.has(mapping.equivalent)) groups.set(mapping.equivalent, []);
      groups.get(mapping.equivalent)!.push(h);
    }

    // Distribute remainder: if males + females in same group, for_2 = M, for_1 = F
    // Otherwise equal division within group
    // Groups are ranked by the weight of the equivalent type
    const groupEntries = Array.from(groups.entries());
    if (groupEntries.length === 0) return currentResult;

    // For single distant kindred: takes entire remainder
    if (distantHeirs.length === 1) {
      const h = distantHeirs[0];
      currentResult.shares[h.id] = { fraction: remainder.toFraction(true), type: 'ASABA' };
      return currentResult;
    }

    // For multiple distant kindred, distribute by descent priority
    // Simplification: males of same equivalent get 2x females

    // Sort by equivalent type priority
    // Order matters: Quranic heirs first by kinship weight
    const typeOrder = ['SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'FULL_BROTHER', 'FULL_SISTER'];
    groupEntries.sort((a, b) => {
      const idxA = typeOrder.indexOf(a[0]);
      const idxB = typeOrder.indexOf(b[0]);
      return idxA - idxB;
    });

    // If there are groups of different types, the higher priority group takes precedence
    const highestGroup = groupEntries[0][1];
    // Check highest group gender mix
    const males = highestGroup.filter(h => {
      const m = BaseEngine.DISTANT_KINDRED_MAP[h.type];
      return m.isMale;
    });
    const females = highestGroup.filter(h => {
      const m = BaseEngine.DISTANT_KINDRED_MAP[h.type];
      return !m.isMale;
    });

    if (males.length > 0 && females.length > 0) {
      // For_2: M = 2, F = 1
      const totalShares = males.length * 2 + females.length;
      const shareUnit = remainder.div(totalShares);
      for (const m of males) {
        currentResult.shares[m.id] = { fraction: shareUnit.mul(2).toFraction(true), type: 'ASABA' };
      }
      for (const f of females) {
        currentResult.shares[f.id] = { fraction: shareUnit.toFraction(true), type: 'ASABA' };
      }
    } else {
      const members = [...males, ...females];
      const sharePerHead = remainder.div(members.length);
      for (const h of members) {
        currentResult.shares[h.id] = { fraction: sharePerHead.toFraction(true), type: 'ASABA' };
      }
    }

    return currentResult;
  }

  /**
   * Al-Akdariya (الأكدرية): Special fiqh rule when Grandfather + Full Sister coexist
   * with NO descendants and NO father. GF gets 1/6 fard (as if male descendant exists),
   * then after Awl, combine GF+Sister shares, redistribute 2:1 (male:female),
   * and rescale all shares to common denominator 27.
   */
  private applyAkdariya(heirs: Heir[], result: CalculationResult): CalculationResult {
    const activeHeirs = heirs.filter(h => !h.isBlocked);
    const gfHeir = activeHeirs.find(h => h.type === 'GRANDFATHER');
    const sisHeir = activeHeirs.find(h => h.type === 'FULL_SISTER');
    const husHeir = activeHeirs.find(h => h.type === 'SPOUSE_MALE');
    const motHeir = activeHeirs.find(h => h.type === 'MOTHER');
    const hasDesc = activeHeirs.some(h => ['SON', 'DAUGHTER', 'SON_OF_SON', 'DAUGHTER_OF_SON'].includes(h.type));
    const hasFather = activeHeirs.some(h => h.type === 'FATHER');
    if (!gfHeir || !sisHeir || !husHeir || !motHeir || hasDesc || hasFather) return result;
    // Akdariya requires ONLY: spouse, mother, grandfather, full sister — no other heirs
    const akdariyaTypes = new Set(['SPOUSE_MALE', 'MOTHER', 'GRANDFATHER', 'FULL_SISTER']);
    if (activeHeirs.some(h => !akdariyaTypes.has(h.type))) return result;

    // Check signature: GF share is 0/1 ASABA (engine didn't assign fard)
    const gfShare = result.shares[gfHeir.id];
    if (!gfShare || gfShare.type !== 'ASABA' || new Fraction(gfShare.fraction).compare(0) !== 0) return result;

    // Recompute the full case from scratch:
    // Base shares: H=1/2=3/6, M=1/3=2/6, GF=1/6=1/6, S=1/2=3/6
    // Awl: sum=9, origin=9 (not 8, because GF gets 1/6)
    // After Awl: H=3/9, M=2/9, GF=1/9, S=3/9
    // Combine GF+S = 4/9, split 2:1 → GF=8/27, S=4/27
    // Rescale H,M to 27: H=9/27, M=6/27

    const denom27 = 27;

    result.shares[husHeir.id].fraction = `9/${denom27}`;
    result.shares[motHeir.id].fraction = `6/${denom27}`;

    result.shares[gfHeir.id].fraction = `8/${denom27}`;
    result.shares[gfHeir.id].type = 'FARD';

    result.shares[sisHeir.id].fraction = `4/${denom27}`;
    result.shares[sisHeir.id].type = 'FARD';

    result.tashihOrigin = denom27;
    return result;
  }

  private applyTashih(currentResult: CalculationResult): CalculationResult {
    return AdvancedMathEngine.applyTashih(currentResult);
  }
}
