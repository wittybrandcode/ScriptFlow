import { KinshipGraph } from '@nasab/graph';
import { MadhabContext, ValidationReport, ValidationError, ValidationWarning } from '@nasab/model';
import { checkBiologicalConsistency } from './checks/biological';
import { checkTemporalConsistency } from './checks/temporal';

/**
 * المحرك الرئيسي للتدقيق
 * يقوم بتشغيل سلسلة من الفحوصات لضمان سلامة الحالة قبل إدخالها لمحرك المواريث
 */
export function validateGraph(
  graph: KinshipGraph,
  context: MadhabContext
): ValidationReport {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // تشغيل الفحوصات البيولوجية
  const biologicalResult = checkBiologicalConsistency(graph);
  errors.push(...biologicalResult.errors);
  warnings.push(...biologicalResult.warnings);

  // تشغيل الفحوصات الزمنية (تعتمد على سياق المذهب في بعض حساباتها كالعدة)
  const temporalResult = checkTemporalConsistency(graph, context);
  errors.push(...temporalResult.errors);
  warnings.push(...temporalResult.warnings);

  // الفحوصات الطوبولوجية للفقه يمكن إضافتها هنا
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    timestamp: new Date()
  };
}
