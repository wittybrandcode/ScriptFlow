import Fraction from '../core/Fraction';
import { Heir } from '../types/Kinship';
import { CalculationResult } from './BaseEngine';
import { SharesEngine } from './SharesEngine';

export interface HeirReport {
  heirId: string;
  nameAr: string;
  share: string;
  reason: string;
  isBlocked: boolean;
}

export interface FinalReport {
  baseOrigin: number;
  awlOrigin?: number;
  tashihOrigin?: number;
  heirs: HeirReport[];
  summary: string;
}

export class ExplanationEngine {
  private static nameMap: Record<string, string> = {
    'SON': 'ابن',
    'DAUGHTER': 'بنت',
    'SON_OF_SON': 'ابن ابن',
    'DAUGHTER_OF_SON': 'بنت ابن',
    'FATHER': 'أب',
    'MOTHER': 'أم',
    'GRANDFATHER': 'جد',
    'GRANDMOTHER_P': 'جدة (لأب)',
    'GRANDMOTHER_M': 'جدة (لأم)',
    'FULL_BROTHER': 'أخ شقيق',
    'FULL_SISTER': 'أخت شقيقة',
    'AGNATIC_BROTHER': 'أخ لأب',
    'AGNATIC_SISTER': 'أخت لأب',
    'UTERINE_BROTHER': 'أخ لأم',
    'UTERINE_SISTER': 'أخت لأم',
    'FULL_UNCLE': 'عم شقيق',
    'AGNATIC_UNCLE': 'عم لأب',
    'FULL_BROTHER_SON': 'ابن أخ شقيق',
    'AGNATIC_BROTHER_SON': 'ابن أخ لأب',
    'SPOUSE_MALE': 'زوج',
    'SPOUSE_FEMALE': 'زوجة',
    // ذوو الأرحام (Distant Kindred)
    'DAUGHTER_SON': 'ابن بنت',
    'DAUGHTER_DAUGHTER': 'بنت بنت',
    'FULL_SISTER_DAUGHTER': 'بنت أخت شقيقة',
    'FULL_BROTHER_DAUGHTER': 'بنت أخ شقيق',
    'FULL_SISTER_SON': 'ابن أخت شقيقة',
    'MATERNAL_UNCLE': 'خال',
    'MATERNAL_AUNT': 'خالة',
    'PATERNAL_AUNT': 'عمة',
    'MATERNAL_GRANDFATHER': 'جد لأم'
  };

  private static distantKindredTypes = new Set([
    'DAUGHTER_SON', 'DAUGHTER_DAUGHTER', 'FULL_SISTER_DAUGHTER', 
    'FULL_BROTHER_DAUGHTER', 'FULL_SISTER_SON', 'MATERNAL_UNCLE', 
    'MATERNAL_AUNT', 'PATERNAL_AUNT', 'MATERNAL_GRANDFATHER'
  ]);

  public static generateReport(heirs: Heir[], result: CalculationResult): FinalReport {
    const report: FinalReport = {
      baseOrigin: result.baseOrigin,
      awlOrigin: result.awlOrigin,
      tashihOrigin: result.tashihOrigin,
      heirs: [],
      summary: ''
    };

    const summaries: string[] = [];
    summaries.push(`أصل المسألة: ${result.baseOrigin}`);
    if (result.awlOrigin) {
      summaries.push(`عالت المسألة إلى: ${result.awlOrigin}`);
    }

    const spouseIds = new Set(heirs.filter(h => h.type === 'SPOUSE_MALE' || h.type === 'SPOUSE_FEMALE').map(h => h.id));
    const hasAsaba = Object.values(result.shares).some(s => s.type === 'ASABA' || s.type === 'FARD_PLUS_ASABA');

    // Calculate base shares to detect if Radd was applied
    const baseShares: Record<string, string> = {};
    try {
      const dummy = { baseOrigin: 1, shares: {}, steps: [] };
      SharesEngine.assignFixedShares(heirs, dummy);
      for (const [id, s] of Object.entries(dummy.shares)) {
        baseShares[id] = (s as any).fraction;
      }
    } catch {}

    for (const heir of heirs) {
      const nameAr = this.nameMap[heir.type] || heir.type;
      
      if (heir.isBlocked) {
        const blockerNames = heir.blockedBy?.map(bId => {
           const blocker = heirs.find(h => h.id === bId);
           return blocker ? (this.nameMap[blocker.type] || blocker.type) : 'وارث آخر';
        }).join(' و ') || 'وارث أقرب';
        
        report.heirs.push({
          heirId: heir.id,
          nameAr,
          share: '0',
          reason: `محجوب لوجود ${blockerNames}`,
          isBlocked: true
        });
        continue;
      }

      const shareInfo = result.shares[heir.id];
      if (!shareInfo) continue;

      let reason = '';
      if (shareInfo.type.startsWith('FARD') && shareInfo.type !== 'FARD_PLUS_ASABA') {
         reason = `فرضاً (${shareInfo.fraction})`;
         if (shareInfo.type === 'FARD_AWL') reason += ' بعد العول';
         if (shareInfo.type === 'FARD_MUSHARRAKA') reason += ' بالمشاركة (المسألة المشركة)';
         
         // Check if Radd was applied to this heir (not a spouse, and final fraction is larger than base fraction)
         if (!hasAsaba && !spouseIds.has(heir.id)) {
           const baseFrac = baseShares[heir.id];
           if (baseFrac && new Fraction(shareInfo.fraction).compare(new Fraction(baseFrac)) > 0) {
             reason = `فرضاً ورداً (${shareInfo.fraction})`;
           }
         }
      } else if (shareInfo.type === 'ASABA') {
         if (this.distantKindredTypes.has(heir.type)) {
           reason = 'من ذوي الأرحام (بالتنزيل)';
         } else {
           const asabaType = (shareInfo as any).asabaType;
           if (asabaType === 'ASABA_BIN_NAFS') reason = 'الباقي تعصيباً (عصبة بالنفس)';
           else if (asabaType === 'ASABA_BIL_GHAYR') reason = 'الباقي تعصيباً (عصبة بالغير للذكر مثل حظ الأنثيين)';
           else if (asabaType === 'ASABA_MAA_AL_GHAYR') reason = 'الباقي تعصيباً (عصبة مع الغير)';
           else reason = 'الباقي تعصيباً';
         }
      } else if (shareInfo.type === 'FARD_PLUS_ASABA') {
         reason = `فرضاً (${shareInfo.fraction}) بالإضافة للباقي تعصيباً`;
      }

      report.heirs.push({
        heirId: heir.id,
        nameAr,
        share: shareInfo.fraction,
        reason,
        isBlocked: false
      });
    }

    report.summary = summaries.join(' | ');
    return report;
  }
}
