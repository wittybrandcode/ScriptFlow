import { MadhabPlugin } from './MadhabPlugin';
import { PluginType } from '../core/NasabPlugin';
import { CalculationResult } from '../../engine/BaseEngine';
import { Heir } from '../../types/Kinship';
import Fraction from '../../core/Fraction';

export class ShafiiPlugin implements MadhabPlugin {
  public readonly metadata = {
    id: 'madhab-shafii',
    name: 'المذهب الشافعي',
    version: '1.0.0',
    description: 'تطبيق التعديلات الفقهية الخاصة بالمذهب الشافعي المعتمد، مثل المسألة المشرّكة.',
  };

  public readonly type = PluginType.MADHAB;
  public readonly madhab = 'SHAFII';

  public applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult {
    let modifiedResult = { ...result };
    modifiedResult = this.applyMusharraka(heirs, modifiedResult);
    return modifiedResult;
  }

  /**
   * المسألة المشرّكة (Al-Musharraka)
   */
  private applyMusharraka(heirs: Heir[], result: CalculationResult): CalculationResult {
    const activeHeirs = heirs.filter(h => !h.isBlocked);
    const husHeir = activeHeirs.find(h => h.type === 'SPOUSE_MALE');
    const hasMotherOrGM = activeHeirs.some(h => h.type === 'MOTHER' || h.type === 'GRANDMOTHER_M' || h.type === 'GRANDMOTHER_P');
    const uterines = activeHeirs.filter(h => h.type === 'UTERINE_BROTHER' || h.type === 'UTERINE_SISTER');
    const fullBros = activeHeirs.filter(h => h.type === 'FULL_BROTHER');
    const fullSiss = activeHeirs.filter(h => h.type === 'FULL_SISTER');
    
    // Check if we meet Musharraka conditions
    if (husHeir && hasMotherOrGM && uterines.length >= 2 && fullBros.length > 0) {
      // Must not have descendants or father/grandfather
      const hasDescendantOrAscendant = activeHeirs.some(h => 
        ['SON', 'DAUGHTER', 'SON_OF_SON', 'DAUGHTER_OF_SON', 'FATHER', 'GRANDFATHER'].includes(h.type)
      );
      
      if (!hasDescendantOrAscendant) {
        
        // Calculate the existing total fard shares without the full siblings
        // If it equals 1, the ASABA (full siblings) normally get nothing!
        // Mother: 1/6
        // Husband: 1/2
        // Uterines: 1/3
        // Total = 1/6 + 3/6 + 2/6 = 6/6 = 1
        
        const sharedIds = [
          ...uterines.map(h => h.id),
          ...fullBros.map(h => h.id),
          ...fullSiss.map(h => h.id)
        ];

        // The shared portion is 1/3
        const third = new Fraction(1, 3);
        // Distribute 1/3 equally among ALL sharedIds, male & female alike
        const perCapitaShare = third.div(sharedIds.length);
        
        sharedIds.forEach(id => {
          result.shares[id] = { fraction: perCapitaShare.toFraction(true), type: 'FARD_MUSHARRAKA' };
        });
      }
    }

    return result;
  }
}
