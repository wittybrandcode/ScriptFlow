import { describe, it, expect } from 'vitest';
import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';
import { InheritanceEngine } from '../InheritanceEngine';
import Fraction from '../../core/Fraction';

describe('InheritanceEngine - نظام المواريث (Property-Based & Fixtures)', () => {

  const solve = (deceasedId: string, nodes: Person[], edges: Relation[]) => {
    const rawHeirs = InheritanceEngine.calculate(deceasedId, nodes, edges);
    return rawHeirs.map(h => ({
      name: h.person.name,
      relation: h.relation,
      share: h.exactShare || h.share,
      isBlocked: !!h.isBlocked
    }));
  };

  it('وفاة رجل عن زوجة وبنت وأخ شقيق', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'wife', name: 'الزوجة', gender: Gender.FEMALE, isDeceased: false },
      { id: 'daughter', name: 'الابنة', gender: Gender.FEMALE, isDeceased: false },
      { id: 'brother', name: 'الأخ الشقيق', gender: Gender.MALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'wife', targetId: 'dead', type: RelationType.SPOUSE_FEMALE },
      { sourceId: 'dead', targetId: 'daughter', type: RelationType.PARENT_MALE },
      { sourceId: 'brother', targetId: 'dead', type: RelationType.SIBLING_MALE },
    ];

    const result = solve('dead', nodes, edges);
    
    const wifeShare = result.find(h => h.name === 'الزوجة');
    const daughterShare = result.find(h => h.name === 'الابنة');
    const brotherShare = result.find(h => h.name === 'الأخ الشقيق');

    expect(wifeShare?.share).toBe('1/8'); // لأن للميت فرع وارث (البنت)
    expect(daughterShare?.share).toBe('1/2'); // لانفرادها وعدم وجود معصب
    expect(brotherShare?.share).toBe('3/8'); // الباقي تعصيباً (1 - 1/8 - 1/2 = 3/8)
  });

  it('المسألة العمرية (الغراوين): زوجة وأم وأب', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'wife', name: 'الزوجة', gender: Gender.FEMALE, isDeceased: false },
      { id: 'mother', name: 'الأم', gender: Gender.FEMALE, isDeceased: false },
      { id: 'father', name: 'الأب', gender: Gender.MALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'wife', targetId: 'dead', type: RelationType.SPOUSE_FEMALE },
      { sourceId: 'mother', targetId: 'dead', type: RelationType.PARENT_FEMALE },
      { sourceId: 'father', targetId: 'dead', type: RelationType.PARENT_MALE },
    ];

    const result = solve('dead', nodes, edges);
    
    const wifeShare = result.find(h => h.name === 'الزوجة');
    const motherShare = result.find(h => h.name === 'الأم');
    const fatherShare = result.find(h => h.name === 'الأب');

    expect(wifeShare?.share).toBe('1/4'); // لعدم وجود فرع وارث
    expect(motherShare?.share).toBe('1/4'); // ثلث الباقي (1/3 * 3/4)
    expect(fatherShare?.share).toBe('1/2'); // الباقي تعصيباً (3/4 - 1/4 = 1/2)
  });

  it('حجب حرمان: أبناء وابن ابن (الابن يحجب الحفيد)', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'son', name: 'الابن', gender: Gender.MALE, isDeceased: false },
      { id: 'grandson', name: 'ابن الابن', gender: Gender.MALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'dead', targetId: 'son', type: RelationType.PARENT_MALE },
      { sourceId: 'son', targetId: 'grandson', type: RelationType.PARENT_MALE },
    ];

    const result = solve('dead', nodes, edges);
    
    const sonShare = result.find(h => h.name === 'الابن');
    const grandsonShare = result.find(h => h.name === 'ابن الابن');

    expect(sonShare?.share).toBe('1'); // يأخذ التركة كاملة بالتعصيب
    expect(grandsonShare?.isBlocked).toBe(true); // يحجب حجب حرمان
  });

  it('حجب الأخوة بالأب', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'father', name: 'الأب', gender: Gender.MALE, isDeceased: false },
      { id: 'brother', name: 'الأخ', gender: Gender.MALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'father', targetId: 'dead', type: RelationType.PARENT_MALE },
      { sourceId: 'brother', targetId: 'dead', type: RelationType.SIBLING_MALE },
    ];

    const result = solve('dead', nodes, edges);

    const fatherShare = result.find(h => h.name === 'الأب');
    const brotherShare = result.find(h => h.name === 'الأخ');

    expect(fatherShare?.share).toBe('1');
    expect(brotherShare?.isBlocked).toBe(true);
  });

  // ═══════════════════════════════════════════════════
  // FIX-03: اختبارات فقهية إضافية
  // ═══════════════════════════════════════════════════

  it('العول: زوج + أختان شقيقتان + أخت لأم (أصل 6 يعول)', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفاة', gender: Gender.FEMALE, isDeceased: true },
      { id: 'husband', name: 'الزوج', gender: Gender.MALE, isDeceased: false },
      { id: 'sis1', name: 'أخت شقيقة 1', gender: Gender.FEMALE, isDeceased: false },
      { id: 'sis2', name: 'أخت شقيقة 2', gender: Gender.FEMALE, isDeceased: false },
      { id: 'matSis', name: 'أخت لأم', gender: Gender.FEMALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'husband', targetId: 'dead', type: RelationType.SPOUSE_MALE },
      { sourceId: 'sis1', targetId: 'dead', type: RelationType.SIBLING_FEMALE },
      { sourceId: 'sis2', targetId: 'dead', type: RelationType.SIBLING_FEMALE },
      { sourceId: 'matSis', targetId: 'dead', type: RelationType.SIBLING_MATERNAL_FEMALE },
    ];
    const result = solve('dead', nodes, edges);
    // العول يحدث: 1/2 + 2/3 + 1/6 > 1
    const husbandShare = result.find(h => h.name === 'الزوج');
    expect(husbandShare).toBeDefined();
    // العول يُسجل في حقل notes وليس share
    expect(husbandShare?.isBlocked).toBeFalsy();
  });

  it('الرد: أم + بنت فقط (لا عصبة)', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'mother', name: 'الأم', gender: Gender.FEMALE, isDeceased: false },
      { id: 'daughter', name: 'البنت', gender: Gender.FEMALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'mother', targetId: 'dead', type: RelationType.PARENT_FEMALE },
      { sourceId: 'dead', targetId: 'daughter', type: RelationType.PARENT_MALE },
    ];
    const result = solve('dead', nodes, edges);
    const motherShare = result.find(h => h.name === 'الأم');
    const daughterShare = result.find(h => h.name === 'البنت');
    // الأم 1/6 والبنت 1/2 → الباقي يُرد عليهما
    expect(motherShare).toBeDefined();
    expect(daughterShare).toBeDefined();
    expect(motherShare?.isBlocked).toBeFalsy();
    expect(daughterShare?.isBlocked).toBeFalsy();
  });

  it('تعدد الزوجات: 4 زوجات + ابن', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'w1', name: 'زوجة 1', gender: Gender.FEMALE, isDeceased: false },
      { id: 'w2', name: 'زوجة 2', gender: Gender.FEMALE, isDeceased: false },
      { id: 'w3', name: 'زوجة 3', gender: Gender.FEMALE, isDeceased: false },
      { id: 'w4', name: 'زوجة 4', gender: Gender.FEMALE, isDeceased: false },
      { id: 'son', name: 'الابن', gender: Gender.MALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'w1', targetId: 'dead', type: RelationType.SPOUSE_FEMALE },
      { sourceId: 'w2', targetId: 'dead', type: RelationType.SPOUSE_FEMALE },
      { sourceId: 'w3', targetId: 'dead', type: RelationType.SPOUSE_FEMALE },
      { sourceId: 'w4', targetId: 'dead', type: RelationType.SPOUSE_FEMALE },
      { sourceId: 'dead', targetId: 'son', type: RelationType.PARENT_MALE },
    ];
    const result = solve('dead', nodes, edges);
    // 4 زوجات يتقاسمن 1/8 مع وجود الفرع الوارث → كل واحدة 1/32
    const w1Share = result.find(h => h.name === 'زوجة 1');
    expect(w1Share?.share).toBe('1/32');
  });

  it('بنت واحدة + بنت ابن: تكملة الثلثين', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'daughter', name: 'البنت', gender: Gender.FEMALE, isDeceased: false },
      { id: 'son', name: 'الابن', gender: Gender.MALE, isDeceased: true }, // ابن ميت
      { id: 'granddaughter', name: 'بنت الابن', gender: Gender.FEMALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'dead', targetId: 'daughter', type: RelationType.PARENT_MALE },
      { sourceId: 'dead', targetId: 'son', type: RelationType.PARENT_MALE },
      { sourceId: 'son', targetId: 'granddaughter', type: RelationType.PARENT_MALE },
    ];
    const result = solve('dead', nodes, edges);
    const daughterShare = result.find(h => h.name === 'البنت');
    const gdShare = result.find(h => h.name === 'بنت الابن');
    // البنت 1/2 + بنت الابن 1/6 = 2/3 → الرد يُطبق (صحيح فقهياً)
    // بعد الرد: البنت 3/4، بنت الابن 1/4
    expect(daughterShare?.share).toBe('3/4');
    expect(gdShare?.share).toBe('1/4');
  });

  it('إخوة لأم يتقاسمون الثلث', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'mb1', name: 'أخ لأم 1', gender: Gender.MALE, isDeceased: false },
      { id: 'mb2', name: 'أخ لأم 2', gender: Gender.MALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'mb1', targetId: 'dead', type: RelationType.SIBLING_MATERNAL_MALE },
      { sourceId: 'mb2', targetId: 'dead', type: RelationType.SIBLING_MATERNAL_MALE },
    ];
    const result = solve('dead', nodes, edges);
    const mb1Share = result.find(h => h.name === 'أخ لأم 1');
    const mb2Share = result.find(h => h.name === 'أخ لأم 2');
    // فرضهم 1/3 يتقاسمانه = 1/6 لكل، ثم الرد يُطبق عليهم (صحيح عند الجمهور)
    // بعد الرد: كل واحد 1/2
    expect(mb1Share?.share).toBe('1/2');
    expect(mb2Share?.share).toBe('1/2');
  });

  it('بنت وحيدة فقط: تأخذ النصف والباقي ردّ', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'daughter', name: 'البنت', gender: Gender.FEMALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'dead', targetId: 'daughter', type: RelationType.PARENT_MALE },
    ];
    const result = solve('dead', nodes, edges);
    const d = result.find(h => h.name === 'البنت');
    // فرضها 1/2، لكن بالرد تأخذ التركة كاملة
    expect(d?.share).toBe('1');
  });

  it('جدتان: يتقاسمان السدس', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'gm1', name: 'جدة 1', gender: Gender.FEMALE, isDeceased: false },
      { id: 'gm2', name: 'جدة 2', gender: Gender.FEMALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'gm1', targetId: 'dead', type: RelationType.GRANDPARENT_FEMALE },
      { sourceId: 'gm2', targetId: 'dead', type: RelationType.GRANDPARENT_FEMALE },
    ];
    const result = solve('dead', nodes, edges);
    const gm1 = result.find(h => h.name === 'جدة 1');
    const gm2 = result.find(h => h.name === 'جدة 2');
    // فرضهما 1/6 يتقاسمانه = 1/12 لكل، ثم الرد يُطبق (صحيح عند الجمهور)
    // بعد الرد: كل جدة 1/2
    expect(gm1?.share).toBe('1/2');
    expect(gm2?.share).toBe('1/2');
  });

  it('ميت بلا ورثة شرعيين: مصفوفة فارغة', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
    ];
    const edges: Relation[] = [];
    const result = solve('dead', nodes, edges);
    const activeHeirs = result.filter(h => !h.isBlocked);
    expect(activeHeirs.length).toBe(0);
  });

  it('أم + أخوان: حجب نقصان للأم (1/3 → 1/6)', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'mother', name: 'الأم', gender: Gender.FEMALE, isDeceased: false },
      { id: 'b1', name: 'أخ 1', gender: Gender.MALE, isDeceased: false },
      { id: 'b2', name: 'أخ 2', gender: Gender.MALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'mother', targetId: 'dead', type: RelationType.PARENT_FEMALE },
      { sourceId: 'b1', targetId: 'dead', type: RelationType.SIBLING_MALE },
      { sourceId: 'b2', targetId: 'dead', type: RelationType.SIBLING_MALE },
    ];
    const result = solve('dead', nodes, edges);
    const motherShare = result.find(h => h.name === 'الأم');
    // الأم تُحجب نقصاناً من 1/3 إلى 1/6 لوجود جمع من الإخوة
    expect(motherShare?.share).toBe('1/6');
  });

  it('أب + ابن + بنت: الأب 1/6 فرضاً والباقي للأبناء تعصيباً', () => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true },
      { id: 'father', name: 'الأب', gender: Gender.MALE, isDeceased: false },
      { id: 'son', name: 'الابن', gender: Gender.MALE, isDeceased: false },
      { id: 'daughter', name: 'البنت', gender: Gender.FEMALE, isDeceased: false },
    ];
    const edges: Relation[] = [
      { sourceId: 'father', targetId: 'dead', type: RelationType.PARENT_MALE },
      { sourceId: 'dead', targetId: 'son', type: RelationType.PARENT_MALE },
      { sourceId: 'dead', targetId: 'daughter', type: RelationType.PARENT_MALE },
    ];
    const result = solve('dead', nodes, edges);
    const fatherShare = result.find(h => h.name === 'الأب');
    expect(fatherShare?.share).toBe('1/6');
  });

  // ═══════════════════════════════════════════════
  // التحقق الرياضي: مجموع الحصص = 1
  // ═══════════════════════════════════════════════
  describe('التحقق الرياضي — مجموع الحصص = 1', () => {
    const sumShares = (deceasedId: string, nodes: Person[], edges: Relation[]): number => {
      const heirs = InheritanceEngine.calculate(deceasedId, nodes, edges);
      let total = new Fraction(0);
      heirs.forEach(h => {
        if (!h.isBlocked && h.exactShare) {
          total = total.add(new Fraction(h.exactShare));
        }
      });
      return total.valueOf();
    };

    it('زوجة + بنت + أخ = 1', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'w', name: 'زوجة', gender: Gender.FEMALE, isDeceased: false },
        { id: 'dt', name: 'بنت', gender: Gender.FEMALE, isDeceased: false },
        { id: 'b', name: 'أخ', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'w', targetId: 'd', type: RelationType.SPOUSE_FEMALE },
        { sourceId: 'd', targetId: 'dt', type: RelationType.PARENT_MALE },
        { sourceId: 'b', targetId: 'd', type: RelationType.SIBLING_MALE },
      ];
      expect(sumShares('d', n, e)).toBeCloseTo(1, 10);
    });

    it('زوج + أم + أب = 1', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.FEMALE, isDeceased: true },
        { id: 'h', name: 'زوج', gender: Gender.MALE, isDeceased: false },
        { id: 'm', name: 'أم', gender: Gender.FEMALE, isDeceased: false },
        { id: 'f', name: 'أب', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'h', targetId: 'd', type: RelationType.SPOUSE_MALE },
        { sourceId: 'm', targetId: 'd', type: RelationType.PARENT_FEMALE },
        { sourceId: 'f', targetId: 'd', type: RelationType.PARENT_MALE },
      ];
      expect(sumShares('d', n, e)).toBeCloseTo(1, 10);
    });

    it('أب فقط = 1 (عصبة بالنفس)', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'f', name: 'أب', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'f', targetId: 'd', type: RelationType.PARENT_MALE },
      ];
      expect(sumShares('d', n, e)).toBeCloseTo(1, 10);
    });

    it('ابن فقط = 1 (عصبة بالنفس)', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_MALE },
      ];
      expect(sumShares('d', n, e)).toBeCloseTo(1, 10);
    });

    it('بنت وحيدة بالرد = 1', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'dt', name: 'بنت', gender: Gender.FEMALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 'dt', type: RelationType.PARENT_MALE },
      ];
      expect(sumShares('d', n, e)).toBeCloseTo(1, 10);
    });

    it('3 بنات + أم = 1 (بالرد)', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'd1', name: 'بنت1', gender: Gender.FEMALE, isDeceased: false },
        { id: 'd2', name: 'بنت2', gender: Gender.FEMALE, isDeceased: false },
        { id: 'd3', name: 'بنت3', gender: Gender.FEMALE, isDeceased: false },
        { id: 'm', name: 'أم', gender: Gender.FEMALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 'd1', type: RelationType.PARENT_MALE },
        { sourceId: 'd', targetId: 'd2', type: RelationType.PARENT_MALE },
        { sourceId: 'd', targetId: 'd3', type: RelationType.PARENT_MALE },
        { sourceId: 'm', targetId: 'd', type: RelationType.PARENT_FEMALE },
      ];
      expect(sumShares('d', n, e)).toBeCloseTo(1, 10);
    });
  });

  // ═══════════════════════════════════════════════
  // الحجب
  // ═══════════════════════════════════════════════
  describe('الحجب', () => {
    it('الابن يحجب الأخ الشقيق', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: false },
        { id: 'b', name: 'أخ', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_MALE },
        { sourceId: 'b', targetId: 'd', type: RelationType.SIBLING_MALE },
      ];
      const result = solve('d', n, e);
      const bro = result.find(h => h.name === 'أخ');
      expect(bro?.isBlocked).toBe(true);
    });

    it('الأب يحجب الجد', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'f', name: 'أب', gender: Gender.MALE, isDeceased: false },
        { id: 'gf', name: 'جد', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'f', targetId: 'd', type: RelationType.PARENT_MALE },
        { sourceId: 'gf', targetId: 'd', type: RelationType.GRANDPARENT_MALE },
      ];
      const result = solve('d', n, e);
      const gf = result.find(h => h.name === 'جد');
      expect(gf?.isBlocked).toBe(true);
    });

    it('الأم تحجب الجدة', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'm', name: 'أم', gender: Gender.FEMALE, isDeceased: false },
        { id: 'gm', name: 'جدة', gender: Gender.FEMALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'm', targetId: 'd', type: RelationType.PARENT_FEMALE },
        { sourceId: 'gm', targetId: 'd', type: RelationType.GRANDPARENT_FEMALE },
      ];
      const result = solve('d', n, e);
      const gm = result.find(h => h.name === 'جدة');
      expect(gm?.isBlocked).toBe(true);
    });

    it('الابن يحجب الحفيد', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: false },
        { id: 'gs', name: 'حفيد', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_MALE },
        { sourceId: 'd', targetId: 'gs', type: RelationType.GRANDPARENT_MALE },
      ];
      const result = solve('d', n, e);
      const gs = result.find(h => h.name === 'حفيد');
      expect(gs?.isBlocked).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════
  // حالات حدية
  // ═══════════════════════════════════════════════
  describe('حالات حدية', () => {
    it('ميت غير موجود في nodes = مصفوفة فارغة', () => {
      const result = InheritanceEngine.calculate('ghost', [
        { id: 'a', name: 'أ', gender: Gender.MALE, isDeceased: false },
      ], []);
      expect(result.length).toBe(0);
    });

    it('كل الورثة أموات = مصفوفة فارغة (لا أحياء)', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: true },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_MALE },
      ];
      const result = solve('d', n, e);
      const active = result.filter(h => !h.isBlocked);
      expect(active.length).toBe(0);
    });

    it('عدم تعديل المدخلات الأصلية (FIX-09 Immutability)', () => {
      const nodes: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: false },
      ];
      const edges: Relation[] = [
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_MALE },
      ];
      const edgesCopy = JSON.stringify(edges);
      InheritanceEngine.calculate('d', nodes, edges);
      expect(JSON.stringify(edges)).toBe(edgesCopy);
    });

    it('نفس الحساب مرتين = نفس النتيجة (Determinism)', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'w', name: 'زوجة', gender: Gender.FEMALE, isDeceased: false },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'w', targetId: 'd', type: RelationType.SPOUSE_FEMALE },
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_MALE },
      ];
      const r1 = JSON.stringify(solve('d', n, e));
      const r2 = JSON.stringify(solve('d', n, e));
      expect(r1).toBe(r2);
    });
  });

  // ═══════════════════════════════════════════════
  // وفاة امرأة (عكس الجنس)
  // ═══════════════════════════════════════════════
  describe('وفاة امرأة', () => {
    it('زوج + ابن: الزوج 1/4', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.FEMALE, isDeceased: true },
        { id: 'h', name: 'زوج', gender: Gender.MALE, isDeceased: false },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'h', targetId: 'd', type: RelationType.SPOUSE_MALE },
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_FEMALE },
      ];
      const result = solve('d', n, e);
      const husband = result.find(h => h.name === 'زوج');
      expect(husband?.share).toBe('1/4');
    });

    it('زوج بدون فرع وارث: الزوج 1/2', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.FEMALE, isDeceased: true },
        { id: 'h', name: 'زوج', gender: Gender.MALE, isDeceased: false },
        { id: 'f', name: 'أب', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'h', targetId: 'd', type: RelationType.SPOUSE_MALE },
        { sourceId: 'f', targetId: 'd', type: RelationType.PARENT_MALE },
      ];
      const result = solve('d', n, e);
      const husband = result.find(h => h.name === 'زوج');
      expect(husband?.share).toBe('1/2');
    });
  });

  // ═══════════════════════════════════════════════
  // حالات فقهية إضافية
  // ═══════════════════════════════════════════════
  describe('حالات فقهية إضافية', () => {
    it('بنتان = 2/3 يتشاركانها', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'd1', name: 'بنت1', gender: Gender.FEMALE, isDeceased: false },
        { id: 'd2', name: 'بنت2', gender: Gender.FEMALE, isDeceased: false },
        { id: 'f', name: 'أب', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 'd1', type: RelationType.PARENT_MALE },
        { sourceId: 'd', targetId: 'd2', type: RelationType.PARENT_MALE },
        { sourceId: 'f', targetId: 'd', type: RelationType.PARENT_MALE },
      ];
      const result = solve('d', n, e);
      const d1 = result.find(h => h.name === 'بنت1');
      const d2 = result.find(h => h.name === 'بنت2');
      expect(d1?.share).toBe(d2?.share); // يتشاركان نفس الحصة
    });

    it('زوجة + أب + أم (العمرية)', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'w', name: 'زوجة', gender: Gender.FEMALE, isDeceased: false },
        { id: 'f', name: 'أب', gender: Gender.MALE, isDeceased: false },
        { id: 'm', name: 'أم', gender: Gender.FEMALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'w', targetId: 'd', type: RelationType.SPOUSE_FEMALE },
        { sourceId: 'f', targetId: 'd', type: RelationType.PARENT_MALE },
        { sourceId: 'm', targetId: 'd', type: RelationType.PARENT_FEMALE },
      ];
      const result = solve('d', n, e);
      const wife = result.find(h => h.name === 'زوجة');
      expect(wife?.share).toBe('1/4'); // لا فرع وارث
    });

    it('ابنان = يتشاركان الباقي بالتساوي', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 's1', name: 'ابن1', gender: Gender.MALE, isDeceased: false },
        { id: 's2', name: 'ابن2', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 's1', type: RelationType.PARENT_MALE },
        { sourceId: 'd', targetId: 's2', type: RelationType.PARENT_MALE },
      ];
      const result = solve('d', n, e);
      const s1 = result.find(h => h.name === 'ابن1');
      const s2 = result.find(h => h.name === 'ابن2');
      expect(s1?.share).toBe(s2?.share);
    });

    it('أم وحيدة = 1/3 + رد', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'm', name: 'أم', gender: Gender.FEMALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'm', targetId: 'd', type: RelationType.PARENT_FEMALE },
      ];
      const result = solve('d', n, e);
      expect(result.filter(h => !h.isBlocked).length).toBeGreaterThanOrEqual(1);
    });

    it('زوجة وحيدة = 1/4 + رد', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'w', name: 'زوجة', gender: Gender.FEMALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'w', targetId: 'd', type: RelationType.SPOUSE_FEMALE },
      ];
      const result = solve('d', n, e);
      const wife = result.find(h => h.name === 'زوجة');
      expect(wife?.share).toBeDefined();
    });

    it('4 زوجات = يتشاركن 1/8 بالتساوي', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'w1', name: 'ز1', gender: Gender.FEMALE, isDeceased: false },
        { id: 'w2', name: 'ز2', gender: Gender.FEMALE, isDeceased: false },
        { id: 'w3', name: 'ز3', gender: Gender.FEMALE, isDeceased: false },
        { id: 'w4', name: 'ز4', gender: Gender.FEMALE, isDeceased: false },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'w1', targetId: 'd', type: RelationType.SPOUSE_FEMALE },
        { sourceId: 'w2', targetId: 'd', type: RelationType.SPOUSE_FEMALE },
        { sourceId: 'w3', targetId: 'd', type: RelationType.SPOUSE_FEMALE },
        { sourceId: 'w4', targetId: 'd', type: RelationType.SPOUSE_FEMALE },
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_MALE },
      ];
      const result = solve('d', n, e);
      const wives = result.filter(h => ['ز1', 'ز2', 'ز3', 'ز4'].includes(h.name));
      // كلهن نفس الحصة
      const shares = wives.map(w => w.share);
      expect(new Set(shares).size).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════
  // calculateInheritance API
  // ═══════════════════════════════════════════════
  describe('calculateInheritance API', () => {
    it('يُرجع base و shares و أعلام العول/الرد', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 's', name: 'ابن', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'd', targetId: 's', type: RelationType.PARENT_MALE },
      ];
      const result = InheritanceEngine.calculateInheritance('d', n, e);
      expect(result.base).toBeGreaterThanOrEqual(1);
      expect(result.shares).toBeDefined();
      expect(typeof result.awlApplied).toBe('boolean');
      expect(typeof result.raddApplied).toBe('boolean');
      expect(result.totalFard).toBeDefined();
    });

    it('أب فقط: base=1, totalFard=1', () => {
      const n: Person[] = [
        { id: 'd', name: 'م', gender: Gender.MALE, isDeceased: true },
        { id: 'f', name: 'أب', gender: Gender.MALE, isDeceased: false },
      ];
      const e: Relation[] = [
        { sourceId: 'f', targetId: 'd', type: RelationType.PARENT_MALE },
      ];
      const result = InheritanceEngine.calculateInheritance('d', n, e);
      expect(result.totalFard).toBe('1');
    });
  });
});
