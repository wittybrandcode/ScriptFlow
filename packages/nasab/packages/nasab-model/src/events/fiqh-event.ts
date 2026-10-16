import { UUID } from '../entities/person';

export enum EventType {
  BIRTH = 'BIRTH',
  DEATH = 'DEATH',
  MARRIAGE_CONTRACT = 'MARRIAGE_CONTRACT', // عقد النكاح (يرتب التوارث والمحرمية)
  MARRIAGE_CONSUMMATION = 'MARRIAGE_CONSUMMATION', // الدخول (يؤثر في المهر وتأكيد بعض أحكام المصاهرة)
  DIVORCE_REVOCABLE = 'DIVORCE_REVOCABLE', // طلاق رجعي (يتوارثان ما دامت في العدة)
  DIVORCE_IRREVOCABLE_MINOR = 'DIVORCE_IRREVOCABLE_MINOR', // بائن بينونة صغرى
  DIVORCE_IRREVOCABLE_MAJOR = 'DIVORCE_IRREVOCABLE_MAJOR', // بائن بينونة كبرى (المطلقة ثلاثاً)
  BREASTFEEDING_SESSION = 'BREASTFEEDING_SESSION', // رضعة (تُجمع لإثبات التحريم - 5 رضعات عند الشافعية)
  EMANCIPATION = 'EMANCIPATION', // العتق (يولد حق الولاء)
}

export type TemporalPrecision = 'EXACT' | 'APPROXIMATE' | 'UNKNOWN_ORDER';

/**
 * يمثل نقطة زمنية، مصمم ليتعامل مع غموض وتداخل التواريخ الفقهية
 */
export interface TemporalPoint {
  absoluteDate?: Date; // إذا كان التاريخ معلوماً بالدقة
  relativeSequenceId?: number; // رقم تسلسلي إذا جُهل التاريخ ولكن عُلم الترتيب
  precision: TemporalPrecision; // دقة الحدث (مفيدة جداً للغرقى والهدمى - Unknown Order)
}

export interface FiqhEvent {
  eventId: UUID;
  eventType: EventType;
  timestamp: TemporalPoint;
  
  /** 
   * الأطراف المشاركة في الحدث
   * Record<Role, PersonID>
   * مثال: { HUSBAND: 'uuid-1', WIFE: 'uuid-2' }
   */
  actors: Record<string, UUID>; 
  
  /** أي بيانات إضافية (مثل: هل كان الطلاق في مرض الموت؟) */
  metadata?: Record<string, any>;
}
