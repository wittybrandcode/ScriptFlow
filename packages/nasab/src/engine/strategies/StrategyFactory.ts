import { Madhab } from '../../types/FiqhAST';
import { MadhabStrategy } from './MadhabStrategy';
import { ShafiiStrategy } from './ShafiiStrategy';
import { HanafiStrategy } from './HanafiStrategy';

export class DefaultStrategy implements MadhabStrategy {
  public applyOverrides(heirs: any[], result: any) {
    return result; // No overrides
  }
}

export class StrategyFactory {
  public static getStrategy(madhab: Madhab): MadhabStrategy {
    switch (madhab) {
      case 'SHAFII':
      case 'MALIKI':
        return new ShafiiStrategy();
      case 'HANAFI':
        return new HanafiStrategy();
      case 'HANBALI':
      case 'COMMON':
      default:
        return new DefaultStrategy();
    }
  }
}
