/**
 * Kinship Ontology based on `docs-knowledge/kinship_ontology.md`
 */

type Gender = 'MALE' | 'FEMALE';

type KinshipDirection = 'DESCENDANT' | 'ANCESTOR' | 'COLLATERAL' | 'MARITAL';

export type HeirType =
  | 'SON'
  | 'DAUGHTER'
  | 'SON_OF_SON'
  | 'DAUGHTER_OF_SON'
  | 'FATHER'
  | 'MOTHER'
  | 'GRANDFATHER'
  | 'GRANDMOTHER_P'
  | 'GRANDMOTHER_M'
  | 'FULL_BROTHER'
  | 'FULL_SISTER'
  | 'AGNATIC_BROTHER'
  | 'AGNATIC_SISTER'
  | 'UTERINE_BROTHER'
  | 'UTERINE_SISTER'
  | 'FULL_BROTHER_SON'
  | 'AGNATIC_BROTHER_SON'
  | 'FULL_UNCLE'
  | 'AGNATIC_UNCLE'
  | 'SPOUSE_MALE'
  | 'SPOUSE_FEMALE'
  // Distant Kindred (ذوو الأرحام)
  | 'DAUGHTER_SON'
  | 'DAUGHTER_DAUGHTER'
  | 'FULL_SISTER_DAUGHTER'
  | 'FULL_BROTHER_DAUGHTER'
  | 'FULL_SISTER_SON'
  | 'MATERNAL_UNCLE'
  | 'MATERNAL_AUNT'
  | 'PATERNAL_AUNT'
  | 'MATERNAL_GRANDFATHER';

export interface KinshipWeight {
  direction: KinshipDirection;
  weight: number; // 100, 95, 90, etc.
}

export const KinshipOntology: Record<HeirType, KinshipWeight> = {
  SON: { direction: 'DESCENDANT', weight: 100 },
  DAUGHTER: { direction: 'DESCENDANT', weight: 100 },
  SON_OF_SON: { direction: 'DESCENDANT', weight: 95 },
  DAUGHTER_OF_SON: { direction: 'DESCENDANT', weight: 95 },
  FATHER: { direction: 'ANCESTOR', weight: 90 },
  MOTHER: { direction: 'ANCESTOR', weight: 90 },
  GRANDFATHER: { direction: 'ANCESTOR', weight: 85 },
  GRANDMOTHER_P: { direction: 'ANCESTOR', weight: 80 },
  GRANDMOTHER_M: { direction: 'ANCESTOR', weight: 80 },
  FULL_BROTHER: { direction: 'COLLATERAL', weight: 75 },
  FULL_SISTER: { direction: 'COLLATERAL', weight: 75 },
  AGNATIC_BROTHER: { direction: 'COLLATERAL', weight: 70 },
  AGNATIC_SISTER: { direction: 'COLLATERAL', weight: 70 },
  UTERINE_BROTHER: { direction: 'COLLATERAL', weight: 65 },
  UTERINE_SISTER: { direction: 'COLLATERAL', weight: 65 },
  FULL_BROTHER_SON: { direction: 'COLLATERAL', weight: 64 },
  AGNATIC_BROTHER_SON: { direction: 'COLLATERAL', weight: 63 },
  FULL_UNCLE: { direction: 'COLLATERAL', weight: 60 },
  AGNATIC_UNCLE: { direction: 'COLLATERAL', weight: 55 },
  SPOUSE_MALE: { direction: 'MARITAL', weight: 110 },
  SPOUSE_FEMALE: { direction: 'MARITAL', weight: 110 },
  // Distant Kindred weights (based on their equivalent closest heir)
  DAUGHTER_SON: { direction: 'DESCENDANT', weight: 40 },
  DAUGHTER_DAUGHTER: { direction: 'DESCENDANT', weight: 40 },
  FULL_SISTER_DAUGHTER: { direction: 'COLLATERAL', weight: 30 },
  FULL_BROTHER_DAUGHTER: { direction: 'COLLATERAL', weight: 30 },
  FULL_SISTER_SON: { direction: 'COLLATERAL', weight: 30 },
  MATERNAL_UNCLE: { direction: 'COLLATERAL', weight: 25 },
  MATERNAL_AUNT: { direction: 'COLLATERAL', weight: 25 },
  PATERNAL_AUNT: { direction: 'COLLATERAL', weight: 25 },
  MATERNAL_GRANDFATHER: { direction: 'ANCESTOR', weight: 20 }
};

export interface Heir {
  id: string;
  type: HeirType;
  gender: Gender;
  isBlocked?: boolean;
  blockedBy?: string[]; // IDs of blocking heirs
  // Phase 2: Validation fields
  age?: number; // Age of the heir (for parent-child age gap checks)
  parentIds?: string[]; // IDs of parents (for cycle & incest detection)
  spouseIds?: string[]; // IDs of spouses (for incest detection)
  isHermaphrodite?: boolean; // الخنثى المشكل
  isMissing?: boolean; // المفقود
  isFetus?: boolean; // الحمل
}
