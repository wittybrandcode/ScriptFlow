export interface EvidenceCitation {
  id?: string;
  type?: "QURAN" | "HADITH" | "IJMAA" | "QAWL" | "QAEDA";
  source: string;
  textAr?: string; 
  textEn?: string;
  text?: string; // backwards compatible
  context?: string;
  authenticity?: string;
  suraName?: string;
  ayahNumber?: number | string;
  hadithBook?: string;
  hadithNumber?: number | string;
  pageNumber?: number | string;
}

export interface ParsedRule {
  rule_id: string;
  name_ar?: string;
  description?: string;
  priority: number;
  conditions: any[]; // سيتم استبدالها بشيما دقيقة لاحقاً
  effect: {
    type: string;
    value?: string;
    fraction_of_remainder?: string;
    label?: string;
    blocked_by?: string[];
  };
  evidence?: EvidenceCitation[];
  domain: string;
}

export interface RuleGroup {
  rule_group: string;
  target_node: string;
  domain: string;
  rules: ParsedRule[];
}
