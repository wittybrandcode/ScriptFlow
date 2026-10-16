import { Heir } from '../../types/Kinship';
import { CalculationResult } from '../BaseEngine';

export interface MadhabStrategy {
  /**
   * Applies Madhab-specific overrides (like Al-Musharraka or Al-Akdariya) 
   * after the initial core calculation but before Tashih.
   */
  applyOverrides(heirs: Heir[], result: CalculationResult): CalculationResult;
}
