import { UUID } from '../entities/person';

export enum RelationCategory {
  BLOOD_LINEAGE = 'BLOOD_LINEAGE', // نسب حقيقي
  AFFINITY_MARRIAGE = 'AFFINITY_MARRIAGE', // مصاهرة
  FOSTER_MILK = 'FOSTER_MILK', // رضاع
  WALAA_EMANCIPATION = 'WALAA_EMANCIPATION', // ولاء العتق
  ADOPTION_LEGAL = 'ADOPTION_LEGAL', // التبني (نحتاجه للاستبعاد الفقهي أو التطبيق في قوانين مدنية معينة)
}

export interface KinshipEdge {
  edgeId: UUID;
  sourceId: UUID; // من
  targetId: UUID; // إلى
  
  relationCategory: RelationCategory;
  biologicalDistance?: number; // 1 للأب، 2 للجد (مفيد في حسابات الحجب والدرجات)
  
  /** الحدث الذي أنشأ هذه العلاقة (مثلا: حدث الرضاع أنشأ علاقة أم رضاعية) */
  createdFromEventId?: UUID; 
  
  /** الحدث الذي قطع هذه العلاقة (مثلا: طلاق بائن قطع علاقة الزوجية) */
  terminatedByEventId?: UUID;
  
  /** حاجز المحرمية - هل هذه الرابطة تمنع الزواج؟ */
  isMahram: boolean;
}
