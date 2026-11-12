import { KinshipGraph } from '../../nasab-graph/src/KinshipGraph';
import { RuleEvaluator, RuleContext } from '../../nasab-rule-engine/src/evaluator';
import { RuleGroup, EvidenceCitation } from '../../nasab-rule-engine/src/types';
import { ExplanationEngine } from '../../nasab-rule-engine/src/explanation';
import { Person, Gender } from '../../nasab-model/src/entities/person';

// Represents the resolved result of inference for a person
export interface InheritanceResult {
  nodeId: string;
  isBlocked: boolean;
  blockedBy?: string[];
  shareType?: string; // e.g. ASSIGN_FRACTIONAL_SHARE
  shareValue?: string; // e.g. "1/6"
  notes?: string;
  evidence?: EvidenceCitation[];
  ruleId?: string;
  nameAr?: string;
}

export class InferenceEngine {
  private evaluator = new RuleEvaluator();
  public explanationEngine = new ExplanationEngine();
  
  constructor(
    private graph: any, // or your specific graph structure wrapper
    private inheritanceRules: RuleGroup[],
    private blockingRules: RuleGroup[]
  ) {}

  public execute(deceasedId: string, allNodes: any[]): InheritanceResult[] {
    const results: InheritanceResult[] = [];
    
    // Create a context wrapper to pass down to Evaluator
    // It proxies questions back to the graph
    const buildContext = (targetNodeId: string): RuleContext => {
      return {
        targetNodeId,
        exists: (criteria: any) => {
          return this.countNodes(targetNodeId, deceasedId, criteria, allNodes) > 0;
        },
        count: (criteria: any) => {
          return this.countNodes(targetNodeId, deceasedId, criteria, allNodes);
        },
        nodeHas: (nodeId: string, criteria: any) => {
          const node = allNodes.find(n => n.id === nodeId);
          if (!node) return false;
          if (criteria.gender && node.gender !== criteria.gender) return false;
           // more criteria could be checked
          return true;
        }
      };
    };

    // Evaluate each alive person in the tree
    const heirs = allNodes.filter(n => !n.isDeceased && n.id !== deceasedId);
    
    for (const heir of heirs) {
      const context = buildContext(heir.id);
      
      // 1. Evaluate Blocking
      let blocked = false;
      const heirEdges = this.graph.filter((e: any) => e.sourceId === heir.id && e.targetId === deceasedId);
      
      // We map the edge types to rule domains (e.g. MOTHER for PARENT_FEMALE)
      let relationGroupNames: string[] = [];
      for (const edge of heirEdges) {
         if (edge.type === 'PARENT_FEMALE') relationGroupNames.push('MOTHER_BLOCKING', 'MOTHER_INHERITANCE');
         if (edge.type === 'PARENT_MALE') relationGroupNames.push('FATHER_BLOCKING', 'FATHER_INHERITANCE');
         if (edge.type === 'CHILD_MALE') relationGroupNames.push('SON_BLOCKING', 'SON_INHERITANCE');
         if (edge.type === 'CHILD_FEMALE') relationGroupNames.push('DAUGHTER_BLOCKING', 'DAUGHTER_INHERITANCE');
         // Map others ... we will iterate through matching rules based on target_node
         // A simple heuristic for now: filter rules where target_node matches edge.type mapped to NDSL relations
      }
      
      // Map edge type to NDSL target_node:
      let targetNodeStr = '';
      const edgeType = heirEdges[0]?.type;
      if (edgeType === 'PARENT_FEMALE' || edgeType === 'MOTHER') targetNodeStr = 'MOTHER';
      else if (edgeType === 'PARENT_MALE' || edgeType === 'FATHER') targetNodeStr = 'FATHER';
      else if (edgeType === 'CHILD_MALE' || edgeType === 'CHILD_FEMALE' || edgeType === 'CHILD' || edgeType === 'SON' || edgeType === 'DAUGHTER') targetNodeStr = 'CHILD';
      else if (edgeType === 'SIBLING_FULL' || edgeType === 'FULL_BROTHER' || edgeType === 'FULL_SISTER') targetNodeStr = 'SIBLING_FULL';
      else if (edgeType === 'SIBLING_PATERNAL' || edgeType === 'PATERNAL_BROTHER' || edgeType === 'PATERNAL_SISTER') targetNodeStr = 'SIBLING_PATERNAL';
      else if (edgeType === 'SIBLING_MATERNAL' || edgeType === 'MATERNAL_BROTHER' || edgeType === 'MATERNAL_SISTER') targetNodeStr = 'SIBLING_MATERNAL';
      else if (edgeType === 'SPOUSE_MALE' || edgeType === 'HUSBAND') targetNodeStr = 'SPOUSE_MALE';
      else if (edgeType === 'SPOUSE_FEMALE' || edgeType === 'WIFE') targetNodeStr = 'SPOUSE_FEMALE';
      else if (edgeType === 'GRANDFATHER' || edgeType === 'GRANDFATHER_PATERNAL') targetNodeStr = 'GRANDFATHER_PATERNAL';
      else if (edgeType === 'GRANDMOTHER_MATERNAL') targetNodeStr = 'GRANDMOTHER_MATERNAL';
      else if (edgeType === 'GRANDMOTHER_PATERNAL' || edgeType === 'GRANDMOTHER') targetNodeStr = 'GRANDMOTHER_PATERNAL';
      else if (edgeType === 'GRANDSON' || edgeType === 'GRANDDAUGHTER' || edgeType === 'GRANDCHILD_MALE_LINE') targetNodeStr = 'GRANDCHILD_MALE_LINE';

      // Find blocking rule group
      const blockingGroup = this.blockingRules.find(g => g.target_node === targetNodeStr);
      let blockResult = null;
      if (blockingGroup) {
        blockResult = this.evaluator.evaluateGroup(blockingGroup, context);
        if (blockResult && blockResult.effect.type === 'TOTAL_BLOCK') {
          blocked = true;
          this.explanationEngine.logStep({
            ruleId: blockResult.ruleId,
            nameAr: blockResult.nameAr,
            description: blockResult.description,
            targetNodeId: heir.id,
            effectApplied: blockResult.effect,
            evidence: blockResult.evidence
          });
          results.push({
            nodeId: heir.id,
            isBlocked: true,
            blockedBy: blockResult.effect.blocked_by,
            notes: blockResult.effect.label
          });
          continue;
        }
      }

      // 2. Evaluate Inheritance Shares
      const inheritanceGroups = this.inheritanceRules.filter(g => g.target_node === targetNodeStr);
      let foundShare = false;
      for (const inheritanceGroup of inheritanceGroups) {
        const shareResult = this.evaluator.evaluateGroup(inheritanceGroup, context);
        if (shareResult) {
           this.explanationEngine.logStep({
             ruleId: shareResult.ruleId,
             nameAr: shareResult.nameAr,
             description: shareResult.description,
             targetNodeId: heir.id,
             effectApplied: shareResult.effect,
             evidence: shareResult.evidence
           });
           results.push({
             nodeId: heir.id,
             isBlocked: false,
             shareType: shareResult.effect.type,
             shareValue: shareResult.effect.value,
             notes: shareResult.effect.label
           });
           foundShare = true;
           break;
        }
      }
      
      if (!blocked && !foundShare) {
         // Fallback if no rule matches
         results.push({
             nodeId: heir.id,
             isBlocked: false,
             shareType: 'UNKNOWN',
             shareValue: '0',
             notes: 'لم تنطبق أي قاعدة إرث'
         });
      }
    }

    return results;
  }

  private countNodes(targetNodeId: string, deceasedId: string, criteria: any, allNodes: any[]): number {
    // Basic implementation: count how many nodes connected to deceased matching the criteria
    let count = 0;
    const relationsToCheck = criteria.relation || [];
    
    // e.g. relation: ["CHILD"] means we look for edges from node to deceased with type CHILD_MALE or CHILD_FEMALE
    for (const node of allNodes) {
      if (node.isDeceased) continue;
      if (criteria.state === 'ALIVE' && node.isDeceased) continue;
      if (criteria.gender && node.gender !== criteria.gender) continue;
      
      const nodeEdges = this.graph.filter((e: any) => e.sourceId === node.id && e.targetId === deceasedId);
      for (const edge of nodeEdges) {
        let matchesRelation = false;
        const eType = edge.type;
        if (relationsToCheck.includes('CHILD') && (eType === 'CHILD_MALE' || eType === 'CHILD_FEMALE' || eType === 'CHILD' || eType === 'SON' || eType === 'DAUGHTER')) matchesRelation = true;
        if (relationsToCheck.includes('FATHER') && (eType === 'PARENT_MALE' || eType === 'FATHER')) matchesRelation = true;
        if (relationsToCheck.includes('MOTHER') && (eType === 'PARENT_FEMALE' || eType === 'MOTHER')) matchesRelation = true;
        if (relationsToCheck.includes('SIBLING_FULL') && (eType === 'SIBLING_FULL' || eType === 'FULL_BROTHER' || eType === 'FULL_SISTER')) matchesRelation = true;
        if (relationsToCheck.includes('SIBLING_PATERNAL') && (eType === 'SIBLING_PATERNAL' || eType === 'PATERNAL_BROTHER' || eType === 'PATERNAL_SISTER')) matchesRelation = true;
        if (relationsToCheck.includes('SIBLING_MATERNAL') && (eType === 'SIBLING_MATERNAL' || eType === 'MATERNAL_BROTHER' || eType === 'MATERNAL_SISTER')) matchesRelation = true;
        if (relationsToCheck.includes('GRANDCHILD_MALE_LINE') && (eType === 'GRANDCHILD_MALE_LINE' || eType === 'GRANDSON' || eType === 'GRANDDAUGHTER')) matchesRelation = true;
        if (relationsToCheck.includes('SPOUSE_MALE') && (eType === 'SPOUSE_MALE' || eType === 'HUSBAND')) matchesRelation = true;
        if (relationsToCheck.includes('SPOUSE_FEMALE') && (eType === 'SPOUSE_FEMALE' || eType === 'WIFE')) matchesRelation = true;
        if (relationsToCheck.includes('SPOUSE') && (eType === 'SPOUSE' || eType === 'SPOUSE_MALE' || eType === 'SPOUSE_FEMALE' || eType === 'HUSBAND' || eType === 'WIFE')) matchesRelation = true;
        if (relationsToCheck.includes('GRANDFATHER_PATERNAL') && (eType === 'GRANDFATHER_PATERNAL' || eType === 'GRANDFATHER')) matchesRelation = true;
        if (relationsToCheck.includes('GRANDMOTHER_PATERNAL') && (eType === 'GRANDMOTHER_PATERNAL' || eType === 'GRANDMOTHER')) matchesRelation = true;
        if (relationsToCheck.includes('GRANDMOTHER_MATERNAL') && (eType === 'GRANDMOTHER_MATERNAL')) matchesRelation = true;
        if (relationsToCheck.includes('GRANDMOTHER') && (eType === 'GRANDMOTHER' || eType === 'GRANDMOTHER_PATERNAL' || eType === 'GRANDMOTHER_MATERNAL')) matchesRelation = true;
        
        if (matchesRelation) {
          count++;
          break;
        }
      } // for edges
    }
    return count;
  }

  public executeWithContext(ctx: any): InheritanceResult[] {
    const results: InheritanceResult[] = [];
    
    const buildContextOfHeir = (targetNodeId: string): RuleContext => {
      return {
        targetNodeId,
        exists: (criteria: any) => {
          return this.countNodesFromContext(criteria, ctx) > 0;
        },
        count: (criteria: any) => {
          return this.countNodesFromContext(criteria, ctx);
        },
        nodeHas: (nodeId: string, criteria: any) => {
          let foundNode = null;
          if (ctx.deceased && ctx.deceased.id === nodeId) {
            foundNode = ctx.deceased;
          } else {
            // search in relatives
            for (const key of Object.keys(ctx.relatives)) {
              const matched = ctx.relatives[key].find((p: any) => p.id === nodeId);
              if (matched) {
                foundNode = matched;
                break;
              }
            }
          }
          if (!foundNode) return false;
          if (criteria.gender && foundNode.gender !== criteria.gender) return false;
          return true;
        }
      };
    };

    // Collect all unique alive relatives/heirs
    const heirsList: any[] = [];
    for (const key of Object.keys(ctx.relatives)) {
      for (const relative of ctx.relatives[key]) {
        if (!relative.isDeceased && relative.id !== ctx.deceased.id) {
          if (!heirsList.some(h => h.id === relative.id)) {
            heirsList.push(relative);
          }
        }
      }
    }

    for (const heir of heirsList) {
      let heirIdentity = '';
      if (ctx.relatives.mothers.some((p: any) => p.id === heir.id)) heirIdentity = 'MOTHER';
      else if (ctx.relatives.fathers.some((p: any) => p.id === heir.id)) heirIdentity = 'FATHER';
      else if (ctx.relatives.sons.some((p: any) => p.id === heir.id) || ctx.relatives.daughters.some((p: any) => p.id === heir.id)) heirIdentity = 'CHILD';
      else if (ctx.relatives.spouses.some((p: any) => p.id === heir.id)) heirIdentity = 'SPOUSE';
      else if (ctx.relatives.fullBrothers.some((p: any) => p.id === heir.id) || ctx.relatives.fullSisters.some((p: any) => p.id === heir.id)) heirIdentity = 'SIBLING_FULL';
      else if (ctx.relatives.paternalBrothers.some((p: any) => p.id === heir.id) || ctx.relatives.paternalSisters.some((p: any) => p.id === heir.id)) heirIdentity = 'SIBLING_PATERNAL';
      else if (ctx.relatives.maternalBrothers.some((p: any) => p.id === heir.id) || ctx.relatives.maternalSisters.some((p: any) => p.id === heir.id)) heirIdentity = 'SIBLING_MATERNAL';
      else if (ctx.relatives.grandfathers.some((p: any) => p.id === heir.id)) heirIdentity = 'GRANDFATHER_PATERNAL';
      else if (ctx.relatives.grandmothers.some((p: any) => p.id === heir.id)) heirIdentity = 'GRANDMOTHER';
      else if (ctx.relatives.grandsons.some((p: any) => p.id === heir.id) || ctx.relatives.granddaughters.some((p: any) => p.id === heir.id)) heirIdentity = 'GRANDCHILD_MALE_LINE';

      if (!heirIdentity) continue;

      const ruleContext = buildContextOfHeir(heir.id);
      
      // 1. Evaluate Blocking
      let blocked = false;
      const blockingGroup = this.blockingRules.find(g => g.target_node === heirIdentity);
      if (blockingGroup) {
        const blockResult = this.evaluator.evaluateGroup(blockingGroup, ruleContext);
        if (blockResult && blockResult.effect.type === 'TOTAL_BLOCK') {
          blocked = true;
          this.explanationEngine.logStep({
            ruleId: blockResult.ruleId,
            nameAr: blockResult.nameAr,
            description: blockResult.description,
            targetNodeId: heir.id,
            effectApplied: blockResult.effect,
            evidence: blockResult.evidence
          });
          results.push({
            nodeId: heir.id,
            isBlocked: true,
            blockedBy: blockResult.effect.blocked_by,
            notes: blockResult.effect.label,
            evidence: blockResult.evidence,
            ruleId: blockResult.ruleId,
            nameAr: blockResult.nameAr
          } as any);
          continue;
        }
      }

      // 2. Evaluate Inheritance
      const inheritanceGroups = this.inheritanceRules.filter(g => g.target_node === heirIdentity);
      let foundShare = false;
      for (const group of inheritanceGroups) {
        const shareResult = this.evaluator.evaluateGroup(group, ruleContext);
        if (shareResult) {
          this.explanationEngine.logStep({
            ruleId: shareResult.ruleId,
            nameAr: shareResult.nameAr,
            description: shareResult.description,
            targetNodeId: heir.id,
            effectApplied: shareResult.effect,
            evidence: shareResult.evidence
          });
          results.push({
            nodeId: heir.id,
            isBlocked: false,
            shareType: shareResult.effect.type,
            shareValue: shareResult.effect.value,
            notes: shareResult.effect.label,
            evidence: shareResult.evidence,
            ruleId: shareResult.ruleId,
            nameAr: shareResult.nameAr
          } as any);
          foundShare = true;
          break;
        }
      }

      if (!blocked && !foundShare) {
        results.push({
          nodeId: heir.id,
          isBlocked: false,
          shareType: 'UNKNOWN',
          shareValue: '0',
          notes: 'لم تنطبق أي قاعدة إرث'
        });
      }
    }

    return results;
  }

  private countNodesFromContext(criteria: any, ctx: any): number {
    let count = 0;
    const relationsToCheck = criteria.relation || [];
    
    for (const relKey of Object.keys(ctx.relatives)) {
      const relativesList: any[] = ctx.relatives[relKey];
      if (!relativesList || relativesList.length === 0) continue;
      
      let mapped = false;
      if (relationsToCheck.includes('CHILD') && (relKey === 'sons' || relKey === 'daughters')) mapped = true;
      if (relationsToCheck.includes('FATHER') && relKey === 'fathers') mapped = true;
      if (relationsToCheck.includes('MOTHER') && relKey === 'mothers') mapped = true;
      if (relationsToCheck.includes('SIBLING_FULL') && (relKey === 'fullBrothers' || relKey === 'fullSisters')) mapped = true;
      if (relationsToCheck.includes('SIBLING_PATERNAL') && (relKey === 'paternalBrothers' || relKey === 'paternalSisters')) mapped = true;
      if (relationsToCheck.includes('SIBLING_MATERNAL') && (relKey === 'maternalBrothers' || relKey === 'maternalSisters')) mapped = true;
      if (relationsToCheck.includes('GRANDCHILD_MALE_LINE') && (relKey === 'grandsons' || relKey === 'granddaughters')) mapped = true;
      if ((relationsToCheck.includes('SPOUSE') || relationsToCheck.includes('SPOUSE_MALE') || relationsToCheck.includes('SPOUSE_FEMALE')) && relKey === 'spouses') mapped = true;
      if (relationsToCheck.includes('GRANDFATHER_PATERNAL') && relKey === 'grandfathers') mapped = true;
      if ((relationsToCheck.includes('GRANDMOTHER') || relationsToCheck.includes('GRANDMOTHER_PATERNAL') || relationsToCheck.includes('GRANDMOTHER_MATERNAL')) && relKey === 'grandmothers') mapped = true;
      
      if (mapped) {
        for (const person of relativesList) {
          if (criteria.state === 'ALIVE' && person.isDeceased) continue;
          if (criteria.gender && person.gender !== criteria.gender) continue;
          count++;
        }
      }
    }
    return count;
  }
}
