import Fraction from '../core/Fraction';
import { Heir } from '../types/Kinship';
import { CalculationResult } from './BaseEngine';

export class SharesEngine {
  /**
   * Assigns fixed fractional shares (Fard) to unblocked heirs.
   */
  public static assignFixedShares(heirs: Heir[], result: CalculationResult): CalculationResult {
    const activeHeirs = heirs.filter(h => !h.isBlocked);
    
    // Helper conditions
    const hasDescendant = activeHeirs.some(h => ['SON', 'DAUGHTER', 'SON_OF_SON', 'DAUGHTER_OF_SON'].includes(h.type));
    const hasMaleDescendant = activeHeirs.some(h => ['SON', 'SON_OF_SON'].includes(h.type));
    const siblingsCount = activeHeirs.filter(h => ['FULL_BROTHER', 'FULL_SISTER', 'AGNATIC_BROTHER', 'AGNATIC_SISTER', 'UTERINE_BROTHER', 'UTERINE_SISTER'].includes(h.type)).length;
    const hasFather = activeHeirs.some(h => h.type === 'FATHER');

    for (const heir of activeHeirs) {
      switch (heir.type) {
        case 'SPOUSE_MALE':
          result.shares[heir.id] = { fraction: hasDescendant ? '1/4' : '1/2', type: 'FARD' };
          break;
        case 'SPOUSE_FEMALE':
          const wives = activeHeirs.filter(h => h.type === 'SPOUSE_FEMALE');
          const baseFrac = hasDescendant ? new Fraction(1, 8) : new Fraction(1, 4);
          result.shares[heir.id] = { fraction: baseFrac.div(wives.length).toFraction(true), type: 'FARD_SHARED' };
          break;
        case 'MOTHER':
          if (hasDescendant || siblingsCount >= 2) {
            result.shares[heir.id] = { fraction: '1/6', type: 'FARD' };
          } else if (hasFather && activeHeirs.some(h => ['SPOUSE_MALE', 'SPOUSE_FEMALE'].includes(h.type))) {
            // Al-Umariya (Gharawain): Mother gets 1/3 of the remainder after spouse.
            // We'll mark it as a special fraction.
            const spouseShare = activeHeirs.some(h => h.type === 'SPOUSE_MALE') ? new Fraction(1, 2) : new Fraction(1, 4);
            const remainder = new Fraction(1).sub(spouseShare);
            const motherShare = remainder.mul(new Fraction(1, 3));
            result.shares[heir.id] = { fraction: motherShare.toFraction(true), type: 'FARD' };
          } else {
            result.shares[heir.id] = { fraction: '1/3', type: 'FARD' };
          }
          break;
        case 'GRANDMOTHER_P':
        case 'GRANDMOTHER_M':
          const gms = activeHeirs.filter(h => h.type === 'GRANDMOTHER_M' || h.type === 'GRANDMOTHER_P');
          result.shares[heir.id] = { fraction: new Fraction(1, 6).div(gms.length).toFraction(true), type: 'FARD_SHARED' };
          break;
        case 'FATHER':
        case 'GRANDFATHER':
          if (hasMaleDescendant) {
            result.shares[heir.id] = { fraction: '1/6', type: 'FARD' };
          } else if (hasDescendant) {
            result.shares[heir.id] = { fraction: '1/6', type: 'FARD_PLUS_ASABA' };
          }
          break;
        case 'DAUGHTER':
          if (!activeHeirs.some(h => h.type === 'SON')) {
            const daughters = activeHeirs.filter(h => h.type === 'DAUGHTER');
            const frac = daughters.length === 1 ? new Fraction(1, 2) : new Fraction(2, 3).div(daughters.length);
            result.shares[heir.id] = { fraction: frac.toFraction(true), type: 'FARD' };
          }
          break;
        case 'DAUGHTER_OF_SON':
          if (!activeHeirs.some(h => h.type === 'SON_OF_SON' || h.type === 'SON')) {
            const daughters = activeHeirs.filter(h => h.type === 'DAUGHTER');
            if (daughters.length === 0) {
              const dos = activeHeirs.filter(h => h.type === 'DAUGHTER_OF_SON');
              const frac = dos.length === 1 ? new Fraction(1, 2) : new Fraction(2, 3).div(dos.length);
              result.shares[heir.id] = { fraction: frac.toFraction(true), type: 'FARD' };
            } else if (daughters.length === 1) {
              const dos = activeHeirs.filter(h => h.type === 'DAUGHTER_OF_SON');
              result.shares[heir.id] = { fraction: new Fraction(1, 6).div(dos.length).toFraction(true), type: 'FARD' };
            }
          }
          break;
        case 'FULL_SISTER':
          if (!activeHeirs.some(h => h.type === 'FULL_BROTHER' || h.type === 'DAUGHTER' || h.type === 'DAUGHTER_OF_SON')) {
            const sisters = activeHeirs.filter(h => h.type === 'FULL_SISTER');
            const frac = sisters.length === 1 ? new Fraction(1, 2) : new Fraction(2, 3).div(sisters.length);
            result.shares[heir.id] = { fraction: frac.toFraction(true), type: 'FARD' };
          }
          break;
        case 'AGNATIC_SISTER':
          if (!activeHeirs.some(h => h.type === 'AGNATIC_BROTHER' || h.type === 'DAUGHTER' || h.type === 'DAUGHTER_OF_SON' || h.type === 'FULL_BROTHER')) {
            const fullSisters = activeHeirs.filter(h => h.type === 'FULL_SISTER');
            if (fullSisters.length === 0) {
              const sisters = activeHeirs.filter(h => h.type === 'AGNATIC_SISTER');
              const frac = sisters.length === 1 ? new Fraction(1, 2) : new Fraction(2, 3).div(sisters.length);
              result.shares[heir.id] = { fraction: frac.toFraction(true), type: 'FARD' };
            } else if (fullSisters.length === 1) {
              const sisters = activeHeirs.filter(h => h.type === 'AGNATIC_SISTER');
              result.shares[heir.id] = { fraction: new Fraction(1, 6).div(sisters.length).toFraction(true), type: 'FARD' };
            }
          }
          break;
        case 'UTERINE_BROTHER':
        case 'UTERINE_SISTER':
          const uterines = activeHeirs.filter(h => h.type === 'UTERINE_BROTHER' || h.type === 'UTERINE_SISTER');
          const uterinesFrac = uterines.length === 1 ? new Fraction(1, 6) : new Fraction(1, 3).div(uterines.length);
          result.shares[heir.id] = { fraction: uterinesFrac.toFraction(true), type: 'FARD' };
          break;
      }
    }

    return result;
  }
}
