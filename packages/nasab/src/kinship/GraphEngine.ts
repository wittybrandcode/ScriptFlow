import { Relation } from '../core/types';
import { RelationType } from '../core/enums';
import { normalizeType } from '../core/normalizer';

/**
 * محرك الرسم البياني المتقدم
 * يعالج الخوارزميات المعقدة على شجرة العائلة كدورات القرابة وحسابات التزاوج الداخلي.
 */
export class GraphEngine {
  /**
   * خوارزمية تارجان لاكتشاف المكونات شديدة الارتباط (SCC).
   * مفيدة للبحث عن حلقات دائرية مستحيلة بيولوجياً أو دورات في رسم القرابة.
   */
  static detectCycles(edges: Relation[]): string[][] {
    let index = 0;
    const stack: string[] = [];
    const indices: Map<string, number> = new Map();
    const lowlink: Map<string, number> = new Map();
    const onStack: Map<string, boolean> = new Map();
    const sccs: string[][] = [];

    // نبني خريطة الجوار (Adjacency List) بناءً على علاقات الأبوة والأمومة (من الوالد إلى الولد)
    const adj = new Map<string, string[]>();

    for (const e of edges) {
      const type = normalizeType(e.type);
      if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE) {
        if (!adj.has(e.sourceId)) adj.set(e.sourceId, []);
        adj.get(e.sourceId)!.push(e.targetId);
      } else if (type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE) {
        if (!adj.has(e.targetId)) adj.set(e.targetId, []);
        adj.get(e.targetId)!.push(e.sourceId);
      }
    }

    const strongconnect = (v: string) => {
      indices.set(v, index);
      lowlink.set(v, index);
      index++;
      stack.push(v);
      onStack.set(v, true);

      const neighbors = adj.get(v) || [];
      for (const w of neighbors) {
        if (!indices.has(w)) {
          strongconnect(w);
          lowlink.set(v, Math.min(lowlink.get(v) as number, lowlink.get(w) as number));
        } else if (onStack.get(w)) {
          lowlink.set(v, Math.min(lowlink.get(v) as number, indices.get(w) as number));
        }
      }

      if (lowlink.get(v) === indices.get(v)) {
        const scc: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.set(w, false);
          scc.push(w);
        } while (w !== v);
        // الدورة يجب أن تحتوي على أكثر من عقدة واحدة لتكون دورة فعلية
        if (scc.length > 1) {
          sccs.push(scc);
        }
      }
    };

    // جمع جميع العقد الموجودة في العلاقات الأبوية
    const nodes = new Set<string>();
    for (const [u, neighbors] of adj.entries()) {
      nodes.add(u);
      neighbors.forEach(v => nodes.add(v));
    }

    for (const v of nodes) {
      if (!indices.has(v)) {
        strongconnect(v);
      }
    }

    return sccs;
  }

  /**
   * حساب معامل التزاوج الداخلي (Wright's Inbreeding Coefficient - COI).
   * يمثل احتمالية أن يرث الفرد أليلين متطابقين من أسلاف مشتركين.
   * خوارزمية البحث المسباري للوصول للأسلاف المشتركين بين الأب والأم.
   */
  static calculateCOI(personId: string, edges: Relation[]): number {
    // تبسيط: حساب مسارات القرابة (Path Method by Sewall Wright)
    // نبحث عن الآباء مباشرة
    const parents = edges.filter(e => {
        const type = normalizeType(e.type);
        return (e.targetId === personId && (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE)) ||
               (e.sourceId === personId && (type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE));
    }).map(e => {
        const type = normalizeType(e.type);
        return type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE ? e.sourceId : e.targetId;
    });

    if (parents.length !== 2) return 0; // إذا لم يُعرف الوالدان فلا يوجد COI محسوب

    const [fatherId, motherId] = parents;

    // الحصول على جميع أسلاف الأب والأم
    const getAncestors = (startId: string): Map<string, number> => {
        const ancestors = new Map<string, number>();
        const queue: { id: string, depth: number }[] = [{ id: startId, depth: 0 }];
        
        while (queue.length > 0) {
            const { id, depth } = queue.shift()!;
            if (!ancestors.has(id)) {
                ancestors.set(id, depth);
                // جلب آباء هذه العقدة
                const parentIds = edges.filter(e => {
                    const type = normalizeType(e.type);
                    return (e.targetId === id && (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE)) ||
                           (e.sourceId === id && (type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE));
                }).map(e => {
                    const type = normalizeType(e.type);
                    return type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE ? e.sourceId : e.targetId;
                });
                
                for (const pId of parentIds) {
                    queue.push({ id: pId, depth: depth + 1 });
                }
            }
        }
        return ancestors;
    };

    const fatherAncestors = getAncestors(fatherId);
    const motherAncestors = getAncestors(motherId);

    let coi = 0;

    // حساب المعامل لكل سلف مشترك
    // COI = sum( (1/2)^(n1 + n2 + 1) * (1 + FA) )
    // للتبسيط نعتبر FA (تزاوج السلف الداخلي) = 0 حالياً
    for (const [ancestorId, depthFather] of fatherAncestors.entries()) {
        if (motherAncestors.has(ancestorId)) {
            const depthMother = motherAncestors.get(ancestorId)!;
            // n1 = depthFather, n2 = depthMother
            coi += Math.pow(0.5, depthFather + depthMother + 1);
        }
    }

    return coi;
  }

  /**
   * إيجاد مسارات القرابة (Kinship Paths) باستخدام التقييم الكسول (Lazy Evaluation)
   * يتم استخدام المولدات (Generators) للبحث في مسار أو أكثر دون الاضطرار لمسح كامل الشجرة.
   */
  static *findKinshipPaths(
    sourceId: string,
    targetId: string,
    edges: Relation[],
    maxDepth: number = 10
  ): Generator<Relation[], void, unknown> {
    
    const adj = new Map<string, Relation[]>();
    for (const e of edges) {
      if (!adj.has(e.sourceId)) adj.set(e.sourceId, []);
      adj.get(e.sourceId)!.push(e);
      
      const revEdges = adj.get(e.targetId) || [];
      revEdges.push({ sourceId: e.targetId, targetId: e.sourceId, type: e.type });
      adj.set(e.targetId, revEdges);
    }

    const queue: { currentId: string, path: Relation[], visited: Set<string> }[] = [];
    queue.push({ currentId: sourceId, path: [], visited: new Set([sourceId]) });

    while (queue.length > 0) {
      const { currentId, path, visited } = queue.shift()!;

      if (currentId === targetId && path.length > 0) {
        yield path;
        continue;
      }

      if (path.length >= maxDepth) continue;

      const neighbors = adj.get(currentId) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.targetId)) {
          const newVisited = new Set(visited);
          newVisited.add(edge.targetId);
          queue.push({
            currentId: edge.targetId,
            path: [...path, edge],
            visited: newVisited
          });
        }
      }
    }
  }
}

