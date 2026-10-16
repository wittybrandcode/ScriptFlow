import { MadhabPlugin } from './MadhabPlugin';
import { PluginType } from '../core/NasabPlugin';
import { CalculationResult } from '../../engine/BaseEngine';
import { Heir, HeirType } from '../../types/Kinship';
import { Madhab } from '../../types/FiqhAST';

/**
 * المذهب الجعفري يعتمد على نظام "الطبقات" (Tiers/Classes)، ولا يعتمد حجب العصبات التقليدي.
 * الطبقة الأولى تحجب الثانية، والثانية تحجب الثالثة بالكامل.
 */
export class JafariPlugin implements MadhabPlugin {
  public readonly metadata = {
    id: 'madhab-jafari',
    name: 'المذهب الجعفري (الإمامية)',
    version: '1.0.0',
    description: 'تطبيق مواريث الشيعة الإمامية بناءً على نظام الطبقات (Tabaqat).',
  };

  public readonly type = PluginType.MADHAB;
  public readonly madhab: Madhab = 'JAFARI';

  public applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult {
    const activeHeirs = heirs.filter(h => !h.isBlocked);
    const modifiedResult = { ...result };
    
    // تصنيف الورثة حسب الطبقات
    const spouseTypes: HeirType[] = ['SPOUSE_MALE', 'SPOUSE_FEMALE'];
    
    // الطبقة الأولى: الأبوان والأولاد (وإن نزلوا)
    const tier1Types: HeirType[] = ['FATHER', 'MOTHER', 'SON', 'DAUGHTER', 'SON_OF_SON', 'DAUGHTER_OF_SON', 'DAUGHTER_SON', 'DAUGHTER_DAUGHTER']; // إضافة أحفاد البنات في الجعفري
    const hasTier1 = activeHeirs.some(h => tier1Types.includes(h.type));

    // الطبقة الثانية: الأجداد والجدات، والإخوة والأخوات (وأولادهم)
    const tier2Types: HeirType[] = [
      'GRANDFATHER', 'GRANDMOTHER_P', 'GRANDMOTHER_M', 'MATERNAL_GRANDFATHER',
      'FULL_BROTHER', 'FULL_SISTER', 
      'AGNATIC_BROTHER', 'AGNATIC_SISTER', 
      'UTERINE_BROTHER', 'UTERINE_SISTER',
      'FULL_BROTHER_DAUGHTER', 'FULL_SISTER_SON', 'FULL_SISTER_DAUGHTER'
    ];
    const hasTier2 = activeHeirs.some(h => tier2Types.includes(h.type));

    // الطبقة الثالثة وغيرها تحل إذا لم توجد الأولى والثانية

    activeHeirs.forEach(heir => {
      // الزوجان لا يحجبان ولا يُحجبان بأي طبقة
      if (spouseTypes.includes(heir.type)) return;

      // تطبيق قاعدة حجب الطبقات
      if (hasTier1 && !tier1Types.includes(heir.type)) {
        this.blockHeir(heir, modifiedResult, 'حجب طبقة: وجود ورثة من الطبقة الأولى');
      } else if (!hasTier1 && hasTier2 && !tier2Types.includes(heir.type)) {
        this.blockHeir(heir, modifiedResult, 'حجب طبقة: وجود ورثة من الطبقة الثانية');
      }
    });

    return modifiedResult;
  }

  private blockHeir(heir: Heir, result: CalculationResult, _reason: string) {
    heir.isBlocked = true;
    if (result.shares[heir.id]) {
      delete result.shares[heir.id];
    }
  }
}
