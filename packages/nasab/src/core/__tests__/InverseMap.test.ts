import { describe, it, expect } from 'vitest';
import { getInverseRelation } from '../InverseMap';
import { RelationType, Gender } from '../enums';

describe('InverseMap — اختبارات شاملة', () => {

  // ═══════════════════════════════════════════════
  // 1. الزواج (متماثل)
  // ═══════════════════════════════════════════════
  describe('الزواج', () => {
    it('SPOUSE_MALE → SPOUSE_FEMALE', () => expect(getInverseRelation(RelationType.SPOUSE_MALE)).toBe(RelationType.SPOUSE_FEMALE));
    it('SPOUSE_FEMALE → SPOUSE_MALE', () => expect(getInverseRelation(RelationType.SPOUSE_FEMALE)).toBe(RelationType.SPOUSE_MALE));
    it('EX_SPOUSE_MALE → EX_SPOUSE_FEMALE', () => expect(getInverseRelation(RelationType.EX_SPOUSE_MALE)).toBe(RelationType.EX_SPOUSE_FEMALE));
    it('EX_SPOUSE_FEMALE → EX_SPOUSE_MALE', () => expect(getInverseRelation(RelationType.EX_SPOUSE_FEMALE)).toBe(RelationType.EX_SPOUSE_MALE));
    it('SPOUSES → SPOUSES', () => expect(getInverseRelation(RelationType.SPOUSES)).toBe(RelationType.SPOUSES));
    it('EX_SPOUSES → EX_SPOUSES', () => expect(getInverseRelation(RelationType.EX_SPOUSES)).toBe(RelationType.EX_SPOUSES));
  });

  // ═══════════════════════════════════════════════
  // 2. الأبوة والبنوة
  // ═══════════════════════════════════════════════
  describe('أبوة ↔ بنوة', () => {
    it('PARENT_MALE + ذكر → CHILD_MALE', () => expect(getInverseRelation(RelationType.PARENT_MALE, Gender.MALE)).toBe(RelationType.CHILD_MALE));
    it('PARENT_MALE + أنثى → CHILD_FEMALE', () => expect(getInverseRelation(RelationType.PARENT_MALE, Gender.FEMALE)).toBe(RelationType.CHILD_FEMALE));
    it('PARENT_FEMALE + ذكر → CHILD_MALE', () => expect(getInverseRelation(RelationType.PARENT_FEMALE, Gender.MALE)).toBe(RelationType.CHILD_MALE));
    it('PARENT_FEMALE + أنثى → CHILD_FEMALE', () => expect(getInverseRelation(RelationType.PARENT_FEMALE, Gender.FEMALE)).toBe(RelationType.CHILD_FEMALE));
    it('CHILD_MALE + ذكر → PARENT_MALE', () => expect(getInverseRelation(RelationType.CHILD_MALE, Gender.MALE)).toBe(RelationType.PARENT_MALE));
    it('CHILD_MALE + أنثى → PARENT_FEMALE', () => expect(getInverseRelation(RelationType.CHILD_MALE, Gender.FEMALE)).toBe(RelationType.PARENT_FEMALE));
    it('CHILD_FEMALE + ذكر → PARENT_MALE', () => expect(getInverseRelation(RelationType.CHILD_FEMALE, Gender.MALE)).toBe(RelationType.PARENT_MALE));
    it('CHILD_FEMALE + أنثى → PARENT_FEMALE', () => expect(getInverseRelation(RelationType.CHILD_FEMALE, Gender.FEMALE)).toBe(RelationType.PARENT_FEMALE));
  });

  // ═══════════════════════════════════════════════
  // 3. الأخوة (متماثلة)
  // ═══════════════════════════════════════════════
  describe('الأخوة', () => {
    it('SIBLING_MALE + ذكر → SIBLING_MALE', () => expect(getInverseRelation(RelationType.SIBLING_MALE, Gender.MALE)).toBe(RelationType.SIBLING_MALE));
    it('SIBLING_MALE + أنثى → SIBLING_FEMALE', () => expect(getInverseRelation(RelationType.SIBLING_MALE, Gender.FEMALE)).toBe(RelationType.SIBLING_FEMALE));
    it('SIBLING_FEMALE + ذكر → SIBLING_MALE', () => expect(getInverseRelation(RelationType.SIBLING_FEMALE, Gender.MALE)).toBe(RelationType.SIBLING_MALE));
    it('SIBLING_PATERNAL_MALE + ذكر → SIBLING_PATERNAL_MALE', () => expect(getInverseRelation(RelationType.SIBLING_PATERNAL_MALE, Gender.MALE)).toBe(RelationType.SIBLING_PATERNAL_MALE));
    it('SIBLING_PATERNAL_FEMALE + أنثى → SIBLING_PATERNAL_FEMALE', () => expect(getInverseRelation(RelationType.SIBLING_PATERNAL_FEMALE, Gender.FEMALE)).toBe(RelationType.SIBLING_PATERNAL_FEMALE));
    it('SIBLING_MATERNAL_MALE + أنثى → SIBLING_MATERNAL_FEMALE', () => expect(getInverseRelation(RelationType.SIBLING_MATERNAL_MALE, Gender.FEMALE)).toBe(RelationType.SIBLING_MATERNAL_FEMALE));
    it('HALF_SIBLING_MALE + أنثى → HALF_SIBLING_FEMALE', () => expect(getInverseRelation(RelationType.HALF_SIBLING_MALE, Gender.FEMALE)).toBe(RelationType.HALF_SIBLING_FEMALE));
  });

  // ═══════════════════════════════════════════════
  // 4. الأجداد والأحفاد
  // ═══════════════════════════════════════════════
  describe('أجداد ↔ أحفاد', () => {
    it('GRANDPARENT_MALE + ذكر → GRANDCHILD_MALE', () => expect(getInverseRelation(RelationType.GRANDPARENT_MALE, Gender.MALE)).toBe(RelationType.GRANDCHILD_MALE));
    it('GRANDPARENT_MALE + أنثى → GRANDCHILD_FEMALE', () => expect(getInverseRelation(RelationType.GRANDPARENT_MALE, Gender.FEMALE)).toBe(RelationType.GRANDCHILD_FEMALE));
    it('GRANDPARENT_FEMALE + ذكر → GRANDCHILD_MALE', () => expect(getInverseRelation(RelationType.GRANDPARENT_FEMALE, Gender.MALE)).toBe(RelationType.GRANDCHILD_MALE));
    it('GRANDCHILD_MALE + ذكر → GRANDPARENT_MALE', () => expect(getInverseRelation(RelationType.GRANDCHILD_MALE, Gender.MALE)).toBe(RelationType.GRANDPARENT_MALE));
    it('GRANDCHILD_FEMALE + أنثى → GRANDPARENT_FEMALE', () => expect(getInverseRelation(RelationType.GRANDCHILD_FEMALE, Gender.FEMALE)).toBe(RelationType.GRANDPARENT_FEMALE));
  });

  // ═══════════════════════════════════════════════
  // 5. الأعمام/الأخوال ↔ أبناء الأخ
  // ═══════════════════════════════════════════════
  describe('عمومة ↔ أبناء أخ', () => {
    it('UNCLE_PATERNAL_MALE + ذكر → NEPHEW_PATERNAL_MALE', () => expect(getInverseRelation(RelationType.UNCLE_PATERNAL_MALE, Gender.MALE)).toBe(RelationType.NEPHEW_PATERNAL_MALE));
    it('UNCLE_PATERNAL_MALE + أنثى → NEPHEW_PATERNAL_FEMALE', () => expect(getInverseRelation(RelationType.UNCLE_PATERNAL_MALE, Gender.FEMALE)).toBe(RelationType.NEPHEW_PATERNAL_FEMALE));
    it('UNCLE_PATERNAL_FEMALE + ذكر → NEPHEW_PATERNAL_MALE', () => expect(getInverseRelation(RelationType.UNCLE_PATERNAL_FEMALE, Gender.MALE)).toBe(RelationType.NEPHEW_PATERNAL_MALE));
    it('UNCLE_MATERNAL_MALE + ذكر → NEPHEW_MATERNAL_MALE', () => expect(getInverseRelation(RelationType.UNCLE_MATERNAL_MALE, Gender.MALE)).toBe(RelationType.NEPHEW_MATERNAL_MALE));
    it('UNCLE_MATERNAL_FEMALE + أنثى → NEPHEW_MATERNAL_FEMALE', () => expect(getInverseRelation(RelationType.UNCLE_MATERNAL_FEMALE, Gender.FEMALE)).toBe(RelationType.NEPHEW_MATERNAL_FEMALE));
    it('NEPHEW_PATERNAL_MALE + ذكر → UNCLE_PATERNAL_MALE', () => expect(getInverseRelation(RelationType.NEPHEW_PATERNAL_MALE, Gender.MALE)).toBe(RelationType.UNCLE_PATERNAL_MALE));
    it('NEPHEW_MATERNAL_FEMALE + ذكر → UNCLE_MATERNAL_MALE', () => expect(getInverseRelation(RelationType.NEPHEW_MATERNAL_FEMALE, Gender.MALE)).toBe(RelationType.UNCLE_MATERNAL_MALE));
  });

  // ═══════════════════════════════════════════════
  // 6. أبناء العم (متماثل)
  // ═══════════════════════════════════════════════
  describe('أبناء العم', () => {
    it('COUSIN_PATERNAL_MALE + أنثى → COUSIN_PATERNAL_FEMALE', () => expect(getInverseRelation(RelationType.COUSIN_PATERNAL_MALE, Gender.FEMALE)).toBe(RelationType.COUSIN_PATERNAL_FEMALE));
    it('COUSIN_PATERNAL_FEMALE + ذكر → COUSIN_PATERNAL_MALE', () => expect(getInverseRelation(RelationType.COUSIN_PATERNAL_FEMALE, Gender.MALE)).toBe(RelationType.COUSIN_PATERNAL_MALE));
    it('COUSIN_MATERNAL_MALE + أنثى → COUSIN_MATERNAL_FEMALE', () => expect(getInverseRelation(RelationType.COUSIN_MATERNAL_MALE, Gender.FEMALE)).toBe(RelationType.COUSIN_MATERNAL_FEMALE));
    it('COUSIN_MATERNAL_FEMALE + ذكر → COUSIN_MATERNAL_MALE', () => expect(getInverseRelation(RelationType.COUSIN_MATERNAL_FEMALE, Gender.MALE)).toBe(RelationType.COUSIN_MATERNAL_MALE));
  });

  // ═══════════════════════════════════════════════
  // 7. الأصهار (In-Laws)
  // ═══════════════════════════════════════════════
  describe('الأصهار', () => {
    it('FATHER_IN_LAW → SON_IN_LAW', () => expect(getInverseRelation(RelationType.FATHER_IN_LAW)).toBe(RelationType.SON_IN_LAW));
    it('SON_IN_LAW → FATHER_IN_LAW', () => expect(getInverseRelation(RelationType.SON_IN_LAW)).toBe(RelationType.FATHER_IN_LAW));
    it('MOTHER_IN_LAW → DAUGHTER_IN_LAW', () => expect(getInverseRelation(RelationType.MOTHER_IN_LAW)).toBe(RelationType.DAUGHTER_IN_LAW));
    it('DAUGHTER_IN_LAW → MOTHER_IN_LAW', () => expect(getInverseRelation(RelationType.DAUGHTER_IN_LAW)).toBe(RelationType.MOTHER_IN_LAW));
  });

  // ═══════════════════════════════════════════════
  // 8. الأبوة بالربيب (Step)
  // ═══════════════════════════════════════════════
  describe('ربائب', () => {
    it('STEP_PARENT_MALE + ذكر → STEP_CHILD_MALE', () => expect(getInverseRelation(RelationType.STEP_PARENT_MALE, Gender.MALE)).toBe(RelationType.STEP_CHILD_MALE));
    it('STEP_PARENT_MALE + أنثى → STEP_CHILD_FEMALE', () => expect(getInverseRelation(RelationType.STEP_PARENT_MALE, Gender.FEMALE)).toBe(RelationType.STEP_CHILD_FEMALE));
    it('STEP_CHILD_MALE + ذكر → STEP_PARENT_MALE', () => expect(getInverseRelation(RelationType.STEP_CHILD_MALE, Gender.MALE)).toBe(RelationType.STEP_PARENT_MALE));
    it('STEP_CHILD_FEMALE + أنثى → STEP_PARENT_FEMALE', () => expect(getInverseRelation(RelationType.STEP_CHILD_FEMALE, Gender.FEMALE)).toBe(RelationType.STEP_PARENT_FEMALE));
  });

  // ═══════════════════════════════════════════════
  // 9. التبني
  // ═══════════════════════════════════════════════
  describe('التبني', () => {
    it('ADOPTIVE_PARENT_MALE + ذكر → ADOPTED_CHILD_MALE', () => expect(getInverseRelation(RelationType.ADOPTIVE_PARENT_MALE, Gender.MALE)).toBe(RelationType.ADOPTED_CHILD_MALE));
    it('ADOPTIVE_PARENT_FEMALE + أنثى → ADOPTED_CHILD_FEMALE', () => expect(getInverseRelation(RelationType.ADOPTIVE_PARENT_FEMALE, Gender.FEMALE)).toBe(RelationType.ADOPTED_CHILD_FEMALE));
    it('ADOPTED_CHILD_MALE + ذكر → ADOPTIVE_PARENT_MALE', () => expect(getInverseRelation(RelationType.ADOPTED_CHILD_MALE, Gender.MALE)).toBe(RelationType.ADOPTIVE_PARENT_MALE));
    it('ADOPTED_CHILD_FEMALE + أنثى → ADOPTIVE_PARENT_FEMALE', () => expect(getInverseRelation(RelationType.ADOPTED_CHILD_FEMALE, Gender.FEMALE)).toBe(RelationType.ADOPTIVE_PARENT_FEMALE));
  });

  // ═══════════════════════════════════════════════
  // 10. شركاء الإنجاب (متماثل)
  // ═══════════════════════════════════════════════
  describe('شركاء الإنجاب', () => {
    it('CO_PARENT_MALE + ذكر → CO_PARENT_MALE', () => expect(getInverseRelation(RelationType.CO_PARENT_MALE, Gender.MALE)).toBe(RelationType.CO_PARENT_MALE));
    it('CO_PARENT_FEMALE + ذكر → CO_PARENT_MALE', () => expect(getInverseRelation(RelationType.CO_PARENT_FEMALE, Gender.MALE)).toBe(RelationType.CO_PARENT_MALE));
  });

  // ═══════════════════════════════════════════════
  // 11. حالات حدية
  // ═══════════════════════════════════════════════
  describe('حالات حدية', () => {
    it('نوع غير معروف → null', () => {
      expect(getInverseRelation('UNKNOWN_TYPE' as any)).toBeNull();
    });
  });
});
