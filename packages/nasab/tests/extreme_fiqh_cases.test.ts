import { describe, it, expect } from 'vitest';
import { BaseEngine } from '../src/engine/BaseEngine';
import { Heir } from '../src/types/Kinship';

describe('Extreme Fiqh Cases (المسائل الفقهية الشاذة والمعقدة)', () => {

  it('should correctly calculate Al-Musharraka / Himariyyah (المشرّكة / الحمارية)', () => {
    // الزوج: 1/2
    // الأم: 1/6
    // الإخوة لأم (2+): 1/3
    // الإخوة الأشقاء: في التشريك يشاركون الإخوة لأم في الثلث
    const heirs: Heir[] = [
      { id: 'h1', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'ms1', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: 'ms2', type: 'UTERINE_BROTHER', gender: 'MALE' },
      { id: 'fs1', type: 'FULL_BROTHER', gender: 'MALE' },
      { id: 'fs2', type: 'FULL_BROTHER', gender: 'MALE' }
    ];

    // In COMMON (default) madhab, Musharraka is not applied
    const engineCommon = new BaseEngine('COMMON');
    const resultCommon = engineCommon.solve(heirs);
    expect(resultCommon.baseOrigin).toBe(6);
    // Without Musharraka: full brothers get nothing (remainder is 0)
    expect(resultCommon.shares['fs1'].fraction).toBe('0/1');
    expect(resultCommon.shares['fs2'].fraction).toBe('0/1');

    // In SHAFII madhab, Musharraka applies: all 4 siblings share 1/3 equally
    const engineShafii = new BaseEngine('SHAFII');
    const resultShafii = engineShafii.solve(heirs);
    // Each sibling gets 1/12 (1/3 ÷ 4)
    expect(resultShafii.shares['ms1'].fraction).toBe('1/12');
    expect(resultShafii.shares['ms2'].fraction).toBe('1/12');
    expect(resultShafii.shares['fs1'].fraction).toBe('1/12');
    expect(resultShafii.shares['fs2'].fraction).toBe('1/12');
    expect(resultShafii.shares['ms1'].type).toBe('FARD_MUSHARRAKA');
  });

  it('should correctly calculate Al-Akdariya (الأكدرية)', () => {
    // الزوج: 1/2, الأم: 1/3, الجد: 1/6, الأخت الشقيقة: 1/2
    // تعول إلى 9 ثم يُجمع نصيب الجد والأخت ويُقسم للذكر مثل حظ الأنثيين
    // الناتج: الزوج 9/27, الأم 6/27, الجد 8/27, الأخت 4/27
    const heirs: Heir[] = [
      { id: 'h1', type: 'SPOUSE_MALE', gender: 'MALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'gf1', type: 'GRANDFATHER', gender: 'MALE' },
      { id: 's1', type: 'FULL_SISTER', gender: 'FEMALE' }
    ];

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);

    expect(result.shares['h1'].fraction).toBe('9/27');
    expect(result.shares['m1'].fraction).toBe('6/27');
    expect(result.shares['gf1'].fraction).toBe('8/27');
    expect(result.shares['s1'].fraction).toBe('4/27');
    expect(result.tashihOrigin).toBe(27);
  });

  it('should correctly calculate Al-Dinariyyah (الدينارية - مسألة داود الطائي)', () => {
    // الزوجة: 1/8
    // الجدة (أو الأم): 1/6
    // بنتان: 2/3
    // 12 أخ شقيق + أخت شقيقة (المجموع = 25 سهم عصبة)
    // أصل المسألة = 24.
    // الزوجة: 3/24
    // الجدة: 4/24
    // البنتان: 16/24
    // المتبقي للعصبة = 1/24. يضرب أصل المسألة في 25 -> 24 * 25 = 600
    // التركة الكلية = 600. نصيب الأخت الشقيقة = 1/600 (أي دينار واحد لو كانت التركة 600 دينار).
    const heirs: Heir[] = [
      { id: 'w1', type: 'SPOUSE_FEMALE', gender: 'FEMALE' },
      { id: 'm1', type: 'MOTHER', gender: 'FEMALE' },
      { id: 'd1', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 'd2', type: 'DAUGHTER', gender: 'FEMALE' },
      { id: 's1', type: 'FULL_SISTER', gender: 'FEMALE' }
    ];
    
    // Add 12 Full brothers
    for(let i = 1; i <= 12; i++) {
        heirs.push({ id: `b${i}`, type: 'FULL_BROTHER', gender: 'MALE' });
    }

    const engine = new BaseEngine('COMMON');
    const result = engine.solve(heirs);

    // Tashih adjusts the origin from 24 to 600 (24 * 25 sibling heads)
    expect(result.tashihOrigin).toBe(600);

    // All fractions expressed at denominator 600 after tashih
    // Wife: 3/24 → 75/600
    expect(result.shares['w1'].fraction).toBe('75/600');
    // Mother: 4/24 → 100/600
    expect(result.shares['m1'].fraction).toBe('100/600');
    // Daughters: 8/24 each → 200/600 each
    expect(result.shares['d1'].fraction).toBe('200/600');
    expect(result.shares['d2'].fraction).toBe('200/600');
    
    // The Sister should get exactly 1/600
    expect(result.shares['s1'].fraction).toBe('1/600');
    // Each brother should get exactly 2/600
    expect(result.shares['b1'].fraction).toBe('2/600');
  });
});
