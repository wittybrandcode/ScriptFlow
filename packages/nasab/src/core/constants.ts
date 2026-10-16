import { RelationType } from './enums';

/**
 * Canonical relation categories for UI consumption.
 * Single source of truth.
 */
export const RELATION_CATEGORIES = {
  SPOUSE: {
    label: 'علاقة زوجية',
    options: [
      { label: 'زوج', value: RelationType.SPOUSE_MALE },
      { label: 'زوجة', value: RelationType.SPOUSE_FEMALE },
      { label: 'طليق', value: RelationType.EX_SPOUSE_MALE },
      { label: 'طليقة', value: RelationType.EX_SPOUSE_FEMALE }
    ]
  },
  DIVORCE: {
    label: 'طلاق',
    options: [
      { label: 'مطلق رجعياً', value: RelationType.DIVORCED_REVOCABLE_MALE },
      { label: 'مطلقة رجعية', value: RelationType.DIVORCED_REVOCABLE_FEMALE },
      { label: 'مطلق بائن', value: RelationType.DIVORCED_IRREVOCABLE_MALE },
      { label: 'مطلقة بائنة', value: RelationType.DIVORCED_IRREVOCABLE_FEMALE },
    ]
  },
  PARENT_CHILD: {
    label: 'آباء وأبناء',
    options: [
      { label: 'أب', value: RelationType.PARENT_MALE },
      { label: 'أم', value: RelationType.PARENT_FEMALE },
      { label: 'ابن', value: RelationType.CHILD_MALE },
      { label: 'ابنة', value: RelationType.CHILD_FEMALE }
    ]
  },
  SIBLINGS: {
    label: 'إخوة وأخوات',
    options: [
      { label: 'أخ شقيق', value: RelationType.SIBLING_MALE },
      { label: 'أخت شقيقة', value: RelationType.SIBLING_FEMALE },
      { label: 'أخ لأب', value: RelationType.SIBLING_PATERNAL_MALE },
      { label: 'أخت لأب', value: RelationType.SIBLING_PATERNAL_FEMALE },
      { label: 'أخ لأم', value: RelationType.SIBLING_MATERNAL_MALE },
      { label: 'أخت لأم', value: RelationType.SIBLING_MATERNAL_FEMALE },
      { label: 'أخ غير شقيق (عام)', value: RelationType.HALF_SIBLING_MALE },
      { label: 'أخت غير شقيقة (عام)', value: RelationType.HALF_SIBLING_FEMALE }
    ]
  },
  GRAND_RELATIONS: {
    label: 'أجداد وأحفاد',
    options: [
      { label: 'جد', value: RelationType.GRANDPARENT_MALE },
      { label: 'جدة', value: RelationType.GRANDPARENT_FEMALE },
      { label: 'حفيد', value: RelationType.GRANDCHILD_MALE },
      { label: 'حفيدة', value: RelationType.GRANDCHILD_FEMALE }
    ]
  },
  UNCLES_AUNTS: {
    label: 'أعمام وأخوال',
    options: [
      { label: 'عم', value: RelationType.UNCLE_PATERNAL_MALE },
      { label: 'عمة', value: RelationType.UNCLE_PATERNAL_FEMALE },
      { label: 'خال', value: RelationType.UNCLE_MATERNAL_MALE },
      { label: 'خالة', value: RelationType.UNCLE_MATERNAL_FEMALE }
    ]
  },
  COUSINS: {
    label: 'أبناء العمومة والخؤولة',
    options: [
      { label: 'ابن عم', value: RelationType.COUSIN_PATERNAL_MALE },
      { label: 'ابنة عم', value: RelationType.COUSIN_PATERNAL_FEMALE },
      { label: 'ابن خال', value: RelationType.COUSIN_MATERNAL_MALE },
      { label: 'ابنة خال', value: RelationType.COUSIN_MATERNAL_FEMALE }
    ]
  },
  NEPHEWS_NIECES: {
    label: 'أبناء الإخوة',
    options: [
      { label: 'ابن أخ', value: RelationType.NEPHEW_PATERNAL_MALE },
      { label: 'ابنة أخ', value: RelationType.NEPHEW_PATERNAL_FEMALE },
      { label: 'ابن أخت', value: RelationType.NEPHEW_MATERNAL_MALE },
      { label: 'ابنة أخت', value: RelationType.NEPHEW_MATERNAL_FEMALE }
    ]
  },
  IN_LAWS: {
    label: 'مصاهرة (أنساب)',
    options: [
      { label: 'حما', value: RelationType.FATHER_IN_LAW },
      { label: 'حماة', value: RelationType.MOTHER_IN_LAW },
      { label: 'صهر', value: RelationType.SON_IN_LAW },
      { label: 'كنة', value: RelationType.DAUGHTER_IN_LAW }
    ]
  },
  ADOPTION: {
    label: 'تربية وتبني',
    options: [
      { label: 'أب بالتبني', value: RelationType.ADOPTIVE_PARENT_MALE },
      { label: 'أم بالتبني', value: RelationType.ADOPTIVE_PARENT_FEMALE },
      { label: 'ابن بالتبني', value: RelationType.ADOPTED_CHILD_MALE },
      { label: 'ابنة بالتبني', value: RelationType.ADOPTED_CHILD_FEMALE }
    ]
  },
  STEP_RELATIONS: {
    label: 'زواج أم / زوجة أب',
    options: [
      { label: 'زوج الأم', value: RelationType.STEP_PARENT_MALE },
      { label: 'زوجة الأب', value: RelationType.STEP_PARENT_FEMALE },
      { label: 'ربيب', value: RelationType.STEP_CHILD_MALE },
      { label: 'ربيبة', value: RelationType.STEP_CHILD_FEMALE },
    ]
  },
  MASTER_SLAVE: {
    label: 'ولاء وعتق',
    options: [
      { label: 'سيد / مُعتِق', value: RelationType.MASTER },
      { label: 'مُعتَق / عتيق', value: RelationType.FREED_SLAVE }
    ]
  },
  FOSTER: {
    label: 'رضاع',
    options: [
      { label: 'أم من الرضاع', value: RelationType.FOSTER_MOTHER },
      { label: 'أب من الرضاع', value: RelationType.FOSTER_FATHER },
      { label: 'ابن من الرضاع', value: RelationType.FOSTER_SON },
      { label: 'ابنة من الرضاع', value: RelationType.FOSTER_DAUGHTER },
      { label: 'أخ من الرضاع', value: RelationType.FOSTER_BROTHER },
      { label: 'أخت من الرضاع', value: RelationType.FOSTER_SISTER }
    ]
  }
} as const;
