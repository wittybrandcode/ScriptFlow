/**
 * Fiqh AST Schema based on `docs-knowledge/fiqh_ast_concept.md`
 */
import { HeirType } from './Kinship';

export type Madhab = 'HANAFI' | 'SHAFII' | 'MALIKI' | 'HANBALI' | 'JAFARI' | 'COMMON';

interface FiqhRulePattern {
  requiredHeirs: HeirType[];
  excludedHeirs?: HeirType[];
  minCount?: Partial<Record<HeirType, number>>;
}

interface FiqhRuleAction {
  type: 'BLOCK' | 'ASSIGN' | 'REMAP' | 'ADJUST_AWL';
  target: HeirType | HeirType[];
  value?: string; // e.g. "1/6", "ASABA", "AKDARIYA_MIX"
  reason: string; // Arabic explanation text
}

export interface FiqhRule {
  id: string;
  madhab: Madhab;
  priority: number;
  pattern: FiqhRulePattern;
  actions: FiqhRuleAction[];
  basis?: string; // Textual proof from Quran/Sunnah/Ijma
}
