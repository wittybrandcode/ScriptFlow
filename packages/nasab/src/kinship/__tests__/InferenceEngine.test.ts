import { describe, it, expect } from 'vitest';
import { Person, Relation } from '../../core/types';
import { RelationType, Gender, RELATION_GROUPS } from '../../core/enums';
import { InferenceEngine } from '../InferenceEngine';

// ═══════════════════════════════════════════════
// مساعدات
// ═══════════════════════════════════════════════
const male = (id: string, name: string, deceased = false): Person => ({ id, name, gender: Gender.MALE, isDeceased: deceased });
const female = (id: string, name: string, deceased = false): Person => ({ id, name, gender: Gender.FEMALE, isDeceased: deceased });
const edge = (src: string, tgt: string, type: RelationType): Relation => ({ sourceId: src, targetId: tgt, type });

const hasRelation = (inferences: Relation[], src: string, tgt: string, type: RelationType) =>
  inferences.some(i => i.sourceId === src && i.targetId === tgt && i.type === type);

describe('InferenceEngine — اختبارات شاملة', () => {

  // ═══════════════════════════════════════════════
  // 1. العلاقات العكسية (Bi-directional)
  // ═══════════════════════════════════════════════
  describe('العلاقات العكسية', () => {
    it('أب → ابن (عكسي)', () => {
      const nodes = [male('f', 'أب'), male('s', 'ابن')];
      const edges = [edge('f', 's', RelationType.PARENT_MALE)];
      const r = InferenceEngine.infer(nodes, edges);
      expect(hasRelation(r, 's', 'f', RelationType.CHILD_MALE)).toBe(true);
    });

    it('أم → ابنة (عكسي)', () => {
      const nodes = [female('m', 'أم'), female('d', 'بنت')];
      const edges = [edge('m', 'd', RelationType.PARENT_FEMALE)];
      const r = InferenceEngine.infer(nodes, edges);
      expect(hasRelation(r, 'd', 'm', RelationType.CHILD_FEMALE)).toBe(true);
    });

    it('زوج ← زوجة (عكسي)', () => {
      const nodes = [male('h', 'زوج'), female('w', 'زوجة')];
      const edges = [edge('h', 'w', RelationType.SPOUSE_MALE)];
      const r = InferenceEngine.infer(nodes, edges);
      expect(hasRelation(r, 'w', 'h', RelationType.SPOUSE_FEMALE)).toBe(true);
    });

    it('جد ← حفيد (عكسي)', () => {
      const nodes = [male('gf', 'جد'), male('s', 'حفيد')];
      const edges = [edge('gf', 's', RelationType.GRANDPARENT_MALE)];
      const r = InferenceEngine.infer(nodes, edges);
      expect(hasRelation(r, 's', 'gf', RelationType.GRANDCHILD_MALE)).toBe(true);
    });

    it('عم ← ابن أخ (عكسي)', () => {
      const nodes = [male('u', 'عم'), male('n', 'ابن أخ')];
      const edges = [edge('u', 'n', RelationType.UNCLE_PATERNAL_MALE)];
      const r = InferenceEngine.infer(nodes, edges);
      expect(hasRelation(r, 'n', 'u', RelationType.NEPHEW_PATERNAL_MALE)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════
  // 2. الاستنتاجات المتسلسلة (Cascading)
  // ═══════════════════════════════════════════════
  describe('الاستنتاجات المتسلسلة', () => {
    it('أب → ابن → حفيد = جد ← حفيد', () => {
      const nodes = [male('gf', 'جد'), male('f', 'أب'), male('s', 'ابن')];
      const edges = [
        edge('gf', 'f', RelationType.PARENT_MALE),
        edge('f', 's', RelationType.PARENT_MALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);
      expect(hasRelation(r, 'gf', 's', RelationType.GRANDPARENT_MALE)).toBe(true);
    });

    it('أبناء نفس الأب = أخوة لأب', () => {
      const nodes = [male('f', 'أب'), male('s1', 'ابن1'), male('s2', 'ابن2')];
      const edges = [
        edge('f', 's1', RelationType.PARENT_MALE),
        edge('f', 's2', RelationType.PARENT_MALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);
      expect(hasRelation(r, 's1', 's2', RelationType.SIBLING_PATERNAL_MALE) ||
             hasRelation(r, 's2', 's1', RelationType.SIBLING_PATERNAL_MALE)).toBe(true);
    });

    it('أبناء نفس الأم = أخوة لأم', () => {
      const nodes = [female('m', 'أم'), male('s1', 'ابن1'), female('d1', 'بنت1')];
      const edges = [
        edge('m', 's1', RelationType.PARENT_FEMALE),
        edge('m', 'd1', RelationType.PARENT_FEMALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);
      expect(hasRelation(r, 's1', 'd1', RelationType.SIBLING_MATERNAL_MALE) ||
             hasRelation(r, 'd1', 's1', RelationType.SIBLING_MATERNAL_FEMALE)).toBe(true);
    });

    it('أخ الأب = عم', () => {
      const nodes = [
        male('gf', 'جد'), male('f', 'أب'), male('uncle', 'عم'), male('s', 'ابن'),
      ];
      const edges = [
        edge('gf', 'f', RelationType.PARENT_MALE),
        edge('gf', 'uncle', RelationType.PARENT_MALE),
        edge('f', 's', RelationType.PARENT_MALE),
        // نحتاج أن يعرف المحرك أن f و uncle أخوة أولاً
      ];
      const r = InferenceEngine.infer(nodes, edges);
      // FIX: المحرك يستنتج العمومة عبر كل أنواع الأخوة الآن
      const uncleFound = hasRelation(r, 'uncle', 's', RelationType.UNCLE_PATERNAL_MALE);
      expect(uncleFound).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════
  // 3. حماية من الأخطاء (Safety)
  // ═══════════════════════════════════════════════
  describe('الحماية من الأخطاء', () => {
    it('لا يستنتج علاقة شخص مع نفسه', () => {
      const nodes = [male('p', 'شخص')];
      const edges = [edge('p', 'p', RelationType.PARENT_MALE)];
      const r = InferenceEngine.infer(nodes, edges);
      const selfRelations = r.filter(i => i.sourceId === 'p' && i.targetId === 'p');
      expect(selfRelations.length).toBe(0);
    });

    it('لا يُنتج استنتاجات مكررة', () => {
      const nodes = [male('f', 'أب'), male('s', 'ابن')];
      const edges = [edge('f', 's', RelationType.PARENT_MALE)];
      const r = InferenceEngine.infer(nodes, edges);
      const childRelations = r.filter(i => i.sourceId === 's' && i.targetId === 'f' && i.type === RelationType.CHILD_MALE);
      expect(childRelations.length).toBe(1);
    });

    it('يرمي خطأ عند تجاوز حد التكرار (بيانات دائرية ضخمة)', () => {
      // بناء شبكة دائرية ضخمة
      const nodes = Array.from({ length: 200 }, (_, i) => male(`p${i}`, `شخص ${i}`));
      const edges: Relation[] = [];
      for (let i = 0; i < 199; i++) {
        edges.push(edge(`p${i}`, `p${i + 1}`, RelationType.PARENT_MALE));
        edges.push(edge(`p${i + 1}`, `p${i}`, RelationType.PARENT_MALE)); // دائرية
      }
      // لا يجب أن ينهار — إما يُرجع نتائج أو يرمي NasabError
      expect(() => InferenceEngine.infer(nodes, edges)).not.toThrow('Maximum call stack');
    });

    it('بيانات فارغة = نتائج فارغة', () => {
      const r = InferenceEngine.infer([], []);
      expect(r.length).toBe(0);
    });

    it('nodes بدون edges = لا استنتاجات', () => {
      const nodes = [male('a', 'أ'), male('b', 'ب')];
      const r = InferenceEngine.infer(nodes, []);
      expect(r.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════
  // 4. شجرة عائلة كاملة (Integration)
  // ═══════════════════════════════════════════════
  describe('شجرة عائلة كاملة — 3 أجيال', () => {
    const nodes = [
      male('gf', 'الجد'), female('gm', 'الجدة'),
      male('f', 'الأب'), female('m', 'الأم'),
      male('uncle', 'العم'),
      male('s1', 'ابن1'), female('d1', 'بنت1'),
    ];
    const edges = [
      edge('gf', 'f', RelationType.PARENT_MALE),
      edge('gm', 'f', RelationType.PARENT_FEMALE),
      edge('gf', 'uncle', RelationType.PARENT_MALE),
      edge('gm', 'uncle', RelationType.PARENT_FEMALE),
      edge('f', 's1', RelationType.PARENT_MALE),
      edge('m', 's1', RelationType.PARENT_FEMALE),
      edge('f', 'd1', RelationType.PARENT_MALE),
      edge('m', 'd1', RelationType.PARENT_FEMALE),
    ];
    const r = InferenceEngine.infer(nodes, edges);

    it('الجد جد الابن', () => {
      expect(hasRelation(r, 'gf', 's1', RelationType.GRANDPARENT_MALE)).toBe(true);
    });

    it('الجدة جدة البنت', () => {
      expect(hasRelation(r, 'gm', 'd1', RelationType.GRANDPARENT_FEMALE)).toBe(true);
    });

    it('الابن حفيد الجد', () => {
      expect(hasRelation(r, 's1', 'gf', RelationType.GRANDCHILD_MALE)).toBe(true);
    });

    it('العم عم الابن (يُستنتج تلقائياً)', () => {
      expect(hasRelation(r, 'uncle', 's1', RelationType.UNCLE_PATERNAL_MALE)).toBe(true);
    });

    it('الابن1 أخ شقيق للبنت1 (FIX-06: دمج لأب+لأم = شقيق)', () => {
      expect(
        hasRelation(r, 's1', 'd1', RelationType.SIBLING_MALE)
      ).toBe(true);
    });

    it('الأب والعم أشقاء (FIX-06: دمج)', () => {
      expect(
        hasRelation(r, 'f', 'uncle', RelationType.SIBLING_MALE) ||
        hasRelation(r, 'uncle', 'f', RelationType.SIBLING_MALE)
      ).toBe(true);
    });

    it('كل الاستنتاجات تحمل isAutoGenerated', () => {
      r.forEach(inf => {
        expect((inf as any).isAutoGenerated).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════
  // 4b. FIX-06 — دمج الأخوة الأشقاء
  // ═══════════════════════════════════════════════
  describe('FIX-06: دمج الأخوة', () => {
    it('نفس الأب + نفس الأم = أخ شقيق (ليس لأب + لأم)', () => {
      const nodes = [
        male('father', 'أب'), female('mother', 'أم'),
        male('s1', 'ابن1'), female('s2', 'ابنة2'),
      ];
      const edges = [
        edge('father', 's1', RelationType.PARENT_MALE),
        edge('father', 's2', RelationType.PARENT_MALE),
        edge('mother', 's1', RelationType.PARENT_FEMALE),
        edge('mother', 's2', RelationType.PARENT_FEMALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);

      // يجب أن تظهر أخوة شقيقة
      const fullSibling = r.some(i =>
        (i.sourceId === 's1' && i.targetId === 's2' && i.type === RelationType.SIBLING_MALE) ||
        (i.sourceId === 's2' && i.targetId === 's1' && i.type === RelationType.SIBLING_FEMALE)
      );
      expect(fullSibling).toBe(true);

      // يجب أن لا تبقى أخوة جزئية (لأب أو لأم)
      const partialSibling = r.some(i =>
        ((i.sourceId === 's1' && i.targetId === 's2') || (i.sourceId === 's2' && i.targetId === 's1')) &&
        (i.type === RelationType.SIBLING_PATERNAL_MALE || i.type === RelationType.SIBLING_PATERNAL_FEMALE ||
         i.type === RelationType.SIBLING_MATERNAL_MALE || i.type === RelationType.SIBLING_MATERNAL_FEMALE)
      );
      expect(partialSibling).toBe(false);
    });

    it('نفس الأب فقط = أخ لأب (لا يُدمج)', () => {
      const nodes = [male('father', 'أب'), male('s1', 'ابن1'), male('s2', 'ابن2')];
      const edges = [
        edge('father', 's1', RelationType.PARENT_MALE),
        edge('father', 's2', RelationType.PARENT_MALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);
      const paternal = r.some(i =>
        i.type === RelationType.SIBLING_PATERNAL_MALE &&
        ((i.sourceId === 's1' && i.targetId === 's2') || (i.sourceId === 's2' && i.targetId === 's1'))
      );
      expect(paternal).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════
  // 5. حالات نادرة
  // ═══════════════════════════════════════════════
  describe('حالات نادرة', () => {
    it('شخص واحد فقط بدون علاقات', () => {
      const r = InferenceEngine.infer([male('alone', 'وحيد')], []);
      expect(r.length).toBe(0);
    });

    it('علاقة بين شخصين غير موجودين في nodes', () => {
      const r = InferenceEngine.infer(
        [male('a', 'أ')],
        [edge('a', 'ghost', RelationType.PARENT_MALE)]
      );
      // يجب أن لا ينهار
      expect(Array.isArray(r)).toBe(true);
    });

    it('زوجين بدون أبناء = لا أخوة', () => {
      const nodes = [male('h', 'زوج'), female('w', 'زوجة')];
      const edges = [edge('h', 'w', RelationType.SPOUSE_MALE)];
      const r = InferenceEngine.infer(nodes, edges);
      const siblings = r.filter(i => i.type.includes('SIBLING'));
      expect(siblings.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════
  // 6. شركاء الإنجاب
  // ═══════════════════════════════════════════════
  describe('شركاء الإنجاب', () => {
    it('أب + أم لنفس الابن = شركاء إنجاب', () => {
      const nodes = [male('f', 'أب'), female('m', 'أم'), male('s', 'ابن')];
      const edges = [
        edge('f', 's', RelationType.PARENT_MALE),
        edge('m', 's', RelationType.PARENT_FEMALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);
      const coParent = r.some(i =>
        (i.type === RelationType.CO_PARENT_MALE || i.type === RelationType.CO_PARENT_FEMALE) &&
        ((i.sourceId === 'f' && i.targetId === 'm') || (i.sourceId === 'm' && i.targetId === 'f'))
      );
      expect(coParent).toBe(true);
    });

    it('FIX-15: لا ينشئ شركاء إنجاب إذا وُجد زواج صريح (أي اتجاه)', () => {
      const nodes = [male('f', 'أب'), female('m', 'أم'), male('s', 'ابن')];
      const edges = [
        edge('f', 's', RelationType.PARENT_MALE),
        edge('m', 's', RelationType.PARENT_FEMALE),
        edge('f', 'm', RelationType.SPOUSE_MALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);
      // بعد FIX-15: الفحص يشمل outEdges(parentId) + outEdges(otherParentId)
      const coParent = r.some(i =>
        i.type === RelationType.CO_PARENT_MALE || i.type === RelationType.CO_PARENT_FEMALE
      );
      expect(coParent).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════
  // 7. أبناء العم والأخوال
  // ═══════════════════════════════════════════════
  describe('أبناء العم', () => {
    it('أبناء أخوين شقيقين = أبناء عم (عبر SIBLING_MALE)', () => {
      const nodes = [
        male('gf', 'جد'), male('f1', 'أب1'), male('f2', 'أب2'),
        male('c1', 'ابن1'), male('c2', 'ابن2'),
      ];
      const edges = [
        edge('gf', 'f1', RelationType.PARENT_MALE),
        edge('gf', 'f2', RelationType.PARENT_MALE),
        edge('f1', 'c1', RelationType.PARENT_MALE),
        edge('f2', 'c2', RelationType.PARENT_MALE),
        edge('f1', 'f2', RelationType.SIBLING_MALE), // صريح
      ];
      const r = InferenceEngine.infer(nodes, edges);
      const cousin = r.some(i =>
        (i.type === RelationType.COUSIN_PATERNAL_MALE) &&
        ((i.sourceId === 'c1' && i.targetId === 'c2') || (i.sourceId === 'c2' && i.targetId === 'c1'))
      );
      expect(cousin).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════
  // 8. getInverseRelation
  // ═══════════════════════════════════════════════
  describe('getInverseRelation', () => {
    it('أب → ابن', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.PARENT_MALE, Gender.MALE)).toBe('ابن');
    });
    it('أب → ابنة', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.PARENT_MALE, Gender.FEMALE)).toBe('ابنة');
    });
    it('أم → ابن', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.PARENT_FEMALE, Gender.MALE)).toBe('ابن');
    });
    it('ابن → أب', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.CHILD_MALE, Gender.MALE)).toBe('أب');
    });
    it('ابنة → أم', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.CHILD_FEMALE, Gender.FEMALE)).toBe('أم');
    });
    it('زوج → زوجة', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.SPOUSE_MALE)).toBe('زوجة');
    });
    it('زوجة → زوج', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.SPOUSE_FEMALE)).toBe('زوج');
    });
    it('أخ → أخ', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.SIBLING_MALE, Gender.MALE)).toBe('أخ');
    });
    it('أخ → أخت', () => {
      expect(InferenceEngine.getInverseRelation(RelationType.SIBLING_MALE, Gender.FEMALE)).toBe('أخت');
    });
    it('نص عربي "أب" → ابن', () => {
      expect(InferenceEngine.getInverseRelation('أب', Gender.MALE)).toBe('ابن');
    });
    it('نوع غير معروف → null', () => {
      expect(InferenceEngine.getInverseRelation('UNKNOWN' as any)).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════
  // 9. FIX-10: Provenance (inferredVia)
  // ═══════════════════════════════════════════════
  describe('FIX-10: Provenance', () => {
    it('كل استنتاج يحمل inferredVia', () => {
      const nodes = [male('f', 'أب'), male('s', 'ابن')];
      const edges = [edge('f', 's', RelationType.PARENT_MALE)];
      const r = InferenceEngine.infer(nodes, edges);
      const childInf = r.find(i => i.type === RelationType.CHILD_MALE);
      expect(childInf).toBeDefined();
      expect((childInf as any).inferredVia).toContain('عكس');
    });

    it('أخوة يحملون سبب "أبناء نفس الوالد"', () => {
      const nodes = [male('f', 'أب'), male('s1', 'ابن1'), male('s2', 'ابن2')];
      const edges = [
        edge('f', 's1', RelationType.PARENT_MALE),
        edge('f', 's2', RelationType.PARENT_MALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);
      const sib = r.find(i =>
        (i.sourceId === 's2' && i.targetId === 's1') || (i.sourceId === 's1' && i.targetId === 's2')
      );
      expect(sib).toBeDefined();
      expect((sib as any).inferredVia).toContain('أبناء نفس الوالد');
    });

    it('جد يحمل سبب "عبر الوالد"', () => {
      const nodes = [male('gf', 'جد'), male('f', 'أب'), male('s', 'ابن')];
      const edges = [
        edge('gf', 'f', RelationType.PARENT_MALE),
        edge('f', 's', RelationType.PARENT_MALE),
      ];
      const r = InferenceEngine.infer(nodes, edges);
      const gp = r.find(i => i.type === RelationType.GRANDPARENT_MALE && i.targetId === 's');
      expect(gp).toBeDefined();
      expect((gp as any).inferredVia).toContain('عبر الوالد');
    });
  });

  // ═══════════════════════════════════════════════
  // 10. FIX-11: RELATION_GROUPS
  // ═══════════════════════════════════════════════
  describe('FIX-11: RELATION_GROUPS', () => {
    it('RELATION_GROUPS يحتوي على كل الأنواع الجمعية', () => {
      expect(RELATION_GROUPS.has(RelationType.SIBLINGS)).toBe(true);
      expect(RELATION_GROUPS.has(RelationType.CHILDREN)).toBe(true);
      expect(RELATION_GROUPS.has(RelationType.SPOUSES)).toBe(true);
      expect(RELATION_GROUPS.has(RelationType.EX_SPOUSES)).toBe(true);
      expect(RELATION_GROUPS.has(RelationType.COUSINS_PATERNAL)).toBe(true);
    });

    it('RELATION_GROUPS لا يحتوي على أنواع مفردة', () => {
      expect(RELATION_GROUPS.has(RelationType.PARENT_MALE)).toBe(false);
      expect(RELATION_GROUPS.has(RelationType.SIBLING_MALE)).toBe(false);
      expect(RELATION_GROUPS.has(RelationType.SPOUSE_MALE)).toBe(false);
      expect(RELATION_GROUPS.has(RelationType.CO_PARENT_MALE)).toBe(false);
    });
  });
});
