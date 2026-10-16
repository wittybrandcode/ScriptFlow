import { MadhabPlugin } from './MadhabPlugin';
import { PluginType } from '../core/NasabPlugin';
import { ShafiiPlugin } from './ShafiiPlugin';
import { Heir } from '../../types/Kinship';
import { CalculationResult } from '../../engine/BaseEngine';

export class MalikiPlugin implements MadhabPlugin {
  public readonly metadata = {
    id: 'madhab-maliki',
    name: 'المذهب المالكي',
    version: '1.0.0',
    description: 'تطبيق التعديلات الفقهية الخاصة بالمذهب المالكي.',
  };

  public readonly type = PluginType.MADHAB;
  public readonly madhab = 'MALIKI';

  // Maliki also applies Al-Musharraka exactly like Shafii
  private internalShafiiHelper = new ShafiiPlugin();

  public applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult {
    // Under typical cases, Maliki resolves Musharraka the same as Shafii.
    return this.internalShafiiHelper.applyOverrides(heirs, result);
  }
}

