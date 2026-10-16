import { RelationType, Gender } from './enums';
import { normalizeType } from './normalizer';

/**
 * Given a relation type (A -> B), returns the exact reverse relation type (B -> A).
 * Example: If A is the FATHER of B, then B is the CHILD of A.
 * 
 * @param rawType The outbound relation type (e.g. PARENT_MALE)
 * @param targetGender The gender of the target node B to determine exact reverse type
 */
export function getInverseRelation(rawType: string | RelationType, targetGender?: string | Gender): RelationType | null {
  const type = normalizeType(rawType);
  
  // === Marriage ===
  if (type === RelationType.SPOUSE_MALE) return RelationType.SPOUSE_FEMALE;
  if (type === RelationType.SPOUSE_FEMALE) return RelationType.SPOUSE_MALE;
  if (type === RelationType.EX_SPOUSE_MALE) return RelationType.EX_SPOUSE_FEMALE;
  if (type === RelationType.EX_SPOUSE_FEMALE) return RelationType.EX_SPOUSE_MALE;
  
  if (type === RelationType.DIVORCED_REVOCABLE_MALE) return RelationType.DIVORCED_REVOCABLE_FEMALE;
  if (type === RelationType.DIVORCED_REVOCABLE_FEMALE) return RelationType.DIVORCED_REVOCABLE_MALE;
  if (type === RelationType.DIVORCED_IRREVOCABLE_MALE) return RelationType.DIVORCED_IRREVOCABLE_FEMALE;
  if (type === RelationType.DIVORCED_IRREVOCABLE_FEMALE) return RelationType.DIVORCED_IRREVOCABLE_MALE;

  if (type === RelationType.SPOUSES) return RelationType.SPOUSES;
  if (type === RelationType.EX_SPOUSES) return RelationType.EX_SPOUSES;

  // === Direct Parentage ===
  if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.CHILD_MALE : RelationType.CHILD_FEMALE;
  }
  if (type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.PARENT_MALE : RelationType.PARENT_FEMALE;
  }

  // === Full Siblings (symmetric) ===
  if (type === RelationType.SIBLING_MALE || type === RelationType.SIBLING_FEMALE || type === RelationType.SIBLINGS) {
    return targetGender === Gender.MALE ? RelationType.SIBLING_MALE : RelationType.SIBLING_FEMALE;
  }

  // === Paternal Half-Siblings (symmetric) ===
  if (type === RelationType.SIBLING_PATERNAL_MALE || type === RelationType.SIBLING_PATERNAL_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.SIBLING_PATERNAL_MALE : RelationType.SIBLING_PATERNAL_FEMALE;
  }
  
  // === Maternal Half-Siblings (symmetric) ===
  if (type === RelationType.SIBLING_MATERNAL_MALE || type === RelationType.SIBLING_MATERNAL_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.SIBLING_MATERNAL_MALE : RelationType.SIBLING_MATERNAL_FEMALE;
  }

  // === Generic Half-Siblings (symmetric) ===
  if (type === RelationType.HALF_SIBLING_MALE || type === RelationType.HALF_SIBLING_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.HALF_SIBLING_MALE : RelationType.HALF_SIBLING_FEMALE;
  }

  // === Grandparents ↔ Grandchildren ===
  if (type === RelationType.GRANDPARENT_MALE || type === RelationType.GRANDPARENT_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.GRANDCHILD_MALE : RelationType.GRANDCHILD_FEMALE;
  }
  if (type === RelationType.GRANDCHILD_MALE || type === RelationType.GRANDCHILD_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.GRANDPARENT_MALE : RelationType.GRANDPARENT_FEMALE;
  }

  // === Paternal Uncles/Aunts ↔ Paternal Nephews/Nieces (BUG-3 fix: separated from maternal) ===
  if (type === RelationType.UNCLE_PATERNAL_MALE || type === RelationType.UNCLE_PATERNAL_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.NEPHEW_PATERNAL_MALE : RelationType.NEPHEW_PATERNAL_FEMALE;
  }
  if (type === RelationType.NEPHEW_PATERNAL_MALE || type === RelationType.NEPHEW_PATERNAL_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.UNCLE_PATERNAL_MALE : RelationType.UNCLE_PATERNAL_FEMALE;
  }

  // === Maternal Uncles/Aunts ↔ Maternal Nephews/Nieces (BUG-3 fix) ===
  if (type === RelationType.UNCLE_MATERNAL_MALE || type === RelationType.UNCLE_MATERNAL_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.NEPHEW_MATERNAL_MALE : RelationType.NEPHEW_MATERNAL_FEMALE;
  }
  if (type === RelationType.NEPHEW_MATERNAL_MALE || type === RelationType.NEPHEW_MATERNAL_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.UNCLE_MATERNAL_MALE : RelationType.UNCLE_MATERNAL_FEMALE;
  }

  // === Co-Parents (symmetric) ===
  if (type === RelationType.CO_PARENT_MALE || type === RelationType.CO_PARENT_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.CO_PARENT_MALE : RelationType.CO_PARENT_FEMALE;
  }

  // === Cousins (symmetric) — BUG-4 fix ===
  if (type === RelationType.COUSIN_PATERNAL_MALE || type === RelationType.COUSIN_PATERNAL_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.COUSIN_PATERNAL_MALE : RelationType.COUSIN_PATERNAL_FEMALE;
  }
  if (type === RelationType.COUSIN_MATERNAL_MALE || type === RelationType.COUSIN_MATERNAL_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.COUSIN_MATERNAL_MALE : RelationType.COUSIN_MATERNAL_FEMALE;
  }

  // === In-Laws — BUG-4 fix ===
  if (type === RelationType.FATHER_IN_LAW) return RelationType.SON_IN_LAW;
  if (type === RelationType.MOTHER_IN_LAW) return RelationType.DAUGHTER_IN_LAW;
  if (type === RelationType.SON_IN_LAW) return RelationType.FATHER_IN_LAW;
  if (type === RelationType.DAUGHTER_IN_LAW) return RelationType.MOTHER_IN_LAW;

  // === Adoption — BUG-4 fix ===
  if (type === RelationType.ADOPTIVE_PARENT_MALE || type === RelationType.ADOPTIVE_PARENT_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.ADOPTED_CHILD_MALE : RelationType.ADOPTED_CHILD_FEMALE;
  }
  if (type === RelationType.ADOPTED_CHILD_MALE || type === RelationType.ADOPTED_CHILD_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.ADOPTIVE_PARENT_MALE : RelationType.ADOPTIVE_PARENT_FEMALE;
  }

  // === Step-parents — NEW types ===
  if (type === RelationType.STEP_PARENT_MALE || type === RelationType.STEP_PARENT_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.STEP_CHILD_MALE : RelationType.STEP_CHILD_FEMALE;
  }
  if (type === RelationType.STEP_CHILD_MALE || type === RelationType.STEP_CHILD_FEMALE) {
    return targetGender === Gender.MALE ? RelationType.STEP_PARENT_MALE : RelationType.STEP_PARENT_FEMALE;
  }

  // === Walaa / Emancipation ===
  if (type === RelationType.MASTER) return RelationType.FREED_SLAVE;
  if (type === RelationType.FREED_SLAVE) return RelationType.MASTER;

  // === Foster / Radhaa' ===
  if (type === RelationType.FOSTER_MOTHER || type === RelationType.FOSTER_FATHER) {
    return targetGender === Gender.MALE ? RelationType.FOSTER_SON : RelationType.FOSTER_DAUGHTER;
  }
  if (type === RelationType.FOSTER_SON || type === RelationType.FOSTER_DAUGHTER) {
    return targetGender === Gender.MALE ? RelationType.FOSTER_FATHER : RelationType.FOSTER_MOTHER;
  }
  if (type === RelationType.FOSTER_BROTHER || type === RelationType.FOSTER_SISTER) {
    return targetGender === Gender.MALE ? RelationType.FOSTER_BROTHER : RelationType.FOSTER_SISTER;
  }

  return null;
}
