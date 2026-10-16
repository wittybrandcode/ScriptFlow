export enum Madhab {
  HANAFI = 'HANAFI',
  MALIKI = 'MALIKI',
  SHAFI = 'SHAFI',
  HANBALI = 'HANBALI',
  JAFAARI = 'JAFAARI',
  ZAHIRI = 'ZAHIRI',
}

export enum RuleCategory {
  AWL = 'AWL',                 // العول
  RADD = 'RADD',               // الرد
  OBLIGATORY_WILL = 'OBLIGATORY_WILL', // الوصية الواجبة (عادة قوانين مدنية حديثة مبنية على اجتهاد)
  GRANDFATHER_SIBLINGS = 'GRANDFATHER_SIBLINGS', // الجد مع الإخوة
  MISSING_PERSON = 'MISSING_PERSON',     // أحكام المفقود
  IDDAH_DURATION = 'IDDAH_DURATION'      // حساب العدة
}

export interface MadhabContext {
  /** المذهب الأساسي الذي تُبنى عليه كافة الأحكام بالخيار الافتراضي */
  primary: Madhab;
  
  /** 
   * التدخلات والاستثناءات 
   * (مثلاً: المحكمة تطبق المذهب المالكي، لكنها تأخذ برأي الحنفية أو القانون المصري في الوصية الواجبة)
   */
  overrides?: Partial<Record<RuleCategory, Madhab | string>>;
  
  /** النطاق القضائي كمعيار إضافي للاختلافات الجغرافية داخل نفس المذهب */
  jurisdiction?: 'DZ' | 'SA' | 'EG' | 'MA' | 'AE' | string;
}
