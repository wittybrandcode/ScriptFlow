import { describe, it, expect } from 'vitest';
import { normalizeType } from '../normalizer';
import { RelationType } from '../enums';

describe('Normalizer — اختبارات شاملة', () => {

  // ═══════════════════════════════════════════════
  // 1. العلاقات العربية الأساسية
  // ═══════════════════════════════════════════════
  describe('عربي أساسي', () => {
    it('أب → PARENT_MALE', () => expect(normalizeType('أب')).toBe(RelationType.PARENT_MALE));
    it('أم → PARENT_FEMALE', () => expect(normalizeType('أم')).toBe(RelationType.PARENT_FEMALE));
    it('ابن → CHILD_MALE', () => expect(normalizeType('ابن')).toBe(RelationType.CHILD_MALE));
    it('ابنة → CHILD_FEMALE', () => expect(normalizeType('ابنة')).toBe(RelationType.CHILD_FEMALE));
    it('أخ → SIBLING_MALE', () => expect(normalizeType('أخ')).toBe(RelationType.SIBLING_MALE));
    it('أخت → SIBLING_FEMALE', () => expect(normalizeType('أخت')).toBe(RelationType.SIBLING_FEMALE));
    it('زوج → SPOUSE_MALE', () => expect(normalizeType('زوج')).toBe(RelationType.SPOUSE_MALE));
    it('زوجة → SPOUSE_FEMALE', () => expect(normalizeType('زوجة')).toBe(RelationType.SPOUSE_FEMALE));
  });

  // ═══════════════════════════════════════════════
  // 2. العلاقات العربية الفرعية
  // ═══════════════════════════════════════════════
  describe('عربي فرعي', () => {
    it('أخ لأب', () => expect(normalizeType('أخ لأب')).toBe(RelationType.SIBLING_PATERNAL_MALE));
    it('أخت لأب', () => expect(normalizeType('أخت لأب')).toBe(RelationType.SIBLING_PATERNAL_FEMALE));
    it('أخ لأم', () => expect(normalizeType('أخ لأم')).toBe(RelationType.SIBLING_MATERNAL_MALE));
    it('أخت لأم', () => expect(normalizeType('أخت لأم')).toBe(RelationType.SIBLING_MATERNAL_FEMALE));
    it('أخ شقيق → SIBLING_MALE', () => expect(normalizeType('أخ شقيق')).toBe(RelationType.SIBLING_MALE));
    it('أخت شقيقة → SIBLING_FEMALE', () => expect(normalizeType('أخت شقيقة')).toBe(RelationType.SIBLING_FEMALE));
    it('جد', () => expect(normalizeType('جد')).toBe(RelationType.GRANDPARENT_MALE));
    it('جدة', () => expect(normalizeType('جدة')).toBe(RelationType.GRANDPARENT_FEMALE));
    it('حفيد', () => expect(normalizeType('حفيد')).toBe(RelationType.GRANDCHILD_MALE));
    it('حفيدة', () => expect(normalizeType('حفيدة')).toBe(RelationType.GRANDCHILD_FEMALE));
    it('عم', () => expect(normalizeType('عم')).toBe(RelationType.UNCLE_PATERNAL_MALE));
    it('عمة', () => expect(normalizeType('عمة')).toBe(RelationType.UNCLE_PATERNAL_FEMALE));
    it('خال', () => expect(normalizeType('خال')).toBe(RelationType.UNCLE_MATERNAL_MALE));
    it('خالة', () => expect(normalizeType('خالة')).toBe(RelationType.UNCLE_MATERNAL_FEMALE));
    it('طليق', () => expect(normalizeType('طليق')).toBe(RelationType.EX_SPOUSE_MALE));
    it('طليقة', () => expect(normalizeType('طليقة')).toBe(RelationType.EX_SPOUSE_FEMALE));
    it('ابن أخ', () => expect(normalizeType('ابن أخ')).toBe(RelationType.NEPHEW_PATERNAL_MALE));
    it('ابنة أخ', () => expect(normalizeType('ابنة أخ')).toBe(RelationType.NEPHEW_PATERNAL_FEMALE));
    it('ابن عم', () => expect(normalizeType('ابن عم')).toBe(RelationType.COUSIN_PATERNAL_MALE));
    it('ابنة عم', () => expect(normalizeType('ابنة عم')).toBe(RelationType.COUSIN_PATERNAL_FEMALE));
    it('شريك إنجاب', () => expect(normalizeType('شريك إنجاب')).toBe(RelationType.CO_PARENT_MALE));
    it('شريكة إنجاب', () => expect(normalizeType('شريكة إنجاب')).toBe(RelationType.CO_PARENT_FEMALE));
    it('حما', () => expect(normalizeType('حما')).toBe(RelationType.FATHER_IN_LAW));
    it('حماة', () => expect(normalizeType('حماة')).toBe(RelationType.MOTHER_IN_LAW));
    it('صهر', () => expect(normalizeType('صهر')).toBe(RelationType.SON_IN_LAW));
    it('كنة', () => expect(normalizeType('كنة')).toBe(RelationType.DAUGHTER_IN_LAW));
  });

  // ═══════════════════════════════════════════════
  // 3. أسماء بديلة عربية
  // ═══════════════════════════════════════════════
  describe('أسماء بديلة', () => {
    it('أب لـ → PARENT_MALE', () => expect(normalizeType('أب لـ')).toBe(RelationType.PARENT_MALE));
    it('أم لـ → PARENT_FEMALE', () => expect(normalizeType('أم لـ')).toBe(RelationType.PARENT_FEMALE));
    it('أب حقيقي → PARENT_MALE', () => expect(normalizeType('أب حقيقي')).toBe(RelationType.PARENT_MALE));
    it('أم حقيقية → PARENT_FEMALE', () => expect(normalizeType('أم حقيقية')).toBe(RelationType.PARENT_FEMALE));
    it('إخوة → SIBLINGS', () => expect(normalizeType('إخوة')).toBe(RelationType.SIBLINGS));
  });

  // ═══════════════════════════════════════════════
  // 4. ScriptFlow Legacy English
  // ═══════════════════════════════════════════════
  describe('ScriptFlow Legacy', () => {
    it('FATHER', () => expect(normalizeType('FATHER')).toBe(RelationType.PARENT_MALE));
    it('FATHER_OF', () => expect(normalizeType('FATHER_OF')).toBe(RelationType.PARENT_MALE));
    it('MOTHER', () => expect(normalizeType('MOTHER')).toBe(RelationType.PARENT_FEMALE));
    it('MOTHER_OF', () => expect(normalizeType('MOTHER_OF')).toBe(RelationType.PARENT_FEMALE));
    it('HUSBAND_OF', () => expect(normalizeType('HUSBAND_OF')).toBe(RelationType.SPOUSE_MALE));
    it('WIFE_OF', () => expect(normalizeType('WIFE_OF')).toBe(RelationType.SPOUSE_FEMALE));
    it('EX_HUSBAND_OF', () => expect(normalizeType('EX_HUSBAND_OF')).toBe(RelationType.EX_SPOUSE_MALE));
    it('EX_WIFE_OF', () => expect(normalizeType('EX_WIFE_OF')).toBe(RelationType.EX_SPOUSE_FEMALE));
    it('SIBLING_OF', () => expect(normalizeType('SIBLING_OF')).toBe(RelationType.SIBLINGS));
    it('SIBLING_INFERRED', () => expect(normalizeType('SIBLING_INFERRED')).toBe(RelationType.SIBLINGS));
    it('MARRIAGE', () => expect(normalizeType('MARRIAGE')).toBe(RelationType.SPOUSES));
    it('EX_MARRIAGE', () => expect(normalizeType('EX_MARRIAGE')).toBe(RelationType.EX_SPOUSES));
    it('GRANDFATHER_OF', () => expect(normalizeType('GRANDFATHER_OF')).toBe(RelationType.GRANDPARENT_MALE));
    it('GRANDMOTHER_OF', () => expect(normalizeType('GRANDMOTHER_OF')).toBe(RelationType.GRANDPARENT_FEMALE));
    it('UNCLE_OF', () => expect(normalizeType('UNCLE_OF')).toBe(RelationType.UNCLE_PATERNAL_MALE));
    it('AUNT_OF', () => expect(normalizeType('AUNT_OF')).toBe(RelationType.UNCLE_PATERNAL_FEMALE));
    it('STEPFATHER_OF', () => expect(normalizeType('STEPFATHER_OF')).toBe(RelationType.STEP_PARENT_MALE));
    it('STEPMOTHER_OF', () => expect(normalizeType('STEPMOTHER_OF')).toBe(RelationType.STEP_PARENT_FEMALE));
    it('CO_PARENTS', () => expect(normalizeType('CO_PARENTS')).toBe(RelationType.CO_PARENT_MALE));
  });

  // ═══════════════════════════════════════════════
  // 5. قيم Enum مباشرة (pass-through)
  // ═══════════════════════════════════════════════
  describe('Enum pass-through', () => {
    it('RelationType.PARENT_MALE يبقى كما هو', () => {
      expect(normalizeType(RelationType.PARENT_MALE)).toBe(RelationType.PARENT_MALE);
    });
    it('RelationType.SPOUSE_FEMALE يبقى كما هو', () => {
      expect(normalizeType(RelationType.SPOUSE_FEMALE)).toBe(RelationType.SPOUSE_FEMALE);
    });
    it('RelationType.GRANDCHILD_MALE يبقى كما هو', () => {
      expect(normalizeType(RelationType.GRANDCHILD_MALE)).toBe(RelationType.GRANDCHILD_MALE);
    });
  });

  // ═══════════════════════════════════════════════
  // 6. حالات حدية
  // ═══════════════════════════════════════════════
  describe('حالات حدية', () => {
    it('نص غير معروف يُرجع كما هو', () => {
      expect(normalizeType('UNKNOWN_RELATION')).toBe('UNKNOWN_RELATION');
    });
    it('نص فارغ', () => {
      expect(normalizeType('')).toBe('');
    });
    it('undefined', () => {
      expect(normalizeType(undefined as any)).toBeUndefined();
    });
    it('نص مع مسافات يُنظف', () => {
      expect(normalizeType('  أب  ')).toBe(RelationType.PARENT_MALE);
    });
  });
});
