import { describe, it, expect } from 'vitest';
import { GedcomEngine } from '../importers/GedcomEngine';
import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';

// ═══════════════════════════════════════════════
// مساعدات
// ═══════════════════════════════════════════════
const male = (id: string, name: string, deceased = false): Person => ({ id, name, gender: Gender.MALE, isDeceased: deceased });
const female = (id: string, name: string, deceased = false): Person => ({ id, name, gender: Gender.FEMALE, isDeceased: deceased });
const edge = (src: string, tgt: string, type: RelationType): Relation => ({ sourceId: src, targetId: tgt, type });

describe('GedcomEngine — اختبارات شاملة', () => {

  // ═══════════════════════════════════════════════
  // 1. التحليل (parse)
  // ═══════════════════════════════════════════════
  describe('parse — التحليل', () => {
    it('يُحلل ملف GEDCOM بسيط بشكل صحيح', () => {
      const gedcom = `0 HEAD\n1 CHAR UTF-8\n0 @P1@ INDI\n1 NAME أحمد /الهاشمي/\n1 SEX M\n0 TRLR`;
      const { nodes } = GedcomEngine.parse(gedcom);
      expect(nodes.length).toBe(1);
      expect(nodes[0].name).toBe('أحمد الهاشمي');
      expect(nodes[0].gender).toBe(Gender.MALE);
    });

    it('يُحلل أنثى بشكل صحيح', () => {
      const gedcom = `0 HEAD\n1 CHAR UTF-8\n0 @P1@ INDI\n1 NAME فاطمة //\n1 SEX F\n0 TRLR`;
      const { nodes } = GedcomEngine.parse(gedcom);
      expect(nodes[0].gender).toBe(Gender.FEMALE);
    });

    it('يُعيّن الجنس الافتراضي كذكر', () => {
      const gedcom = `0 HEAD\n0 @P1@ INDI\n1 NAME مجهول //\n0 TRLR`;
      const { nodes } = GedcomEngine.parse(gedcom);
      expect(nodes[0].gender).toBe(Gender.MALE);
    });

    it('يُحلل عائلة مع زوج وزوجة وأبناء', () => {
      const gedcom = `0 HEAD\n1 CHAR UTF-8
0 @H@ INDI\n1 NAME أحمد //\n1 SEX M
0 @W@ INDI\n1 NAME سارة //\n1 SEX F
0 @C1@ INDI\n1 NAME عمر //\n1 SEX M
0 @F1@ FAM\n1 HUSB @H@\n1 WIFE @W@\n1 CHIL @C1@
0 TRLR`;
      const { nodes, edges } = GedcomEngine.parse(gedcom);
      expect(nodes.length).toBe(3);
      // زوج ← زوجة + أب ← ابن + أم ← ابن
      expect(edges.length).toBe(3);
    });

    it('يُعيّن isDeceased عند وجود DEAT', () => {
      const gedcom = `0 HEAD\n0 @P1@ INDI\n1 NAME أحمد //\n1 SEX M\n1 DEAT\n0 TRLR`;
      const { nodes } = GedcomEngine.parse(gedcom);
      expect(nodes[0].isDeceased).toBe(true);
    });

    it('يُحلل عدة عائلات', () => {
      const gedcom = `0 HEAD\n1 CHAR UTF-8
0 @H@ INDI\n1 NAME أحمد //\n1 SEX M
0 @W1@ INDI\n1 NAME سارة //\n1 SEX F
0 @W2@ INDI\n1 NAME فاطمة //\n1 SEX F
0 @C1@ INDI\n1 NAME عمر //\n1 SEX M
0 @F1@ FAM\n1 HUSB @H@\n1 WIFE @W1@\n1 CHIL @C1@
0 @F2@ FAM\n1 HUSB @H@\n1 WIFE @W2@
0 TRLR`;
      const { nodes, edges } = GedcomEngine.parse(gedcom);
      expect(nodes.length).toBe(4);
      // F1: spouse + father→child + mother→child = 3
      // F2: spouse = 1
      expect(edges.length).toBe(4);
    });

    it('نص فارغ = بلا نتائج', () => {
      const { nodes, edges } = GedcomEngine.parse('');
      expect(nodes.length).toBe(0);
      expect(edges.length).toBe(0);
    });

    it('نص بدون INDI = بلا أشخاص', () => {
      const { nodes } = GedcomEngine.parse('0 HEAD\n1 CHAR UTF-8\n0 TRLR');
      expect(nodes.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════
  // 2. التوليد (generate)
  // ═══════════════════════════════════════════════
  describe('generate — التوليد', () => {
    it('يُولد GEDCOM صحيح لشخص واحد', () => {
      const nodes = [male('1', 'أحمد الهاشمي')];
      const gedcom = GedcomEngine.generate(nodes, []);
      expect(gedcom).toContain('0 @1@ INDI');
      expect(gedcom).toContain('1 SEX M');
      expect(gedcom).toContain('0 HEAD');
      expect(gedcom).toContain('0 TRLR');
    });

    it('يُولد GEDCOM صحيح لأنثى', () => {
      const nodes = [female('1', 'فاطمة')];
      const gedcom = GedcomEngine.generate(nodes, []);
      expect(gedcom).toContain('1 SEX F');
    });

    it('يُولد DEAT للمتوفى', () => {
      const nodes = [{ ...male('1', 'أحمد'), isDeceased: true }];
      const gedcom = GedcomEngine.generate(nodes, []);
      expect(gedcom).toContain('1 DEAT');
    });

    it('لا يُولد DEAT للحي', () => {
      const nodes = [male('1', 'أحمد')];
      const gedcom = GedcomEngine.generate(nodes, []);
      expect(gedcom).not.toContain('1 DEAT');
    });

    it('يُولد عائلة من زوجين', () => {
      const nodes = [male('h', 'أحمد'), female('w', 'سارة')];
      const edges = [edge('h', 'w', RelationType.SPOUSE_MALE)];
      const gedcom = GedcomEngine.generate(nodes, edges);
      expect(gedcom).toContain('1 HUSB @h@');
      expect(gedcom).toContain('1 WIFE @w@');
    });

    it('يُولد عائلة مع أبناء', () => {
      const nodes = [male('f', 'أب'), female('m', 'أم'), male('s', 'ابن')];
      const edges = [
        edge('f', 'm', RelationType.SPOUSE_MALE),
        edge('f', 's', RelationType.PARENT_MALE),
        edge('m', 's', RelationType.PARENT_FEMALE),
      ];
      const gedcom = GedcomEngine.generate(nodes, edges);
      expect(gedcom).toContain('1 CHIL @s@');
    });

    it('بيانات فارغة = header + trailer فقط', () => {
      const gedcom = GedcomEngine.generate([], []);
      expect(gedcom).toContain('0 HEAD');
      expect(gedcom).toContain('0 TRLR');
      expect(gedcom).not.toContain('INDI');
    });
  });

  // ═══════════════════════════════════════════════
  // 3. جولة كاملة (roundtrip)
  // ═══════════════════════════════════════════════
  describe('roundtrip — توليد ثم تحليل', () => {
    it('عائلة بسيطة تبقى كما هي بعد generate→parse', () => {
      const originalNodes = [male('h', 'أحمد'), female('w', 'سارة'), male('s', 'عمر')];
      const originalEdges = [
        edge('h', 'w', RelationType.SPOUSE_MALE),
        edge('h', 's', RelationType.PARENT_MALE),
        edge('w', 's', RelationType.PARENT_FEMALE),
      ];
      const gedcom = GedcomEngine.generate(originalNodes, originalEdges);
      const { nodes, edges } = GedcomEngine.parse(gedcom);
      expect(nodes.length).toBe(3);
      // يجب أن يكون هناك على الأقل علاقة الأبوة
      expect(edges.length).toBeGreaterThanOrEqual(2);
    });
  });
});
