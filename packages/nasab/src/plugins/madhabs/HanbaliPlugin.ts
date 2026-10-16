import { MadhabPlugin } from './MadhabPlugin';
import { PluginType } from '../core/NasabPlugin';
import { Heir } from '../../types/Kinship';
import { CalculationResult } from '../../engine/BaseEngine';

export class HanbaliPlugin implements MadhabPlugin {
  public readonly metadata = {
    id: 'madhab-hanbali',
    name: 'المذهب الحنبلي',
    version: '1.0.0',
    description: 'تطبيق التعديلات الفقهية الخاصة بالمذهب الحنبلي.',
  };

  public readonly type = PluginType.MADHAB;
  public readonly madhab = 'HANBALI';

  public applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult {
    // Hanbali uses the default/common resolution for Musharraka (no sharing, brothers get Asaba which is 0)
    // And does not block brothers with grandfather like Hanafi.
    // So for now, it's a pass-through (or essentially COMMON).
    return result;
  }
}

