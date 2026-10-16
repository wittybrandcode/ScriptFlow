import Ajv from 'ajv';
import YAML from 'yaml';
import { RuleGroup } from './types';
import { RuleSchema } from './schema';

export class RuleParser {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
  }

  /**
   * يقرأ نص YAML ويتحقق من صحته، ويرجع الكاىن إن كان مطابقاً للمخطط.
   * وإذا حدث خطأ إملائي أو في الهيكلة يرمي خطأً فورياً Boot-Time Safety
   */
  public parseAndValidate(yamlContent: string): RuleGroup {
    const rawData = YAML.parse(yamlContent);
    const validate = this.ajv.compile(RuleSchema);
    const isValid = validate(rawData);

    if (!isValid) {
      throw new Error(
        `Invalid Rule Definition: ` + this.ajv.errorsText(validate.errors)
      );
    }

    return rawData as unknown as RuleGroup;
  }
}
