import { describe, it, expect } from 'vitest';
import { KinshipValidator } from '../KinshipValidator';
import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';
import { ErrorCode } from '../../core/errors';

// ═══════════════════════════════════════════════
// مساعدات
// ═══════════════════════════════════════════════
const male = (id: string, name: string, birth?: string): Person => ({ id, name, gender: Gender.MALE, birthDate: birth, isDeceased: false });
const female = (id: string, name: string, birth?: string): Person => ({ id, name, gender: Gender.FEMALE, birthDate: birth, isDeceased: false });
const edge = (src: string, tgt: string, type: RelationType): Relation => ({ sourceId: src, targetId: tgt, type });

describe('KinshipValidator — اختبارات شاملة', () => {

  // ═══════════════════════════════════════════════
  // 1. العلاقات الصحيحة (يجب أن تنجح)
  // ═══════════════════════════════════════════════
  describe('علاقات صحيحة', () => {
    it('زواج ذكر من أنثى', () => {
      const r = KinshipValidator.validate('h', 'w', RelationType.SPOUSE_MALE, [male('h', 'زوج'), female('w', 'زوجة')], []);
      expect(r.status).toBe('SUCCESS');
    });

    it('أب (ذكر) لابن', () => {
      const r = KinshipValidator.validate('f', 's', RelationType.PARENT_MALE, [male('f', 'أب', '1980'), male('s', 'ابن', '2010')], []);
      expect(r.status).toBe('SUCCESS');
    });

    it('أم (أنثى) لبنت', () => {
      const r = KinshipValidator.validate('m', 'd', RelationType.PARENT_FEMALE, [female('m', 'أم', '1985'), female('d', 'بنت', '2010')], []);
      expect(r.status).toBe('SUCCESS');
    });

    it('أخوة شقيقة بين ذكرين', () => {
      const r = KinshipValidator.validate('b1', 'b2', RelationType.SIBLING_MALE, [male('b1', 'أخ1'), male('b2', 'أخ2')], []);
      expect(r.status).toBe('SUCCESS');
    });
  });

  // ═══════════════════════════════════════════════
  // 2. تطابق الجنس (Gender Checks)
  // ═══════════════════════════════════════════════
  describe('تطابق الجنس', () => {
    it('رفض زواج ذكر من ذكر', () => {
      const r = KinshipValidator.validate('m1', 'm2', RelationType.SPOUSE_MALE, [male('m1', 'أ'), male('m2', 'ب')], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.GENDER_MISMATCH);
    });

    it('رفض أنثى كـ PARENT_MALE', () => {
      const r = KinshipValidator.validate('m', 's', RelationType.PARENT_MALE, [female('m', 'أم', '1980'), male('s', 'ابن', '2010')], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.GENDER_ROLE_MISMATCH);
    });

    it('رفض ذكر كـ PARENT_FEMALE', () => {
      const r = KinshipValidator.validate('f', 's', RelationType.PARENT_FEMALE, [male('f', 'أب', '1980'), male('s', 'ابن', '2010')], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.GENDER_ROLE_MISMATCH);
    });
  });

  // ═══════════════════════════════════════════════
  // 3. الزمن (Time Paradoxes)
  // ═══════════════════════════════════════════════
  describe('مفارقات زمنية', () => {
    it('رفض ابن أكبر من أبيه', () => {
      const r = KinshipValidator.validate('young', 'old', RelationType.PARENT_MALE,
        [male('young', 'شاب', '2005'), male('old', 'كبير', '1980')], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.TIME_PARADOX);
    });

    it('رفض فرق عمر أقل من 12 سنة بين أب وابن', () => {
      const r = KinshipValidator.validate('f', 's', RelationType.PARENT_MALE,
        [male('f', 'أب', '1990'), male('s', 'ابن', '2000')], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.message).toContain('أصغر من 12');
    });

    it('تحذير فقط في وضع DRAMATIC', () => {
      const r = KinshipValidator.validate('young', 'old', RelationType.PARENT_MALE,
        [male('young', 'شاب', '2005'), male('old', 'كبير', '1980')], [], 'DRAMATIC');
      expect(r.status).toBe('WARNING');
    });
  });

  // ═══════════════════════════════════════════════
  // 4. العلاقة مع النفس
  // ═══════════════════════════════════════════════
  describe('علاقة مع النفس', () => {
    it('رفض ربط شخص بنفسه كأب', () => {
      const r = KinshipValidator.validate('p', 'p', RelationType.PARENT_MALE, [male('p', 'شخص', '1990')], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.SELF_RELATION);
    });

    it('رفض ربط شخص بنفسه كزوج', () => {
      const r = KinshipValidator.validate('p', 'p', RelationType.SPOUSE_MALE, [male('p', 'شخص')], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.SELF_RELATION);
    });
  });

  // ═══════════════════════════════════════════════
  // 5. الدورات (Cycles)
  // ═══════════════════════════════════════════════
  describe('كشف الدورات', () => {
    it('رفض: أ أب ب، ب أب أ (بدون تاريخ = كشف دورة)', () => {
      const nodes = [male('a', 'أ'), male('b', 'ب')]; // بدون birthDate
      const existingEdges = [edge('a', 'b', RelationType.PARENT_MALE)];
      const r = KinshipValidator.validate('b', 'a', RelationType.PARENT_MALE, nodes, existingEdges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.CYCLE_DETECTED);
    });

    it('لا ينهار مع بيانات دائرية سابقة (FIX-01)', () => {
      const nodes = [male('a', 'أ'), male('b', 'ب'), male('c', 'ج')];
      const corruptEdges = [
        edge('a', 'b', RelationType.PARENT_MALE),
        edge('b', 'a', RelationType.PARENT_MALE), // حلقة فاسدة
      ];
      expect(() => {
        KinshipValidator.validate('c', 'a', RelationType.PARENT_MALE, nodes, corruptEdges);
      }).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════
  // 6. تعدد الزوجات
  // ═══════════════════════════════════════════════
  describe('تعدد الزوجات', () => {
    it('إسلامي: رفض أكثر من 4 زوجات', () => {
      const nodes = [male('h', 'زوج'), ...Array.from({ length: 5 }, (_, i) => female(`w${i}`, `زوجة${i}`))];
      const existingEdges = Array.from({ length: 4 }, (_, i) => edge('h', `w${i}`, RelationType.SPOUSE_MALE));
      const r = KinshipValidator.validate('h', 'w4', RelationType.SPOUSE_MALE, nodes, existingEdges, 'ISLAMIC_LAW');
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.POLYGAMY_VIOLATION);
    });

    it('إسلامي: قبول 4 زوجات', () => {
      const nodes = [male('h', 'زوج'), ...Array.from({ length: 4 }, (_, i) => female(`w${i}`, `زوجة${i}`))];
      const existingEdges = Array.from({ length: 3 }, (_, i) => edge('h', `w${i}`, RelationType.SPOUSE_MALE));
      const r = KinshipValidator.validate('h', 'w3', RelationType.SPOUSE_MALE, nodes, existingEdges, 'ISLAMIC_LAW');
      expect(r.status).toBe('SUCCESS');
    });

    it('مدني: رفض أكثر من زوجة واحدة', () => {
      const nodes = [male('h', 'زوج'), female('w1', 'زوجة1'), female('w2', 'زوجة2')];
      const existingEdges = [edge('h', 'w1', RelationType.SPOUSE_MALE)];
      const r = KinshipValidator.validate('h', 'w2', RelationType.SPOUSE_MALE, nodes, existingEdges, 'CIVIL_LAW_WESTERN');
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.POLYGAMY_VIOLATION);
    });

    it('رفض أكثر من زوج واحد للمرأة', () => {
      const nodes = [female('w', 'زوجة'), male('h1', 'زوج1'), male('h2', 'زوج2')];
      const existingEdges = [edge('h1', 'w', RelationType.SPOUSE_MALE)];
      const r = KinshipValidator.validate('h2', 'w', RelationType.SPOUSE_MALE, nodes, existingEdges, 'ISLAMIC_LAW');
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.POLYGAMY_VIOLATION);
    });
  });

  // ═══════════════════════════════════════════════
  // 7. أبوين بيولوجيين
  // ═══════════════════════════════════════════════
  describe('أبوين بيولوجيين', () => {
    it('رفض أبوين ذكرين', () => {
      const nodes = [male('f1', 'أب1', '1980'), male('f2', 'أب2', '1980'), male('s', 'ابن', '2010')];
      const existingEdges = [edge('f1', 's', RelationType.PARENT_MALE)];
      const r = KinshipValidator.validate('f2', 's', RelationType.PARENT_MALE, nodes, existingEdges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.DUPLICATE_BIOLOGICAL_PARENT);
    });

    it('رفض أمين', () => {
      const nodes = [female('m1', 'أم1', '1980'), female('m2', 'أم2', '1980'), male('s', 'ابن', '2010')];
      const existingEdges = [edge('m1', 's', RelationType.PARENT_FEMALE)];
      const r = KinshipValidator.validate('m2', 's', RelationType.PARENT_FEMALE, nodes, existingEdges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.DUPLICATE_BIOLOGICAL_PARENT);
    });

    it('قبول أب + أم (جنسان مختلفان)', () => {
      const nodes = [male('f', 'أب', '1980'), female('m', 'أم', '1985'), male('s', 'ابن', '2010')];
      const existingEdges = [edge('f', 's', RelationType.PARENT_MALE)];
      const r = KinshipValidator.validate('m', 's', RelationType.PARENT_FEMALE, nodes, existingEdges);
      expect(r.status).toBe('SUCCESS');
    });
  });

  // ═══════════════════════════════════════════════
  // 8. حالات حدية
  // ═══════════════════════════════════════════════
  describe('حالات حدية', () => {
    it('شخص غير موجود في nodes', () => {
      const r = KinshipValidator.validate('ghost', 'real', RelationType.PARENT_MALE, [male('real', 'موجود', '2010')], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.INVALID_NODE);
    });

    it('نص عربي يُحوّل لـ enum بنجاح', () => {
      const r = KinshipValidator.validate('f', 's', 'أب', [male('f', 'أب', '1980'), male('s', 'ابن', '2010')], []);
      expect(r.status).toBe('SUCCESS');
    });

    it('بدون birthDate = لا فحص زمني', () => {
      const r = KinshipValidator.validate('f', 's', RelationType.PARENT_MALE, [male('f', 'أب'), male('s', 'ابن')], []);
      expect(r.status).toBe('SUCCESS');
    });
  });

  // ═══════════════════════════════════════════════
  // 8. المحارم (Incest) — زواج أصول/فروع
  // ═══════════════════════════════════════════════
  describe('المحارم — أصول وفروع', () => {
    it('رفض زواج أب من ابنته', () => {
      const nodes = [male('f', 'أب'), female('d', 'بنت')];
      const edges = [edge('f', 'd', RelationType.PARENT_MALE)];
      const r = KinshipValidator.validate('f', 'd', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.INCEST_VIOLATION);
    });

    it('رفض زواج ابن من أمه', () => {
      const nodes = [male('s', 'ابن'), female('m', 'أم')];
      const edges = [edge('m', 's', RelationType.PARENT_FEMALE)];
      const r = KinshipValidator.validate('s', 'm', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.INCEST_VIOLATION);
    });
  });

  // ═══════════════════════════════════════════════
  // 9. المحارم — الأخوة
  // ═══════════════════════════════════════════════
  describe('المحارم — الأخوة', () => {
    it('رفض زواج أخ شقيق من أخته', () => {
      const nodes = [male('b', 'أخ'), female('s', 'أخت')];
      const edges = [edge('b', 's', RelationType.SIBLING_MALE)];
      const r = KinshipValidator.validate('b', 's', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.INCEST_VIOLATION);
    });

    it('رفض زواج أخ لأب من أخته لأب', () => {
      const nodes = [male('b', 'أخ'), female('s', 'أخت')];
      const edges = [edge('b', 's', RelationType.SIBLING_PATERNAL_MALE)];
      const r = KinshipValidator.validate('b', 's', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
    });

    it('رفض زواج أخ لأم من أخته لأم', () => {
      const nodes = [male('b', 'أخ'), female('s', 'أخت')];
      const edges = [edge('b', 's', RelationType.SIBLING_MATERNAL_MALE)];
      const r = KinshipValidator.validate('b', 's', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
    });
  });

  // ═══════════════════════════════════════════════
  // 10. المحارم — الأعمام
  // ═══════════════════════════════════════════════
  describe('المحارم — أعمام وأخوال', () => {
    it('رفض زواج العم من ابنة أخيه', () => {
      const nodes = [male('u', 'عم'), female('n', 'ابنة أخ')];
      const edges = [edge('u', 'n', RelationType.UNCLE_PATERNAL_MALE)];
      const r = KinshipValidator.validate('u', 'n', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.INCEST_VIOLATION);
    });

    it('رفض زواج الخال من ابنة أخته', () => {
      const nodes = [male('u', 'خال'), female('n', 'ابنة أخت')];
      const edges = [edge('u', 'n', RelationType.UNCLE_MATERNAL_MALE)];
      const r = KinshipValidator.validate('u', 'n', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
    });
  });

  // ═══════════════════════════════════════════════
  // 11. المحارم — الربائب والحماة
  // ═══════════════════════════════════════════════
  describe('المحارم — ربائب وحماة', () => {
    it('رفض زواج رجل من ابنة زوجته (ربيبة)', () => {
      const nodes = [male('h', 'زوج'), female('w', 'زوجة'), female('sd', 'ابنة الزوجة')];
      const edges = [
        edge('h', 'w', RelationType.SPOUSE_MALE),
        edge('w', 'sd', RelationType.PARENT_FEMALE),
      ];
      const r = KinshipValidator.validate('h', 'sd', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.INCEST_VIOLATION);
    });

    it('رفض زواج رجل من أم زوجته (حماة)', () => {
      const nodes = [male('h', 'زوج'), female('w', 'زوجة'), female('ml', 'أم الزوجة')];
      const edges = [
        edge('h', 'w', RelationType.SPOUSE_MALE),
        edge('ml', 'w', RelationType.PARENT_FEMALE),
      ];
      const r = KinshipValidator.validate('h', 'ml', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
    });

    it('رفض الجمع بين الأختين', () => {
      const nodes = [male('h', 'زوج'), female('w1', 'زوجة1'), female('w2', 'زوجة2')];
      const edges = [
        edge('h', 'w1', RelationType.SPOUSE_MALE),
        edge('w1', 'w2', RelationType.SIBLING_FEMALE),
      ];
      const r = KinshipValidator.validate('h', 'w2', RelationType.SPOUSE_MALE, nodes, edges);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.INCEST_VIOLATION);
    });
  });

  // ═══════════════════════════════════════════════
  // 12. القانون المدني
  // ═══════════════════════════════════════════════
  describe('القانون المدني', () => {
    it('مدني: رفض زوجتين', () => {
      const nodes = [male('h', 'زوج'), female('w1', 'ز1'), female('w2', 'ز2')];
      const edges = [edge('h', 'w1', RelationType.SPOUSE_MALE)];
      const r = KinshipValidator.validate('h', 'w2', RelationType.SPOUSE_MALE, nodes, edges, 'CIVIL_LAW_WESTERN');
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.POLYGAMY_VIOLATION);
    });
  });

  // ═══════════════════════════════════════════════
  // 13. الوضع الدرامي
  // ═══════════════════════════════════════════════
  describe('الوضع الدرامي', () => {
    it('DRAMATIC: تناقض زمني = تحذير فقط', () => {
      const nodes = [male('s', 'ابن', '1980'), male('f', 'أب', '2010')];
      const r = KinshipValidator.validate('f', 's', RelationType.PARENT_MALE, nodes, [], 'DRAMATIC');
      expect(r.status).toBe('WARNING');
    });

    it('DRAMATIC: محارم = تحذير فقط', () => {
      const nodes = [male('f', 'أب'), female('d', 'بنت')];
      const edges = [edge('f', 'd', RelationType.PARENT_MALE)];
      const r = KinshipValidator.validate('f', 'd', RelationType.SPOUSE_MALE, nodes, edges, 'DRAMATIC');
      expect(r.status).toBe('WARNING');
    });
  });

  // ═══════════════════════════════════════════════
  // 14. شركاء الإنجاب
  // ═══════════════════════════════════════════════
  describe('شركاء الإنجاب', () => {
    it('CO_PARENT يتجاوز كل القيود', () => {
      const nodes = [male('a', 'أ'), male('b', 'ب')];
      const r = KinshipValidator.validate('a', 'b', RelationType.CO_PARENT_MALE, nodes, []);
      expect(r.status).toBe('SUCCESS');
    });
  });

  // ═══════════════════════════════════════════════
  // 15. فحص زمني متقدم
  // ═══════════════════════════════════════════════
  describe('فحص زمني متقدم', () => {
    it('زواج بين متوفى قبل ولادة الآخر = رفض', () => {
      const n1: Person = { ...male('h', 'زوج', '1900'), deathDate: '1950' };
      const n2 = female('w', 'زوجة', '1980');
      const r = KinshipValidator.validate('h', 'w', RelationType.SPOUSE_MALE, [n1, n2], []);
      expect(r.status).toBe('ERROR');
      expect(r.error?.code).toBe(ErrorCode.TIME_PARADOX);
    });

    it('فرق عمر 12 سنة بالضبط = مقبول', () => {
      const r = KinshipValidator.validate('f', 's', RelationType.PARENT_MALE,
        [male('f', 'أب', '1980'), male('s', 'ابن', '1992')], []);
      expect(r.status).toBe('SUCCESS');
    });

    it('فرق عمر 11 سنة = رفض', () => {
      const r = KinshipValidator.validate('f', 's', RelationType.PARENT_MALE,
        [male('f', 'أب', '1980'), male('s', 'ابن', '1991')], []);
      expect(r.status).toBe('ERROR');
    });

    it('خيار minParentAgeGap مخصص', () => {
      const r = KinshipValidator.validate('f', 's', RelationType.PARENT_MALE,
        [male('f', 'أب', '1980'), male('s', 'ابن', '1991')], [], 'ISLAMIC_LAW', { minParentAgeGap: 10 });
      expect(r.status).toBe('SUCCESS');
    });
  });
});
