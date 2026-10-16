import { UUID } from './person';

export interface Asset {
  id: UUID;
  type: 'REAL_ESTATE' | 'CASH' | 'JEWELRY' | 'BUSINESS' | 'OTHER';
  estimatedValue: number;
  currency: string;
}

export enum LiabilityType {
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES', // مؤن التجهيز (لها الأولوية المطلقة)
  SECURED_DEBT = 'SECURED_DEBT', // الديون الموثقة برهن (الديون العينية)
  UNSECURED_DEBT = 'UNSECURED_DEBT', // الديون المرسلة (ديون الله كزكاة وحج، وديون العباد)
  OBLIGATORY_WILL = 'OBLIGATORY_WILL', // الوصية الواجبة أو الاختيارية (لا تتجاوز الثلث)
}

export interface Liability {
  id: UUID;
  type: LiabilityType;
  amount: number;
  creditor?: string;
}

export interface Estate {
  id: UUID;
  deceasedId: UUID; // الشخص الذي تُوفي
  assets: Asset[]; // الأموال والعقارات
  liabilities: Liability[]; // الديون والحقوق، ترتب فقهياً وتسدد قبل الميراث
  netInheritableAmount?: number; // الصافي للورثة (يحسب لاحقًا)
}
