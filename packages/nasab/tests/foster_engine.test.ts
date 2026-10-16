import { describe, it, expect } from 'vitest';
import { FosterEngine, FosterRecord } from '../src/kinship/FosterEngine';
import { KinshipValidator } from '../src/kinship/KinshipValidator';
import { RelationType, Gender } from '../src/core/enums';
import { Person, Relation } from '../src/core/types';

describe('FosterEngine — الرضاع', () => {
  // ---- Validation ----
  describe('validateFosterConditions', () => {
    it('قبول رضاع مكتمل (5 رضعات بعمر سنتين)', () => {
      const errors = FosterEngine.validateFosterConditions({ childId: 'c', nurseId: 'n', numberOfFeedings: 5, childAgeAtNursing: 24 });
      expect(errors).toHaveLength(0);
    });

    it('رفض رضاع ناقص (أقل من 5 رضعات)', () => {
      const errors = FosterEngine.validateFosterConditions({ childId: 'c', nurseId: 'n', numberOfFeedings: 3, childAgeAtNursing: 12 });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('5');
    });

    it('رفض رضاع بعد سن الرضاعة (أكثر من 24 شهراً)', () => {
      const errors = FosterEngine.validateFosterConditions({ childId: 'c', nurseId: 'n', numberOfFeedings: 5, childAgeAtNursing: 36 });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('24');
    });

    it('رفض رضاع بعمر سالب', () => {
      const errors = FosterEngine.validateFosterConditions({ childId: 'c', nurseId: 'n', numberOfFeedings: 5, childAgeAtNursing: -1 });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('سالب');
    });

    it('رفض رضاع ناقص + تجاوز العمر معاً', () => {
      const errors = FosterEngine.validateFosterConditions({ childId: 'c', nurseId: 'n', numberOfFeedings: 2, childAgeAtNursing: 30 });
      expect(errors).toHaveLength(2);
    });
  });

  // ---- Inference ----
  describe('inferFosterRelationships', () => {
    const nurse: Person = { id: 'n1', name: 'فاطمة', gender: Gender.FEMALE, isDeceased: false };
    const husband: Person = { id: 'h1', name: 'سعيد', gender: Gender.MALE, isDeceased: false };
    const child: Person = { id: 'c1', name: 'خالد', gender: Gender.MALE, isDeceased: false };
    const bioChild: Person = { id: 'b1', name: 'سارة', gender: Gender.FEMALE, isDeceased: false };

    const records: FosterRecord[] = [
      { childId: 'c1', nurseId: 'n1', husbandId: 'h1', numberOfFeedings: 5, childAgeAtNursing: 6 }
    ];

    const people = [nurse, husband, child, bioChild];
    const existing: Relation[] = [
      { sourceId: 'n1', targetId: 'b1', type: RelationType.PARENT_FEMALE }
    ];

    it('إنشاء علاقات الرضاع الأساسية (أم، أب، ابن)', () => {
      const result = FosterEngine.inferFosterRelationships(records, people, existing);
      expect(result.some(r => r.type === RelationType.FOSTER_MOTHER && r.sourceId === 'n1' && r.targetId === 'c1')).toBe(true);
      expect(result.some(r => r.type === RelationType.FOSTER_FATHER && r.sourceId === 'h1' && r.targetId === 'c1')).toBe(true);
      expect(result.some(r => r.type === RelationType.FOSTER_SON && r.sourceId === 'c1' && r.targetId === 'n1')).toBe(true);
      expect(result.some(r => r.type === RelationType.FOSTER_SON && r.sourceId === 'c1' && r.targetId === 'h1')).toBe(true);
    });

    it('إنشاء علاقة أخوة من الرضاع مع الأبناء البيولوجيين للمرضعة', () => {
      const result = FosterEngine.inferFosterRelationships(records, people, existing);
      expect(result.some(r => r.type === RelationType.FOSTER_SISTER && r.sourceId === 'b1' && r.targetId === 'c1')).toBe(true);
      expect(result.some(r => r.type === RelationType.FOSTER_BROTHER && r.sourceId === 'c1' && r.targetId === 'b1')).toBe(true);
    });

    it('عدم إنشاء علاقات لرضاع غير مكتمل', () => {
      const badRecords: FosterRecord[] = [
        { childId: 'c1', nurseId: 'n1', numberOfFeedings: 2, childAgeAtNursing: 6 }
      ];
      const result = FosterEngine.inferFosterRelationships(badRecords, people, existing);
      expect(result).toHaveLength(0);
    });
  });

  // ---- Prohibited Marriages ----
  describe('getProhibitedMarriages', () => {
    const fosterRelations = [
      { type: RelationType.FOSTER_MOTHER, sourceId: 'n1', targetId: 'c1' },
      { type: RelationType.FOSTER_FATHER, sourceId: 'h1', targetId: 'c1' },
      { type: RelationType.FOSTER_SISTER, sourceId: 'c1', targetId: 'b1' }
    ];

    it('تحريم الزواج بين الرضيع ومرضعته', () => {
      expect(FosterEngine.getProhibitedMarriages('c1', 'n1', fosterRelations)).toBe(true);
    });

    it('تحريم الزواج بين الرضيع وزوج المرضعة (أب من الرضاع)', () => {
      expect(FosterEngine.getProhibitedMarriages('c1', 'h1', fosterRelations)).toBe(true);
    });

    it('تحريم الزواج بين الرضيع وأبناء المرضعة (إخوة من الرضاع)', () => {
      expect(FosterEngine.getProhibitedMarriages('c1', 'b1', fosterRelations)).toBe(true);
    });

    it('عدم تحريم زواج لا علاقة له بالرضاع', () => {
      expect(FosterEngine.getProhibitedMarriages('x1', 'y1', fosterRelations)).toBe(false);
    });
  });

  // ---- Integration with KinshipValidator ----
  describe('KinshipValidator + FosterEngine', () => {
    it('منع الزواج بين الرضيع ومرضعته عبر الـ Validator', () => {
      const nodes: Person[] = [
        { id: 'c1', name: 'خالد', gender: Gender.MALE, isDeceased: false },
        { id: 'n1', name: 'فاطمة', gender: Gender.FEMALE, isDeceased: false }
      ];
      const fosterRelations = [
        { type: RelationType.FOSTER_MOTHER, sourceId: 'n1', targetId: 'c1' }
      ];
      const result = KinshipValidator.validate('c1', 'n1', 'SPOUSE_MALE', nodes, [], 'ISLAMIC_LAW', {}, fosterRelations as any);
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR' && result.error) {
        expect(result.error.code).toBe('ERR_FOSTER_MARRIAGE_VIOLATION');
      }
    });

    it('السماح بالزواج عند عدم وجود علاقة رضاع', () => {
      const nodes: Person[] = [
        { id: 'c1', name: 'خالد', gender: Gender.MALE, isDeceased: false },
        { id: 'x1', name: 'هند', gender: Gender.FEMALE, isDeceased: false }
      ];
      const result = KinshipValidator.validate('c1', 'x1', 'SPOUSE_MALE', nodes, [], 'ISLAMIC_LAW', {}, []);
      expect(result.status).toBe('SUCCESS');
    });
  });
});
