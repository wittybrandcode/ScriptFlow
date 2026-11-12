import { InferenceEngine } from '../../nasab-inference/src/engine';
import { RulesRegistry } from '../../nasab-rule-engine/src/registry';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Person, Relation } from '../../../src/core/types';
import { Gender } from '../../../src/core/enums';
import { Madhab } from '../../../src/types/FiqhAST';

const getRulesDir = () => {
  try {
    if (typeof __dirname !== 'undefined' && __dirname) {
      return path.join(__dirname, '../../nasab-rule-engine/rules');
    }
  } catch {}
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      const filename = fileURLToPath(import.meta.url);
      return path.join(path.dirname(filename), '../../nasab-rule-engine/rules');
    }
  } catch {}
  return path.resolve('packages/nasab/packages/nasab-rule-engine/rules');
};


export class NasabAPI {
  public static buildEstate() {
    return new EstateBuilder();
  }
}

export class EstateBuilder {
  private _deceased!: Person;
  private nodes: Person[] = [];
  private edges: Relation[] = [];
  private madhab: Madhab = 'COMMON';

  public deceased(name: string, gender: Gender = Gender.MALE): this {
    this._deceased = { id: 'deceased', name, gender, isDeceased: true };
    this.nodes.push(this._deceased);
    return this;
  }

  public addNode(
    relation: string,
    options: { gender?: Gender; count?: number; isAlive?: boolean } = {}
  ): this {
    const isFemaleRelation = ['MOTHER', 'DAUGHTER', 'WIFE', 'FULL_SISTER', 'PATERNAL_SISTER', 'MATERNAL_SISTER', 'GRANDMOTHER', 'GRANDMOTHER_PATERNAL', 'GRANDMOTHER_MATERNAL'].includes(relation.toUpperCase());
    const gender = options.gender ?? (isFemaleRelation ? Gender.FEMALE : Gender.MALE);
    const { count = 1, isAlive = true } = options;
    for (let i = 0; i < count; i++) {
      const id = `${relation}_${this.nodes.length}`;
      this.nodes.push({ id, name: id, gender, isDeceased: !isAlive });
      
      let mappedRelation = relation;
      if (relation === 'MOTHER') mappedRelation = 'PARENT_FEMALE';
      else if (relation === 'FATHER') mappedRelation = 'PARENT_MALE';
      else if (relation === 'CHILD') mappedRelation = gender === Gender.MALE ? 'CHILD_MALE' : 'CHILD_FEMALE';
      else if (relation === 'SON') mappedRelation = 'CHILD_MALE';
      else if (relation === 'DAUGHTER') mappedRelation = 'CHILD_FEMALE';

      this.edges.push({ sourceId: id, targetId: 'deceased', type: mappedRelation as any } as any);
    }
    return this;
  }

  public setMadhab(madhab: Madhab): this {
    this.madhab = madhab;
    return this;
  }

  public evaluate() {
    const registry = new RulesRegistry();
    const rulesDir = getRulesDir();
    registry.loadRulesFromDirectory(rulesDir);
    
    // For simplicity, we just pass the edges list as the graph
    const engine = new InferenceEngine(this.edges, registry.inheritanceRules, registry.blockingRules);
    const results = engine.execute('deceased', this.nodes);
    
    return new EstateResult(results, engine.explanationEngine.generateExplanationMarkdown());
  }
}

export class EstateResult {
  constructor(public data: any[], private explanationMarkdown: string) {}

  public explainStr(): string {
    let exp = `نتائج الميراث:\\n`;
    for (const res of this.data) {
      if (!res.isBlocked) {
        exp += `- الوارث (${res.nodeId}): نصيبه ${res.shareValue || 'عصبة'}`;
        if (res.notes) exp += ` (${res.notes})`;
        exp += '\\n';
      } else {
        exp += `- الوارث (${res.nodeId}) محجوب`;
        if (res.notes) exp += ` (${res.notes})`;
        exp += '\\n';
      }
    }
    return exp;
  }
  
  public getExplanation(): string {
    return this.explanationMarkdown;
  }
}
