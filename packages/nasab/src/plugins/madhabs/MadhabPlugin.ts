import { NasabPlugin, PluginType } from '../core/NasabPlugin';
import { CalculationResult } from '../../engine/BaseEngine';
import { Heir } from '../../types/Kinship';
import { Madhab } from '../../types/FiqhAST';

export interface MadhabPlugin extends NasabPlugin {
  readonly type: PluginType.MADHAB;
  /** The specific school of jurisprudence this plugin implements. */
  readonly madhab: Madhab;
  
  /**
   * Applies specific overrides for the Madhab (e.g., Al-Musharraka, Al-Akdariya).
   *
   * @param heirs - The heirs in the case.
   * @param result - The current calculation result.
   */
  applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult;
}
