import { Heir } from '../types/Kinship';
import { CalculationResult } from './BaseEngine';

export class AsabaEngine {
  /**
   * Assigns Asaba status to the appropriate heirs.
   */
  public static assignAsaba(heirs: Heir[], result: CalculationResult): CalculationResult {
    const activeHeirs = heirs.filter(h => !h.isBlocked);
    const hasType = (type: string) => activeHeirs.some(h => h.type === type || h.secondaryType === type);
    const getByType = (type: string) => activeHeirs.filter(h => h.type === type || h.secondaryType === type);

    const markAsaba = (heirsToMark: Heir[], asabaType: string, maleWeight: number, femaleWeight: number) => {
      for (const h of heirsToMark) {
        if (!result.shares[h.id]) {
          result.shares[h.id] = { fraction: '0/1', type: 'ASABA' };
        } else if (result.shares[h.id].type === 'FARD_PLUS_ASABA') {
           // Father/Grandfather with female descendant
        } else if (result.shares[h.id].type === 'FARD' || result.shares[h.id].type === 'FARD_SHARED') {
           // Dual kinship (اجتماع القرابتين: يرث بالفرض والعصوبة معاً)
           result.shares[h.id].type = 'FARD_PLUS_ASABA';
        } else {
           result.shares[h.id].type = 'ASABA';
        }
        // Store weights somewhere in result? Yes, we can extend the share object.
        (result.shares[h.id] as any).asabaType = asabaType;
        (result.shares[h.id] as any).asabaWeight = h.gender === 'MALE' ? maleWeight : femaleWeight;
      }
    };

    // 1. Descendants (Bunuwwa)
    const sons = getByType('SON');
    const daughters = getByType('DAUGHTER');
    if (sons.length > 0) {
      if (daughters.length > 0) {
        markAsaba([...sons, ...daughters], 'ASABA_BIL_GHAYR', 2, 1);
      } else {
        markAsaba(sons, 'ASABA_BIN_NAFS', 1, 0);
      }
      return result;
    }

    const grandsons = getByType('SON_OF_SON');
    const granddaughters = getByType('DAUGHTER_OF_SON');
    if (grandsons.length > 0) {
      if (granddaughters.length > 0) {
        markAsaba([...grandsons, ...granddaughters], 'ASABA_BIL_GHAYR', 2, 1);
      } else {
        markAsaba(grandsons, 'ASABA_BIN_NAFS', 1, 0);
      }
      return result;
    }

    // 2. Ascendants (Ubuwwa)
    const fathers = getByType('FATHER');
    if (fathers.length > 0) {
      if (!hasType('SON') && !hasType('SON_OF_SON')) {
        markAsaba(fathers, 'ASABA_BIN_NAFS', 1, 0);
        return result;
      }
    }

    const grandfathers = getByType('GRANDFATHER');
    const fullBrothers = getByType('FULL_BROTHER');
    const fullSisters = getByType('FULL_SISTER');
    const paternalBrothers = getByType('AGNATIC_BROTHER');
    const paternalSisters = getByType('AGNATIC_SISTER');
    const hasBrothers = fullBrothers.length > 0 || fullSisters.length > 0 || paternalBrothers.length > 0 || paternalSisters.length > 0;

    if (grandfathers.length > 0 && fathers.length === 0) {
      if (!hasType('SON') && !hasType('SON_OF_SON')) {
        if (!hasBrothers) {
          markAsaba(grandfathers, 'ASABA_BIN_NAFS', 1, 0);
          return result;
        } else {
          // الجد مع الإخوة: المقاسمة كأخ شقيق أو لأب
          if (fullBrothers.length > 0 || fullSisters.length > 0) {
            markAsaba([...grandfathers, ...fullBrothers, ...fullSisters], 'ASABA_BIL_GHAYR', 2, 1);
            return result;
          } else if (paternalBrothers.length > 0 || paternalSisters.length > 0) {
            markAsaba([...grandfathers, ...paternalBrothers, ...paternalSisters], 'ASABA_BIL_GHAYR', 2, 1);
            return result;
          }
        }
      }
    }

    // 3. Siblings (Ukhuwwa)
    if (fullBrothers.length > 0) {
      if (fullSisters.length > 0) {
        markAsaba([...fullBrothers, ...fullSisters], 'ASABA_BIL_GHAYR', 2, 1);
      } else {
        markAsaba(fullBrothers, 'ASABA_BIN_NAFS', 1, 0);
      }
      return result;
    }

    // Full Sister as Asaba Ma'a Al Ghayr (With daughters)
    if (fullSisters.length > 0 && (hasType('DAUGHTER') || hasType('DAUGHTER_OF_SON'))) {
      markAsaba(fullSisters, 'ASABA_MAA_AL_GHAYR', 0, 1);
      return result;
    }

    if (paternalBrothers.length > 0) {
      if (paternalSisters.length > 0) {
        markAsaba([...paternalBrothers, ...paternalSisters], 'ASABA_BIL_GHAYR', 2, 1);
      } else {
        markAsaba(paternalBrothers, 'ASABA_BIN_NAFS', 1, 0);
      }
      return result;
    }

    // Paternal Sister as Asaba Ma'a Al Ghayr (With daughters)
    if (paternalSisters.length > 0 && (hasType('DAUGHTER') || hasType('DAUGHTER_OF_SON'))) {
      markAsaba(paternalSisters, 'ASABA_MAA_AL_GHAYR', 0, 1);
      return result;
    }

    // 4. Extended (Umuuma)
    // We already block lower uncles if higher exist in BlockingEngine
    const typesByPriority = ['FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'];
    for (const t of typesByPriority) {
      const relatives = getByType(t);
      if (relatives.length > 0) {
        markAsaba(relatives, 'ASABA_BIN_NAFS', 1, 0);
        return result;
      }
    }

    return result;
  }
}
