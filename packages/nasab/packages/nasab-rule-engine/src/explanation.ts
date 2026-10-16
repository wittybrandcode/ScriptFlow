import { ParsedRule, EvidenceCitation } from './types';

export interface ExplanationStep {
  ruleId: string;
  nameAr?: string;
  description?: string;
  targetNodeId: string;
  effectApplied: any;
  evidence?: EvidenceCitation[];
}

export class ExplanationEngine {
  private steps: ExplanationStep[] = [];

  public logStep(step: ExplanationStep) {
    this.steps.push(step);
  }

  public getTraceabilityMatrix(): ExplanationStep[] {
    return this.steps;
  }

  public generateExplanationMarkdown(): string {
    let md = '# مستند التفسير والاستدلال الفقهي\\n\\n';
    
    this.steps.forEach((step, index) => {
      md += `## خطوة ${index + 1}: ${step.nameAr || step.ruleId}\\n`;
      if (step.description) {
        md += `**البيان:** ${step.description}\\n`;
      }
      
      md += `**الأثر:** ${step.effectApplied?.label || JSON.stringify(step.effectApplied)}\\n`;
      md += `**الوارث / العقدة:** ${step.targetNodeId}\\n`;
      
      if (step.evidence && step.evidence.length > 0) {
        md += `**الدليل الشرعي:**\\n`;
        step.evidence.forEach(ev => {
          md += `- *${ev.source}*: "${ev.text}"\\n`;
        });
      }
      md += '\\n---\\n\\n';
    });

    return md;
  }
}
