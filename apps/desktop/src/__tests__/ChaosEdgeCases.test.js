import { describe, it, expect } from 'vitest';

// استيراد الأنظمة المراد فحص صلابتها
import { KinshipValidator } from '../../../../packages/nasab/src/kinship/KinshipValidator';
import { GedcomEngine } from '../../../../packages/nasab/src/plugins/GedcomEngine';

describe('Chaos & Edge Cases Testing', () => {

  it('1. KinshipValidator should block impossible biological ages (5 year old father)', () => {
    // محاولة بناء علاقة أبوية مستحيلة بيولوجياً
    const nodes = [
      { id: 'father_1', name: 'الطفل الأب', birthDate: 2015, gender: 'MALE' },
      { id: 'son_1', name: 'الابن', birthDate: 2020, gender: 'MALE' }
    ];
    
    const impossibleValidation = KinshipValidator.validate(
      'father_1', 'son_1', 'PARENT_MALE', nodes, []
    );

    expect(impossibleValidation.status).toBe('ERROR');
    expect(impossibleValidation.error).toBeDefined();
    expect(impossibleValidation.error.message).toContain('فرق العمر غير منطقي');
  });

  it('2. GedcomEngine should gracefully handle totally corrupted garbage data without crashing', async () => {
    const garbageData = "THIS IS NOT A REAL GEDCOM FILE \n JUST GARBAGE! 12345 0 @I1@ INDIIIII";
    
    // يجب أن يعالج الخطأ ويرجع فشلاً، لا أن ينهار بشكل حرج (Crash)
    const result = GedcomEngine.parse(garbageData);
    
    expect(result).toBeDefined();
    expect(result.nodes.length).toBe(0);
    expect(result.edges.length).toBe(0);
    // إذا وصلنا إلى هذا السطر ولم ينهار البرنامج، فقد نجح الاختبار!
  });

});
