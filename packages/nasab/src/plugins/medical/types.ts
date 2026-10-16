export type InheritancePattern = 
  | 'AUTOSOMAL_DOMINANT'
  | 'AUTOSOMAL_RECESSIVE'
  | 'X_LINKED_DOMINANT'
  | 'X_LINKED_RECESSIVE'
  | 'Y_LINKED';

export type MedicalStatus = 'AFFECTED' | 'CARRIER' | 'UNAFFECTED' | 'UNKNOWN';

export interface Condition {
  id: string;
  name: string;
  inheritancePattern: InheritancePattern;
  // If baseline frequency is needed for unknown founders (default is rare e.g. 0.0)
  baselineAlleleFrequency?: number; 
}

interface PersonCondition {
  conditionId: string;
  status: MedicalStatus;
}

export interface MedicalPerson {
  id: string;
  gender: 'MALE' | 'FEMALE';
  conditions: PersonCondition[];
  fatherId?: string | null;
  motherId?: string | null;
}

export interface ConditionProbability {
  affected: number;      // 0.0 to 1.0
  carrier: number;       // 0.0 to 1.0  (always 0 for AD and males with X_LINKED/Y_LINKED)
  unaffected: number;    // 0.0 to 1.0
  // Raw probabilities of risk allele copies (0, 1, 2)
  copies: {
    0: number;
    1: number;
    2: number;
  };
}

export interface MedicalResult {
  personId: string;
  conditionId: string;
  probability: ConditionProbability;
}
