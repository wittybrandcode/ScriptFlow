export type UUID = string;

export enum CertaintyLevel {
  ABSOLUTE = 'ABSOLUTE', // موجود يقيناً
  MISSING_PRESUMED_ALIVE = 'MISSING_PRESUMED_ALIVE', // مفقود يُرجح حياته
  MISSING_PRESUMED_DEAD = 'MISSING_PRESUMED_DEAD', // مفقود يُرجح وفاته
  UNBORN_FETUS = 'UNBORN_FETUS', // حمل (جنين في البطن)
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  HERMAPHRODITE_AMBIGUOUS = 'HERMAPHRODITE_AMBIGUOUS', // الخنثى المشكل (من له آلتان ولا يدرى أيهما أسبق)
}

export enum LegalStatus {
  FREE = 'FREE', // حر
  SLAVE = 'SLAVE', // قن / رقيق
  MUKATAB = 'MUKATAB', // مكاتب
}

export interface Person {
  id: UUID;

  /** البيانات الحيوية الثابتة */
  biometrics: {
    gender: Gender;
    bloodType?: string;
    geneticMarker?: string; // لدعم الإثبات الجيني الحديث وتصحيح النسب
  };

  /** البيانات الإضافية المؤرشفة */
  metadata: {
    legalName: string;
    kunya?: string[];
    nationality?: string;
    legalStatus: LegalStatus;
  };

  /** مستوى اليقين بوجود الشخص (لدعم أحكام المفقود والحمل) */
  certainty: CertaintyLevel;
}
