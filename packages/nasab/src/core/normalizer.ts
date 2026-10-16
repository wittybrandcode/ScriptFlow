import { RelationType } from './enums';

/**
 * Static lookup map — built once at module load, not on every call.
 * Maps Arabic labels, legacy ScriptFlow IDs, and aliases to canonical RelationType enums.
 */
const ARABIC_TO_ENUM: Readonly<Record<string, RelationType>> = {
  // Arabic labels
  'أب': RelationType.PARENT_MALE,
  'أم': RelationType.PARENT_FEMALE,
  'ابن': RelationType.CHILD_MALE,
  'ابنة': RelationType.CHILD_FEMALE,
  'أخ': RelationType.SIBLING_MALE,
  'أخت': RelationType.SIBLING_FEMALE,
  'أخ لأب': RelationType.SIBLING_PATERNAL_MALE,
  'أخت لأب': RelationType.SIBLING_PATERNAL_FEMALE,
  'أخ لأم': RelationType.SIBLING_MATERNAL_MALE,
  'أخت لأم': RelationType.SIBLING_MATERNAL_FEMALE,
  'إخوة': RelationType.SIBLINGS,
  'زوج': RelationType.SPOUSE_MALE,
  'زوجة': RelationType.SPOUSE_FEMALE,
  'طليق': RelationType.EX_SPOUSE_MALE,
  'طليقة': RelationType.EX_SPOUSE_FEMALE,
  'مطلق رجعيا': RelationType.DIVORCED_REVOCABLE_MALE,
  'مطلق رجعياً': RelationType.DIVORCED_REVOCABLE_MALE,
  'مطلقة رجعية': RelationType.DIVORCED_REVOCABLE_FEMALE,
  'مطلق بائن': RelationType.DIVORCED_IRREVOCABLE_MALE,
  'مطلقة بائن': RelationType.DIVORCED_IRREVOCABLE_FEMALE,
  'مطلقة بائنة': RelationType.DIVORCED_IRREVOCABLE_FEMALE,
  'جد': RelationType.GRANDPARENT_MALE,
  'جدة': RelationType.GRANDPARENT_FEMALE,
  'حفيد': RelationType.GRANDCHILD_MALE,
  'حفيدة': RelationType.GRANDCHILD_FEMALE,
  'عم': RelationType.UNCLE_PATERNAL_MALE,
  'عمة': RelationType.UNCLE_PATERNAL_FEMALE,
  'خال': RelationType.UNCLE_MATERNAL_MALE,
  'خالة': RelationType.UNCLE_MATERNAL_FEMALE,
  'ابن أخ': RelationType.NEPHEW_PATERNAL_MALE,
  'ابنة أخ': RelationType.NEPHEW_PATERNAL_FEMALE,
  'ابن أخت': RelationType.NEPHEW_MATERNAL_MALE,
  'ابنة أخت': RelationType.NEPHEW_MATERNAL_FEMALE,
  'ابن عم': RelationType.COUSIN_PATERNAL_MALE,
  'ابنة عم': RelationType.COUSIN_PATERNAL_FEMALE,
  'ابن خال': RelationType.COUSIN_MATERNAL_MALE,
  'ابنة خال': RelationType.COUSIN_MATERNAL_FEMALE,
  'شريك إنجاب': RelationType.CO_PARENT_MALE,
  'شريكة إنجاب': RelationType.CO_PARENT_FEMALE,
  'أب لـ': RelationType.PARENT_MALE,
  'أم لـ': RelationType.PARENT_FEMALE,
  'أب حقيقي': RelationType.PARENT_MALE,
  'أم حقيقية': RelationType.PARENT_FEMALE,
  'أخ شقيق': RelationType.SIBLING_MALE,
  'أخت شقيقة': RelationType.SIBLING_FEMALE,
  'حما': RelationType.FATHER_IN_LAW,
  'حماة': RelationType.MOTHER_IN_LAW,
  'صهر': RelationType.SON_IN_LAW,
  'كنة': RelationType.DAUGHTER_IN_LAW,
  'معتق': RelationType.MASTER,
  'مُعتِق': RelationType.MASTER,
  'مُعتَق': RelationType.FREED_SLAVE,
  'عتيق': RelationType.FREED_SLAVE,
  'سيد': RelationType.MASTER,
  'أم من الرضاعة': RelationType.FOSTER_MOTHER,
  'أب من الرضاعة': RelationType.FOSTER_FATHER,
  'ابن من الرضاعة': RelationType.FOSTER_SON,
  'ابنة من الرضاعة': RelationType.FOSTER_DAUGHTER,
  'أخ من الرضاعة': RelationType.FOSTER_BROTHER,
  'أخت من الرضاعة': RelationType.FOSTER_SISTER,

  // ScriptFlow legacy English IDs
  'FATHER': RelationType.PARENT_MALE,
  'FATHER_OF': RelationType.PARENT_MALE,
  'MOTHER': RelationType.PARENT_FEMALE,
  'MOTHER_OF': RelationType.PARENT_FEMALE,
  // 'CHILD_OF' intentionally removed — consumer MUST specify CHILD_MALE or CHILD_FEMALE
  'HUSBAND_OF': RelationType.SPOUSE_MALE,
  'WIFE_OF': RelationType.SPOUSE_FEMALE,
  'EX_HUSBAND_OF': RelationType.EX_SPOUSE_MALE,
  'EX_WIFE_OF': RelationType.EX_SPOUSE_FEMALE,
  'SIBLING_OF': RelationType.SIBLINGS,
  'SIBLING_INFERRED': RelationType.SIBLINGS,
  'MARRIAGE': RelationType.SPOUSES,
  'EX_MARRIAGE': RelationType.EX_SPOUSES,
  'GRANDFATHER_OF': RelationType.GRANDPARENT_MALE,
  'GRANDMOTHER_OF': RelationType.GRANDPARENT_FEMALE,
  'GRANDCHILD_OF': RelationType.GRANDCHILD_MALE,
  'UNCLE_OF': RelationType.UNCLE_PATERNAL_MALE,
  'AUNT_OF': RelationType.UNCLE_PATERNAL_FEMALE,
  'NEPHEW_OF': RelationType.NEPHEW_PATERNAL_MALE,
  'COUSIN_OF': RelationType.COUSIN_PATERNAL_MALE,
  'STEPFATHER_OF': RelationType.STEP_PARENT_MALE,
  'STEPMOTHER_OF': RelationType.STEP_PARENT_FEMALE,
  'STEPCHILD_OF': RelationType.STEP_CHILD_MALE,
  'FATHER_IN_LAW_OF': RelationType.FATHER_IN_LAW,
  'MOTHER_IN_LAW_OF': RelationType.MOTHER_IN_LAW,
  'CHILD_IN_LAW_OF': RelationType.SON_IN_LAW,
  'CO_PARENTS': RelationType.CO_PARENT_MALE,
};

/**
 * Normalize any relation type string (Arabic, English legacy, or enum value)
 * to a canonical RelationType enum.
 *
 * Uses a pre-built static lookup map for O(1) performance.
 */
export function normalizeType(type: string | RelationType): RelationType {
  if (!type) return type as RelationType;
  const cleanType = String(type).trim();
  return ARABIC_TO_ENUM[cleanType] || (cleanType as RelationType);
}
