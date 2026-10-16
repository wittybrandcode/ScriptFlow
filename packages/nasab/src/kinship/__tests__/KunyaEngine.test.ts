import { describe, it, expect } from 'vitest';
import { KunyaEngine } from '../KunyaEngine';
import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';

describe('KunyaEngine - نظام الكنية', () => {

  // ── استخراج الكنية ──────────────────────────────────────
  describe('extractKunya', () => {
    it('يستخرج كنية تبدأ بـ "ال" من نهاية الاسم', () => {
      const person: Person = { id: '1', name: 'محمد الهاشمي', gender: Gender.MALE, isDeceased: false };
      expect(KunyaEngine.extractKunya(person)).toBe('الهاشمي');
    });

    it('يستخرج كنية "آل" (آل سعود)', () => {
      const person: Person = { id: '2', name: 'فيصل آل سعود', gender: Gender.MALE, isDeceased: false };
      expect(KunyaEngine.extractKunya(person)).toBe('آل سعود');
    });

    it('يعطي أولوية لحقل kunya المباشر', () => {
      const person: Person = { id: '3', name: 'محمد التميمي', gender: Gender.MALE, isDeceased: false, kunya: 'القرشي' };
      expect(KunyaEngine.extractKunya(person)).toBe('القرشي');
    });

    it('يرجع null لاسم بدون كنية', () => {
      const person: Person = { id: '4', name: 'أحمد', gender: Gender.MALE, isDeceased: false };
      expect(KunyaEngine.extractKunya(person)).toBeNull();
    });

    it('يرجع null لاسم من كلمتين بدون "ال"', () => {
      const person: Person = { id: '5', name: 'عمر خالد', gender: Gender.MALE, isDeceased: false };
      expect(KunyaEngine.extractKunya(person)).toBeNull();
    });

    it('يستخرج الكنية من اسم طويل مع "بن"', () => {
      const person: Person = { id: '6', name: 'عمر بن محمد الفاروقي', gender: Gender.MALE, isDeceased: false };
      expect(KunyaEngine.extractKunya(person)).toBe('الفاروقي');
    });
  });

  // ── extractKunyaFromName ─────────────────────────────────
  describe('extractKunyaFromName', () => {
    it('يستخرج من نص مباشر', () => {
      expect(KunyaEngine.extractKunyaFromName('خالد الأنصاري')).toBe('الأنصاري');
    });

    it('يرجع null لنص فارغ', () => {
      expect(KunyaEngine.extractKunyaFromName('')).toBeNull();
    });

    it('يرجع null لكلمة واحدة', () => {
      expect(KunyaEngine.extractKunyaFromName('محمد')).toBeNull();
    });
  });

  // ── التحقق من التطابق ──────────────────────────────────
  describe('validateLineageKunya', () => {
    it('يتطابق عندما أب وابن بنفس الكنية', () => {
      const father: Person = { id: '1', name: 'محمد الهاشمي', gender: Gender.MALE, isDeceased: false };
      const son: Person = { id: '2', name: 'عمر الهاشمي', gender: Gender.MALE, isDeceased: false };
      const result = KunyaEngine.validateLineageKunya(father, son);
      expect(result.match).toBe(true);
    });

    it('يكشف التناقض عندما تختلف الكنية', () => {
      const father: Person = { id: '1', name: 'محمد الهاشمي', gender: Gender.MALE, isDeceased: false };
      const son: Person = { id: '2', name: 'عمر التميمي', gender: Gender.MALE, isDeceased: false };
      const result = KunyaEngine.validateLineageKunya(father, son);
      expect(result.match).toBe(false);
      expect(result.parentKunya).toBe('الهاشمي');
      expect(result.childKunya).toBe('التميمي');
    });

    it('يقترح إضافة كنية للابن إذا الأب لديه كنية', () => {
      const father: Person = { id: '1', name: 'محمد الهاشمي', gender: Gender.MALE, isDeceased: false };
      const son: Person = { id: '2', name: 'عمر', gender: Gender.MALE, isDeceased: false };
      const result = KunyaEngine.validateLineageKunya(father, son);
      expect(result.match).toBe(true);
      expect(result.suggestion).toContain('الهاشمي');
    });

    it('لا يعطي خطأ إذا كلاهما بدون كنية', () => {
      const father: Person = { id: '1', name: 'محمد', gender: Gender.MALE, isDeceased: false };
      const son: Person = { id: '2', name: 'عمر', gender: Gender.MALE, isDeceased: false };
      const result = KunyaEngine.validateLineageKunya(father, son);
      expect(result.match).toBe(true);
    });
  });

  // ── normalizeKunya ──────────────────────────────────────
  describe('normalizeKunya', () => {
    it('يزيل "ال" من البداية', () => {
      expect(KunyaEngine.normalizeKunya('الهاشمي')).toBe('هاشمي');
    });

    it('يزيل "آل" من البداية', () => {
      expect(KunyaEngine.normalizeKunya('آل سعود')).toBe('سعود');
    });
  });

  // ── نشر الكنية ──────────────────────────────────────────
  describe('propagateKunya', () => {
    it('ينشر كنية الأب على أبنائه', () => {
      const nodes: Person[] = [
        { id: 'f', name: 'محمد', gender: Gender.MALE, isDeceased: false, kunya: 'الهاشمي' },
        { id: 's1', name: 'عمر', gender: Gender.MALE, isDeceased: false },
        { id: 's2', name: 'فاطمة', gender: Gender.FEMALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'f', targetId: 's1', type: RelationType.PARENT_MALE },
        { sourceId: 'f', targetId: 's2', type: RelationType.PARENT_MALE },
      ];

      const result = KunyaEngine.propagateKunya(nodes, edges);
      expect(result.find(n => n.id === 's1')?.kunya).toBe('الهاشمي');
      expect(result.find(n => n.id === 's2')?.kunya).toBe('الهاشمي');
    });

    it('ينشر عبر الأجيال (جد → أب → حفيد)', () => {
      const nodes: Person[] = [
        { id: 'gf', name: 'إبراهيم', gender: Gender.MALE, isDeceased: false, kunya: 'القرشي' },
        { id: 'f', name: 'محمد', gender: Gender.MALE, isDeceased: false },
        { id: 's', name: 'عمر', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'gf', targetId: 'f', type: RelationType.PARENT_MALE },
        { sourceId: 'f', targetId: 's', type: RelationType.PARENT_MALE },
      ];

      const result = KunyaEngine.propagateKunya(nodes, edges);
      expect(result.find(n => n.id === 'f')?.kunya).toBe('القرشي');
      expect(result.find(n => n.id === 's')?.kunya).toBe('القرشي');
    });

    it('لا يُعدّل كنية موجودة أصلاً', () => {
      const nodes: Person[] = [
        { id: 'f', name: 'محمد', gender: Gender.MALE, isDeceased: false, kunya: 'الهاشمي' },
        { id: 's', name: 'عمر', gender: Gender.MALE, isDeceased: false, kunya: 'التميمي' },
      ];
      const edges: Relation[] = [
        { sourceId: 'f', targetId: 's', type: RelationType.PARENT_MALE },
      ];

      const result = KunyaEngine.propagateKunya(nodes, edges);
      expect(result.find(n => n.id === 's')?.kunya).toBe('التميمي'); // لم تتغير
    });
  });

  // ── كشف التناقضات ─────────────────────────────────────
  describe('detectMismatches', () => {
    it('يكشف تناقض كنية بين أب وابن', () => {
      const nodes: Person[] = [
        { id: 'f', name: 'محمد الهاشمي', gender: Gender.MALE, isDeceased: false },
        { id: 's', name: 'عمر التميمي', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'f', targetId: 's', type: RelationType.PARENT_MALE },
      ];

      const warnings = KunyaEngine.detectMismatches(nodes, edges);
      expect(warnings.length).toBe(1);
      expect(warnings[0].parentKunya).toBe('الهاشمي');
      expect(warnings[0].childKunya).toBe('التميمي');
    });

    it('لا يعطي تحذير إذا تطابقت الكنية', () => {
      const nodes: Person[] = [
        { id: 'f', name: 'محمد الهاشمي', gender: Gender.MALE, isDeceased: false },
        { id: 's', name: 'عمر الهاشمي', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'f', targetId: 's', type: RelationType.PARENT_MALE },
      ];

      const warnings = KunyaEngine.detectMismatches(nodes, edges);
      expect(warnings.length).toBe(0);
    });
  });

  // ── سلسلة النسب ─────────────────────────────────────────
  describe('buildNasabChain', () => {
    it('يبني سلسلة "بن" كاملة', () => {
      const nodes: Person[] = [
        { id: 'gf', name: 'عبدالمطلب الهاشمي', gender: Gender.MALE, isDeceased: true },
        { id: 'f', name: 'عبدالله', gender: Gender.MALE, isDeceased: true },
        { id: 's', name: 'محمد', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'gf', targetId: 'f', type: RelationType.PARENT_MALE },
        { sourceId: 'f', targetId: 's', type: RelationType.PARENT_MALE },
      ];

      const chain = KunyaEngine.buildNasabChain('s', nodes, edges);
      expect(chain).toBe('محمد بن عبدالله بن عبدالمطلب الهاشمي');
    });

    it('يحترم maxDepth', () => {
      const nodes: Person[] = [
        { id: '1', name: 'أحمد', gender: Gender.MALE, isDeceased: false },
        { id: '2', name: 'محمد', gender: Gender.MALE, isDeceased: false },
        { id: '3', name: 'عمر', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: '1', targetId: '2', type: RelationType.PARENT_MALE },
        { sourceId: '2', targetId: '3', type: RelationType.PARENT_MALE },
      ];

      const chain = KunyaEngine.buildNasabChain('3', nodes, edges, 2);
      expect(chain).toBe('عمر بن محمد');
    });
  });

  // ── الاسم الأول ──────────────────────────────────────────
  describe('getFirstName', () => {
    it('يستخرج الاسم الأول', () => {
      expect(KunyaEngine.getFirstName('محمد الهاشمي')).toBe('محمد');
    });

    it('يتخطى الكنية ويستخرج الاسم المركب', () => {
      expect(KunyaEngine.getFirstName('عبد الله الهاشمي')).toBe('عبد الله');
    });
  });

  // ── اقتراح كنية ─────────────────────────────────────────
  describe('suggestKunya', () => {
    it('يقترح كنية الأب للابن', () => {
      const nodes: Person[] = [
        { id: 'f', name: 'محمد', gender: Gender.MALE, isDeceased: false, kunya: 'الهاشمي' },
        { id: 's', name: 'عمر', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'f', targetId: 's', type: RelationType.PARENT_MALE },
      ];

      expect(KunyaEngine.suggestKunya('s', nodes, edges)).toBe('الهاشمي');
    });

    it('يرجع null إذا لا أب', () => {
      const nodes: Person[] = [
        { id: 's', name: 'عمر', gender: Gender.MALE, isDeceased: false },
      ];

      expect(KunyaEngine.suggestKunya('s', nodes, [])).toBeNull();
    });
  });

  // ── حالات حدية إضافية ────────────────────────────────────
  describe('حالات حدية', () => {
    it('extractKunya: اسم يتكون من "بن" فقط → null', () => {
      const p: Person = { id: '1', name: 'ابن خلدون', gender: Gender.MALE, isDeceased: false };
      // "ابن خلدون" ← "خلدون" ليست كنية (لا تبدأ بـ ال)
      expect(KunyaEngine.extractKunya(p)).toBeNull();
    });

    it('extractKunya: kunya فارغة = fallback للاسم', () => {
      const p: Person = { id: '1', name: 'محمد الأنصاري', gender: Gender.MALE, isDeceased: false, kunya: '  ' };
      // kunya مسافات = fallback
      expect(KunyaEngine.extractKunya(p)).toBe('الأنصاري');
    });

    it('propagateKunya: لا يكسر على بيانات فارغة', () => {
      const result = KunyaEngine.propagateKunya([], []);
      expect(result.length).toBe(0);
    });

    it('detectMismatches: بيانات فارغة', () => {
      expect(KunyaEngine.detectMismatches([], []).length).toBe(0);
    });

    it('buildNasabChain: شخص غير موجود', () => {
      expect(KunyaEngine.buildNasabChain('ghost', [], [])).toBe('');
    });

    it('buildNasabChain: شخص بدون أب = اسمه فقط', () => {
      const nodes: Person[] = [
        { id: 'a', name: 'أحمد الهاشمي', gender: Gender.MALE, isDeceased: false },
      ];
      const chain = KunyaEngine.buildNasabChain('a', nodes, []);
      expect(chain).toContain('أحمد');
      expect(chain).toContain('الهاشمي');
    });

    it('getFirstName: نص فارغ', () => {
      expect(KunyaEngine.getFirstName('')).toBe('');
    });

    it('suggestKunya: أب بدون كنية = null', () => {
      const nodes: Person[] = [
        { id: 'f', name: 'أحمد', gender: Gender.MALE, isDeceased: false },
        { id: 's', name: 'عمر', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'f', targetId: 's', type: RelationType.PARENT_MALE },
      ];
      expect(KunyaEngine.suggestKunya('s', nodes, edges)).toBeNull();
    });

    it('propagateKunya: لا يُعدّل nodes الأصلية (deep copy)', () => {
      const nodes: Person[] = [
        { id: 'f', name: 'محمد', gender: Gender.MALE, isDeceased: false, kunya: 'الهاشمي' },
        { id: 's', name: 'عمر', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'f', targetId: 's', type: RelationType.PARENT_MALE },
      ];
      const copy = JSON.stringify(nodes);
      KunyaEngine.propagateKunya(nodes, edges);
      expect(JSON.stringify(nodes)).toBe(copy);
    });

    it('detectMismatches: تجاهل علاقات غير أبوية', () => {
      const nodes: Person[] = [
        { id: 'a', name: 'أحمد الهاشمي', gender: Gender.MALE, isDeceased: false },
        { id: 'b', name: 'خالد التميمي', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'a', targetId: 'b', type: RelationType.SIBLING_MALE },
      ];
      const warnings = KunyaEngine.detectMismatches(nodes, edges);
      expect(warnings.length).toBe(0); // أخوة ≠ أبوة
    });
  });
});
