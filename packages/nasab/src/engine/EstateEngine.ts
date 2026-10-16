import Fraction from '../core/Fraction';
import { Heir } from '../types/Kinship';
import { BaseEngine, CalculationResult } from './BaseEngine';
import { WasiyyaEngine, WasiyyaResult } from './WasiyyaEngine';

export interface EstateInput {
  totalEstate: number;           // إجمالي التركة
  funeralCosts?: number;         // مؤن التجهيز
  securedDebts?: number;         // ديون عينية (e.g. رهن)
  allahDebts?: number;           // حقوق الله (زكاة، كفارات)
  unsecuredDebts?: number;       // ديون مرسلة (e.g. قرض)
  voluntaryBequest?: number;     // وصية اختيارية
  enableWasiyyaWajiba?: boolean; // تفعيل الوصية الواجبة (الافتراضي نعم)
}

export interface DeductionStep {
  name: string;
  amount: number;
}

export interface EstateResult {
  initialEstate: number;
  netEstate: number;             // صافي التركة بعد جميع الخصومات والوصايا
  deductions: DeductionStep[];   // تفصيل الخصومات
  wasiyyaWajibaResult?: WasiyyaResult; // تفاصيل الوصية الواجبة إن وجدت
  inheritanceResult: CalculationResult; // نتيجة التوزيع الفقهي للورثة
  monetaryShares: Record<string, number>; // الأنصبة النهائية بالقيمة المالية للجميع
}

export class EstateEngine {
  /**
   * Evaluates the entire estate pipeline including costs, debts, voluntary bequests,
   * obligatory bequests (الوصية الواجبة), and then standard inheritance.
   */
  public static distribute(estateInput: EstateInput, heirs: Heir[]): EstateResult {
    const deductions: DeductionStep[] = [];
    let currentAmount = estateInput.totalEstate;

    // 1. الديون العينية (Secured Debts) - مقدمة في المذهب الحنبلي وبعض المذاهب
    if (estateInput.securedDebts && estateInput.securedDebts > 0 && currentAmount > 0) {
      const deduction = Math.min(currentAmount, estateInput.securedDebts);
      deductions.push({ name: 'ديون عينية', amount: deduction });
      currentAmount -= deduction;
    }

    // 2. مؤن التجهيز (Funeral costs)
    if (estateInput.funeralCosts && estateInput.funeralCosts > 0 && currentAmount > 0) {
      const deduction = Math.min(currentAmount, estateInput.funeralCosts);
      deductions.push({ name: 'مؤن التجهيز', amount: deduction });
      currentAmount -= deduction;
    }

    // 3. الديون المرسلة (Unsecured Debts)
    if (estateInput.unsecuredDebts && estateInput.unsecuredDebts > 0 && currentAmount > 0) {
      const deduction = Math.min(currentAmount, estateInput.unsecuredDebts);
      deductions.push({ name: 'ديون مرسلة (للعباد)', amount: deduction });
      currentAmount -= deduction;
    }

    // 4. حقوق الله (Allah's debts)
    if (estateInput.allahDebts && estateInput.allahDebts > 0 && currentAmount > 0) {
      const deduction = Math.min(currentAmount, estateInput.allahDebts);
      deductions.push({ name: 'حقوق الله (زكاة/كفارة)', amount: deduction });
      currentAmount -= deduction;
    }

    let finalEstateForInheritance = currentAmount;
    const amountForBequests = currentAmount;
    const maxTotalBequests = amountForBequests / 3;
    let bequestsTaken = 0;

    const monetaryShares: Record<string, number> = {};
    let wasiyyaWajibaResult: WasiyyaResult | undefined = undefined;

    // 5. الوصية الواجبة (Obligatory Bequest - usually takes precedence over voluntary in modern laws)
    if (estateInput.enableWasiyyaWajiba !== false && amountForBequests > 0) {
       wasiyyaWajibaResult = WasiyyaEngine.calculateWasiyya(heirs);
       if (wasiyyaWajibaResult.hasWasiyya) {
          const wFrac = new Fraction(wasiyyaWajibaResult.wasiyyaFraction);
          let wasiyyaAmount = wFrac.valueOf() * amountForBequests;
          
          // Cap at 1/3 of the estate
          if (wasiyyaAmount > maxTotalBequests) {
             wasiyyaAmount = maxTotalBequests;
          }

          deductions.push({ name: 'وصية واجبة (للأحفاد المحجوبين)', amount: wasiyyaAmount });
          bequestsTaken += wasiyyaAmount;
          finalEstateForInheritance -= wasiyyaAmount;

          // Add Wasiyya amounts to monetary shares
          for (const [heirId, fracString] of Object.entries(wasiyyaWajibaResult.beneficiaries)) {
             const hFrac = new Fraction(fracString);
             // The fraction represents their share of the *total wasiyya* amount
             const relativeFrac = hFrac.div(wFrac);
             monetaryShares[heirId] = relativeFrac.valueOf() * wasiyyaAmount;
          }
       }
    }

    // 6. الوصية الاختيارية (Voluntary Bequest)
    // لا تنفذ إلا في حدود الثلث من الباقي مجتمعاً مع الوصية الواجبة
    if (estateInput.voluntaryBequest && estateInput.voluntaryBequest > 0 && finalEstateForInheritance > 0) {
      const remainingBequestAllowed = maxTotalBequests - bequestsTaken;
      if (remainingBequestAllowed > 0) {
        const deduction = Math.min(estateInput.voluntaryBequest, remainingBequestAllowed);
        deductions.push({ name: 'وصية اختيارية', amount: deduction });
        finalEstateForInheritance -= deduction;
      }
    }

    // 7. توزيع المواريث (Standard Inheritance)
    const baseEngine = new BaseEngine('COMMON');
    const inheritanceResult = baseEngine.solve(heirs);

    // Calculate monetary shares for regular heirs
    for (const [heirId, share] of Object.entries(inheritanceResult.shares)) {
       const frac = new Fraction(share.fraction);
       monetaryShares[heirId] = (monetaryShares[heirId] || 0) + (frac.valueOf() * finalEstateForInheritance);
    }

    // Fix precision issues
    for (const key in monetaryShares) {
       monetaryShares[key] = parseFloat(monetaryShares[key].toFixed(4));
    }

    return {
       initialEstate: estateInput.totalEstate,
       netEstate: finalEstateForInheritance,
       deductions,
       wasiyyaWajibaResult,
       inheritanceResult,
       monetaryShares
    };
  }
}
