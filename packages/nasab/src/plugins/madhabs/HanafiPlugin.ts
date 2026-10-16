import { MadhabPlugin } from './MadhabPlugin';
import { PluginType } from '../core/NasabPlugin';
import { CalculationResult } from '../../engine/BaseEngine';
import { Heir } from '../../types/Kinship';

export class HanafiPlugin implements MadhabPlugin {
  public readonly metadata = {
    id: 'madhab-hanafi',
    name: 'المذهب الحنفي',
    version: '1.0.0',
    description: 'تطبيق التعديلات الفقهية الخاصة بالمذهب الحنفي، مثل حجب الجد للإخوة.',
  };

  public readonly type = PluginType.MADHAB;
  public readonly madhab = 'HANAFI';

  public applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult {
    let modifiedResult = { ...result };
    modifiedResult = this.applyGrandfatherBlocking(heirs, modifiedResult);
    return modifiedResult;
  }

  /**
   * في المذهب الحنفي: الجد يحجب جميع الإخوة (أشقاء، لأب، لأم).
   */
  private applyGrandfatherBlocking(heirs: Heir[], result: CalculationResult): CalculationResult {
    const activeHeirs = heirs.filter(h => !h.isBlocked);
    const hasGrandfather = activeHeirs.some(h => h.type === 'GRANDFATHER');
    
    if (hasGrandfather) {
      activeHeirs.forEach(heir => {
        if (
          heir.type === 'FULL_BROTHER' || 
          heir.type === 'FULL_SISTER' || 
          heir.type === 'AGNATIC_BROTHER' || 
          heir.type === 'AGNATIC_SISTER' ||
          heir.type === 'UTERINE_BROTHER' ||
          heir.type === 'UTERINE_SISTER'
        ) {
          heir.isBlocked = true;
          // Remove their share if it was assigned
          if (result.shares[heir.id]) {
            delete result.shares[heir.id];
          }
        }
      });

      // After blocking siblings, if there are no other ASABA, the Grandfather should take ASABA.
      const asabaExists = Object.values(result.shares).some(s => s.type === 'ASABA' || s.type === 'FARD_PLUS_ASABA');
      if (!asabaExists) {
         const gf = activeHeirs.find(h => h.type === 'GRANDFATHER');
         if (gf) {
           // If GF already has a share, upgrade it if needed, or just set to ASABA if he had none
           if (!result.shares[gf.id]) {
             result.shares[gf.id] = { fraction: '0/1', type: 'ASABA' };
           } else if (result.shares[gf.id].type === 'FARD') {
             result.shares[gf.id].type = 'FARD_PLUS_ASABA';
           }
         }
      }
    }
    
    return result;
  }
}
