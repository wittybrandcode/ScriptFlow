import { Heir } from '../../types/Kinship';
import { CalculationResult } from '../BaseEngine';
import { MadhabStrategy } from './MadhabStrategy';

export class HanafiStrategy implements MadhabStrategy {
  public applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult {
    let modifiedResult = { ...result };
    modifiedResult = this.applyGrandfatherBlocking(heirs, modifiedResult);
    return modifiedResult;
  }

  /**
   * In Hanafi Fiqh, the Grandfather blocks all brothers and sisters
   * (Full, Agnatic, and Uterine), just like the Father does.
   */
  private applyGrandfatherBlocking(heirs: Heir[], result: CalculationResult): CalculationResult {
    const activeHeirs = heirs.filter(h => !h.isBlocked);
    const grandfathers = activeHeirs.filter(h => h.type === 'GRANDFATHER');
    
    if (grandfathers.length > 0) {
      const gfId = grandfathers[0].id;
      const targetTypes = [
        'FULL_BROTHER', 'FULL_SISTER', 
        'AGNATIC_BROTHER', 'AGNATIC_SISTER', 
        'UTERINE_BROTHER', 'UTERINE_SISTER'
      ];

      for (const heir of heirs) {
        if (targetTypes.includes(heir.type) && !heir.isBlocked) {
          heir.isBlocked = true;
          if (!heir.blockedBy) heir.blockedBy = [];
          heir.blockedBy.push(gfId);

          // Remove them from the calculation result if they were assigned shares/asaba
          if (result.shares[heir.id]) {
            delete result.shares[heir.id];
          }
        }
      }
    }

    return result;
  }
}
