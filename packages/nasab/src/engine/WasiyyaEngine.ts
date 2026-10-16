import Fraction from '../core/Fraction';
import { Heir } from '../types/Kinship';
import { BaseEngine } from './BaseEngine';

export interface WasiyyaResult {
  hasWasiyya: boolean;
  wasiyyaFraction: string; // The total fraction taken by Wasiyya Wajiba (max 1/3)
  beneficiaries: Record<string, string>; // Heir ID -> fraction of the whole estate
  remainingEstateFraction: string; // The fraction left for regular inheritance
}

export class WasiyyaEngine {
  /**
   * Calculates the Obligatory Bequest (الوصية الواجبة) for blocked grandchildren.
   * Modifies the primary heir array to remove them from regular inheritance calculation
   * if they receive Wasiyya, or just computes the deductions.
   */
  public static calculateWasiyya(heirs: Heir[]): WasiyyaResult {
    // 1. Identify grandchildren who MIGHT be eligible (they must be blocked in regular fiqh)
    const grandchildrenTypes = ['SON_OF_SON', 'DAUGHTER_OF_SON', 'DAUGHTER_SON', 'DAUGHTER_DAUGHTER'];
    const grandchildren = heirs.filter(h => grandchildrenTypes.includes(h.type));
    
    if (grandchildren.length === 0) {
      return {
        hasWasiyya: false,
        wasiyyaFraction: '0/1',
        beneficiaries: {},
        remainingEstateFraction: '1/1'
      };
    }

    // 2. We use BaseEngine to see if they are blocked
    const engine = new BaseEngine('COMMON');
    // Deep copy to prevent side effects
    const testHeirs = JSON.parse(JSON.stringify(heirs)) as Heir[];
    engine.solve(testHeirs);

    const blockedGrandchildren = testHeirs.filter(h => h.isBlocked && grandchildrenTypes.includes(h.type));
    
    if (blockedGrandchildren.length === 0) {
       return {
        hasWasiyya: false,
        wasiyyaFraction: '0/1',
        beneficiaries: {},
        remainingEstateFraction: '1/1'
      };
    }

    // --- Wasiyya Calculation Logic ---
    // In reality we should simulate the deceased parents based on lineage logic.
    // For this initial engine implementation, we will simulate one deceased SON
    // to calculate the presumed share, which handles the most common legal case.
    
    // Calculate total claimed wasiyya fraction:
    let totalWasiyyaFrac = new Fraction(0);
    const beneficiaries: Record<string, string> = {};

    const simHeirs = heirs.filter(h => !grandchildrenTypes.includes(h.type)); 
    simHeirs.push({ id: 'sim_parent', type: 'SON', gender: 'MALE' }); // Simulate the deceased father

    const simEngine = new BaseEngine('COMMON');
    const simResult = simEngine.solve(simHeirs);
    const presumedParentShare = new Fraction(simResult.shares['sim_parent']?.fraction || '0/1');

    if (presumedParentShare.compare(0) > 0) {
       // Cap at 1/3 (الثلث)
       const oneThird = new Fraction(1, 3);
       let actualWasiyya = presumedParentShare;
       if (actualWasiyya.compare(oneThird) > 0) {
           actualWasiyya = oneThird;
       }

       totalWasiyyaFrac = actualWasiyya;

       // Distribute this among the blocked grandchildren "للذكر مثل حظ الأنثيين"
       const males = blockedGrandchildren.filter(h => h.gender === 'MALE').length;
       const females = blockedGrandchildren.filter(h => h.gender === 'FEMALE').length;
       const totalUnits = (males * 2) + females;

       const unitFraction = actualWasiyya.div(totalUnits);
       
       for (const h of blockedGrandchildren) {
          const share = h.gender === 'MALE' ? unitFraction.mul(2) : unitFraction;
          beneficiaries[h.id] = share.toFraction(true);
       }
    }

    const remainingEstate = new Fraction(1).sub(totalWasiyyaFrac);

    return {
      hasWasiyya: totalWasiyyaFrac.compare(0) > 0,
      wasiyyaFraction: totalWasiyyaFrac.toFraction(true),
      beneficiaries,
      remainingEstateFraction: remainingEstate.toFraction(true)
    };
  }
}
