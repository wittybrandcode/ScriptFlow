import { RelationType } from "../core/enums";

export interface KinshipDictionary {
  locale: string;
  direction: "rtl" | "ltr";
  translations: {
    relations: Record<RelationType | string, string>;
    categories: Record<string, string>;
    engine_messages: Record<string, string>;
    inheritance_reasons: Record<string, string>;
    ui: Record<string, string>;
  };
}
