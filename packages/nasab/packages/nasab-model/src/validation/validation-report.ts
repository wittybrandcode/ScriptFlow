import { UUID } from '../entities/person';

export type ValidationErrorCode = 
  | 'ERR_BIOLOGICAL_MULTIPLE_FATHERS' 
  | 'ERR_BIOLOGICAL_AGE_HIERARCHY'
  | 'ERR_GENDER_MISMATCH'
  | 'ERR_TEMPORAL_DEATH_BEFORE_BIRTH'
  | 'ERR_TEMPORAL_MARRIAGE_AFTER_DEATH'
  | 'ERR_TEMPORAL_POLYGAMY_VIOLATION'
  | 'ERR_TEMPORAL_IDDAH_VIOLATION'
  | 'ERR_FIQH_SURVIVORSHIP'
  | 'ERR_FIQH_CROSS_BLOCKING';

export interface ValidationError {
  errorCode: ValidationErrorCode | string;
  involvedNodes: UUID[]; // العقد أو الأحداث التي تسببت بالتناقض
  message: string;
}

export interface ValidationWarning {
  warningCode: string;
  involvedNodes: UUID[];
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  timestamp: Date;
}
