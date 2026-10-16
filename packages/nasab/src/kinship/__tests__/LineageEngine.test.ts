import { describe, it, expect } from 'vitest';
import { LineageEngine } from '../LineageEngine';
import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';

const male = (id: string, name: string, kunya?: string): Person => ({ id, name, gender: Gender.MALE, isDeceased: false, kunya });
const female = (id: string, name: string): Person => ({ id, name, gender: Gender.FEMALE, isDeceased: false });
const edge = (src: string, tgt: string, type: RelationType): Relation => ({ sourceId: src, targetId: tgt, type });

describe('LineageEngine — اختبارات شاملة', () => {

  // ═══════════════════════════════════════════════
  // 1. النشر الأساسي
  // ═══════════════════════════════════════════════
  describe('النشر الأساسي', () => {
    it('ينشر lineageId من الجد إلى الابن والحفيد', () => {
      const nodes = [male('gf', 'جد'), male('f', 'أب'), male('s', 'ابن')];
      const edges = [
        edge('gf', 'f', RelationType.PARENT_MALE),
        edge('f', 's', RelationType.PARENT_MALE),
      ];
      const r = LineageEngine.propagate(nodes, edges);
      const lid = r.find(n => n.id === 'gf')?.lineageId;
      expect(lid).toBeDefined();
      expect(r.find(n => n.id === 'f')?.lineageId).toBe(lid);
      expect(r.find(n => n.id === 's')?.lineageId).toBe(lid);
    });

    it('ينشر lineageId للبنات أيضاً', () => {
      const nodes = [male('f', 'أب'), female('d', 'بنت')];
      const edges = [edge('f', 'd', RelationType.PARENT_MALE)];
      const r = LineageEngine.propagate(nodes, edges);
      expect(r.find(n => n.id === 'd')?.lineageId).toBe(r.find(n => n.id === 'f')?.lineageId);
    });

    it('سلالتان مستقلتان = lineageId مختلف', () => {
      const nodes = [male('p1', 'أب1'), male('p2', 'أب2')];
      const r = LineageEngine.propagate(nodes, []);
      expect(r.find(n => n.id === 'p1')?.lineageId).not.toBe(r.find(n => n.id === 'p2')?.lineageId);
    });

    it('لا ينشر عبر الأم (النسب الأبوي فقط)', () => {
      const nodes = [female('m', 'أم'), male('s', 'ابن')];
      const edges = [edge('m', 's', RelationType.PARENT_FEMALE)];
      const r = LineageEngine.propagate(nodes, edges);
      expect(r.find(n => n.id === 'm')?.lineageId).toBeUndefined();
      expect(r.find(n => n.id === 's')?.lineageId).toBeDefined(); // هو patriarch
    });
  });

  // ═══════════════════════════════════════════════
  // 2. الكنية كمعرف سلالة
  // ═══════════════════════════════════════════════
  describe('الكنية كمعرف', () => {
    it('يستخدم الكنية كـ lineageId إذا وجدت', () => {
      const nodes = [male('p', 'أحمد الهاشمي'), male('s', 'عمر')];
      const edges = [edge('p', 's', RelationType.PARENT_MALE)];
      const r = LineageEngine.propagate(nodes, edges);
      expect(r.find(n => n.id === 'p')?.lineageId).toBe('الهاشمي');
      expect(r.find(n => n.id === 's')?.lineageId).toBe('الهاشمي');
    });

    it('يستخدم kunya field إذا وجد', () => {
      const nodes = [male('p', 'أحمد', 'القرشي'), male('s', 'عمر')];
      const edges = [edge('p', 's', RelationType.PARENT_MALE)];
      const r = LineageEngine.propagate(nodes, edges);
      expect(r.find(n => n.id === 'p')?.lineageId).toBe('القرشي');
    });

    it('يسقط L1 إذا لا كنية', () => {
      const nodes = [male('p', 'أحمد')];
      const r = LineageEngine.propagate(nodes, []);
      expect(r.find(n => n.id === 'p')?.lineageId).toBe('L1');
    });
  });

  // ═══════════════════════════════════════════════
  // 3. حالات حدية
  // ═══════════════════════════════════════════════
  describe('حالات حدية', () => {
    it('بيانات فارغة = مصفوفة فارغة', () => {
      expect(LineageEngine.propagate([], []).length).toBe(0);
    });

    it('شخص واحد بدون علاقات', () => {
      const r = LineageEngine.propagate([male('a', 'أحمد')], []);
      expect(r[0].lineageId).toBe('L1');
    });

    it('FIX-14: لا يُعدّل المدخلات الأصلية (deep copy)', () => {
      const nodes = [male('a', 'أحمد')];
      const copy = JSON.stringify(nodes);
      LineageEngine.propagate(nodes, []);
      // بعد FIX-14: كائنات Person تُنسخ بالكامل
      expect(JSON.stringify(nodes)).toBe(copy);
    });

    it('4 أجيال متسلسلة', () => {
      const nodes = [
        male('g1', 'جيل1'), male('g2', 'جيل2'),
        male('g3', 'جيل3'), male('g4', 'جيل4'),
      ];
      const edges = [
        edge('g1', 'g2', RelationType.PARENT_MALE),
        edge('g2', 'g3', RelationType.PARENT_MALE),
        edge('g3', 'g4', RelationType.PARENT_MALE),
      ];
      const r = LineageEngine.propagate(nodes, edges);
      const lid = r.find(n => n.id === 'g1')?.lineageId;
      expect(r.every(n => n.lineageId === lid)).toBe(true);
    });
  });
});
