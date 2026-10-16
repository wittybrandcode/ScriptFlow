import { describe, expect, it } from 'vitest';
import { ExplanationEngine, ExplanationStep } from '../src/explanation';

describe('Nasab Rule Engine Explanation', () => {
  it('should generate explanation markdown correctly', () => {
    const engine = new ExplanationEngine();

    engine.logStep({
      ruleId: 'MOTHER_GETS_ONE_SIXTH',
      nameAr: 'نصيب الأم - السدس',
      description: 'ترث الأم السدس في حال وجود فرع وارث.',
      targetNodeId: 'mother_1',
      effectApplied: { type: 'ASSIGN_FRACTIONAL_SHARE', value: '1/6', label: 'فرض السدس' },
      evidence: [
        { source: 'QURAN_4_11', text: 'فَإِن كَانَ لَهُ إِخْوَةٌ فَلِأُمِّهِ السُّدُسُ' }
      ]
    });

    const md = engine.generateExplanationMarkdown();
    expect(md).toContain('# مستند التفسير والاستدلال الفقهي');
    expect(md).toContain('نصيب الأم - السدس');
    expect(md).toContain('ترث الأم السدس في حال وجود فرع وارث.');
    expect(md).toContain('فرض السدس');
    expect(md).toContain('فَإِن كَانَ لَهُ إِخْوَةٌ فَلِأُمِّهِ السُّدُسُ');
  });
});
