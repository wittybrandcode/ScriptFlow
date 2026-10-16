import { ParsedRule, RuleGroup } from './types';

export interface RuleContext {
  /** معرف العقدة التي يتم تقييم القواعد عليها حاليا (مثلا: ID لشخص هو "أم" الميت) */
  targetNodeId: string;
  
  /** 
   * التحقق من وجود عقدة أو مجموعة عقد مرتبطة بالميت
   * relations: مصفوفة بأسماء العلاقات مثل ["CHILD", "GRANDCHILD_MALE_LINE"]
   */
  exists(criteria: any): boolean;

  /** حساب عدد العقد المطابقة لشروط معينة */
  count(criteria: any): number;

  /** التحقق من خصائص العقدة الحالية كالجنس وغيره */
  nodeHas(targetNodeId: string, criteria: any): boolean;
}

export class RuleEvaluator {
  /**
   * تقييم مجموعة قواعد لعقدة معينة، وإرجاع الأثر (Effect) لأول قاعدة تنطبق
   */
  public evaluateGroup(group: RuleGroup, context: RuleContext) {
    // ترتيب القواعد حسب الأولوية تنازليا (الأعلى أولا)
    const sortedRules = [...group.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        return {
          ruleId: rule.rule_id,
          nameAr: rule.name_ar,
          description: rule.description,
          effect: rule.effect,
          evidence: rule.evidence,
        };
      }
    }

    return null; // لا توجد قاعدة تنطبق
  }

  private evaluateConditions(conditions: any[], context: RuleContext): boolean {
    if (!conditions || conditions.length === 0) return true; // لا شروط = تنطبق دائما

    // كل بلوك في conditions (عطف أو تخيير) يمثل Root Node
    // عادة تحتوي القوائم في NDSL على operator وقائمة criteria
    for (const block of conditions) {
      const isMatch = this.evaluateConditionBlock(block, context);
      if (!isMatch) return false; // جميع البلوكات الكبيرة تعتبر AND ضمناً لو تعددت
    }

    return true;
  }

  private evaluateConditionBlock(block: any, context: RuleContext): boolean {
    const operator = block.operator?.toUpperCase() || 'AND';
    const criteriaList = block.criteria || [];

    if (operator === 'AND') {
      for (const criterion of criteriaList) {
        if (!this.evaluateCriterion(criterion, context)) return false;
      }
      return true;
    } else if (operator === 'OR') {
      for (const criterion of criteriaList) {
        if (this.evaluateCriterion(criterion, context)) return true;
      }
      return false;
    }

    return false;
  }

  private evaluateCriterion(criterion: any, context: RuleContext): boolean {
    const key = Object.keys(criterion)[0];
    const params = criterion[key];

    switch (key) {
      case 'exists':
        return context.exists(params);
      case 'not_exists':
        return !context.exists(params);
      case 'count_greater_or_equal':
        return context.count(params) >= (params.count || 1);
      case 'count_strictly_less':
        return context.count(params) < (params.count || 1);
      case 'count_equals':
        return context.count(params) === (params.count || 1);
      case 'node_has':
        return context.nodeHas(context.targetNodeId, params);
      default:
        throw new Error(`Unknown criterion: ${key}`);
    }
  }
}
