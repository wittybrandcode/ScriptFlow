import { KinshipDictionary } from "./types";
import { ArabicDictionary } from "./ar";
import { RelationType } from "../core/enums";

export class Translator {
  private dict: KinshipDictionary;

  constructor(dictionary: KinshipDictionary = ArabicDictionary) {
    this.dict = dictionary;
  }

  setDictionary(dictionary: KinshipDictionary) {
    this.dict = dictionary;
  }

  t(
    category: keyof KinshipDictionary["translations"],
    key: string,
    variables?: Record<string, string>,
  ): string {
    const translationGroup = this.dict.translations[category] as Record<
      string,
      string
    >;
    let text = translationGroup?.[key] || key;

    if (variables) {
      for (const [varName, varValue] of Object.entries(variables)) {
        text = text.replace(`{{${varName}}}`, varValue);
      }
    }

    return text;
  }

  getRelationLabel(relType: RelationType | string): string {
    return this.t("relations", relType);
  }
}

// Global default instance for easy use across the app if needed
export const translator = new Translator();
