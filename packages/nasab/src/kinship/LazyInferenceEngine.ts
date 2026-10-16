import { Person, Relation } from '../core/types';
import { RelationType, Gender } from '../core/enums';
import { normalizeType } from '../core/normalizer';

export interface GraphPathContext {
  nodes: Person[];
  edges: Relation[];
}

export interface ShortestPathResult {
  distance: number;
  path: Relation[];
}

/**
 * محرك استنتاج كسول (Lazy Inference):
 * يستخدم للبحث عن العلاقات بين شخصين محددين (A إلى B)
 * عبر مسار أقصر (BFS) دون الحاجة لاستنتاج كافة علاقات الشجرة O(N^3).
 */
export class LazyInferenceEngine {
  private nodeMap = new Map<string, Person>();
  private outEdges = new Map<string, Relation[]>();
  private inEdges = new Map<string, Relation[]>();

  constructor(private context: GraphPathContext) {
    this.buildGraph();
  }

  private buildGraph() {
    for (const n of this.context.nodes) {
      this.nodeMap.set(n.id, n);
    }
    for (const e of this.context.edges) {
      const type = normalizeType(e.type);
      const edge = { ...e, type };

      let outArr = this.outEdges.get(e.sourceId);
      if (!outArr) { outArr = []; this.outEdges.set(e.sourceId, outArr); }
      outArr.push(edge);

      let inArr = this.inEdges.get(e.targetId);
      if (!inArr) { inArr = []; this.inEdges.set(e.targetId, inArr); }
      inArr.push(edge);
    }
  }

  /**
   * العثور على أقصر مسار شرعي أو بيولوجي بين شخصين.
   */
  public findShortestPath(sourceId: string, targetId: string): ShortestPathResult | null {
    if (sourceId === targetId) return { distance: 0, path: [] };

    const queue: { id: string; dist: number; path: Relation[] }[] = [];
    const visited = new Set<string>();

    queue.push({ id: sourceId, dist: 0, path: [] });
    visited.add(sourceId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.id === targetId) {
        return { distance: current.dist, path: current.path };
      }

      // Check outgoing edges
      const outE = this.outEdges.get(current.id) || [];
      for (const e of outE) {
        if (!visited.has(e.targetId)) {
          visited.add(e.targetId);
          queue.push({ 
            id: e.targetId, 
            dist: current.dist + 1, 
            path: [...current.path, e] 
          });
        }
      }

      // Check incoming edges (reverse traversal)
      const inE = this.inEdges.get(current.id) || [];
      for (const e of inE) {
        if (!visited.has(e.sourceId)) {
          visited.add(e.sourceId);
          // To define the "reverse" path edge conceptually:
          // We can just store the original edge, but in analysis we know it's traversed backwards
          queue.push({ 
            id: e.sourceId, 
            dist: current.dist + 1, 
            path: [...current.path, e]
          });
        }
      }
    }

    return null;
  }

  /**
   * حساب درجة القرابة بين شخصين (Degree of Consanguinity)
   * مفيد للتحليلات الطبية والجينات (المرحلة 3).
   * يعود برقم (1 للآباء/أبناء، 2 للإخوة/أجداد، إلخ)
   */
  public getDegreeOfConsanguinity(sourceId: string, targetId: string): number | null {
    const res = this.findShortestPath(sourceId, targetId);
    if (!res) return null;

    // Filter out marriage/affinity edges to compute biological consanguinity if needed
    // For general graph distance, we just use res.distance
    // Strict consanguinity requires only blood paths.
    let bloodDistance = 0;
    for (const e of res.path) {
       const isMarriage = [RelationType.SPOUSE_MALE, RelationType.SPOUSE_FEMALE, RelationType.EX_SPOUSE_MALE, RelationType.EX_SPOUSE_FEMALE].includes(e.type as RelationType);
       const isFoster = [RelationType.FOSTER_MOTHER, RelationType.FOSTER_FATHER, RelationType.FOSTER_SON, RelationType.FOSTER_DAUGHTER].includes(e.type as RelationType);
       if (isMarriage || isFoster) {
         // Not biological consanguinity if relying on marriage or foster
         return null;
       }
       bloodDistance++;
    }
    
    return bloodDistance;
  }
}
