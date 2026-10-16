import Fraction from 'fraction.js';
import { Heir } from '../../types/Kinship';
import { CalculationResult } from '../BaseEngine';
import { MadhabStrategy } from './MadhabStrategy';

export class ShafiiStrategy implements MadhabStrategy {
  public applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult {
    let modifiedResult = { ...result };
    modifiedResult = this.applyMusharraka(heirs, modifiedResult);
    return modifiedResult;
  }

  /**
   * Applies Al-Musharraka (المسألة المشركة / الحمارية).
   * Occurs when Husband gets 1/2, Mother/Grandmother gets 1/6, 
   * Uterine Siblings (>=2) get 1/3, leaving 0 for Full Brothers.
   * Shafii rule: Full Brothers share the 1/3 equally with Uterine Siblings.
   */
  private applyMusharraka(heirs: Heir[], result: CalculationResult): CalculationResult {
    const husband = heirs.find(h => h.type === 'SPOUSE_MALE' && !h.isBlocked);
    const motherOrGM = heirs.find(h => (h.type === 'MOTHER' || h.type === 'GRANDMOTHER_M' || h.type === 'GRANDMOTHER_P') && !h.isBlocked);
    const uterines = heirs.filter(h => (h.type === 'UTERINE_BROTHER' || h.type === 'UTERINE_SISTER') && !h.isBlocked);
    const fullBrothers = heirs.filter(h => h.type === 'FULL_BROTHER' && !h.isBlocked);

    if (husband && motherOrGM && uterines.length >= 2 && fullBrothers.length > 0) {
      // Verify no descendants or father/grandfather
      const hasBlockers = heirs.some(h => !h.isBlocked && ['SON', 'SON_OF_SON', 'DAUGHTER', 'DAUGHTER_OF_SON', 'FATHER', 'GRANDFATHER'].includes(h.type));
      
      if (!hasBlockers) {
        // Condition met. Gather all siblings to share the 1/3
        const allSiblings = [...uterines, ...fullBrothers];
        const sharedFraction = new Fraction(1, 3);
        const fractionPerSibling = sharedFraction.div(allSiblings.length);

        // Update the result
        for (const sib of allSiblings) {
          result.shares[sib.id] = {
            fraction: fractionPerSibling.toFraction(true),
            type: 'FARD_MUSHARRAKA'
          };
        }
      }
    }

    return result;
  }
}
