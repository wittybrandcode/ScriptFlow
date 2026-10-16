import { KinshipGraph } from './KinshipGraph';
import { UUID, RelationCategory } from '@nasab/model';

export class GraphQuery {
  private graph: KinshipGraph;

  constructor(graph: KinshipGraph) {
    this.graph = graph;
  }

  /**
   * هل العقدة (source) تدلي بالعقدة (target)؟
   * بالمعنى الفقهي: هل target متصل بـ source عبر سلسلة نسب بيولوجية صاعدة أو هابطة؟
   * (تمهيد لاكتشاف المسارات Path Finding)
   */
  public doesNodesConnect(sourceId: UUID, targetId: UUID, maxDepth: number = 10): boolean {
    if (sourceId === targetId) return true;

    // بحث العرض أولاً (BFS) بسيط للارتباط البيولوجي
    const visited = new Set<UUID>();
    const queue: { id: UUID, depth: number }[] = [{ id: sourceId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.id === targetId) {
        return true;
      }

      if (current.depth >= maxDepth) continue;

      if (!visited.has(current.id)) {
        visited.add(current.id);

        const edges = this.graph.getEdgesByCategory(current.id, RelationCategory.BLOOD_LINEAGE);
        for (const edge of edges) {
          const neighborId = edge.sourceId === current.id ? edge.targetId : edge.sourceId;
          if (!visited.has(neighborId)) {
            queue.push({ id: neighborId, depth: current.depth + 1 });
          }
        }
      }
    }

    return false;
  }

  /** استخراج المسار الجيني بين شخصين */
  public findShortestPath(sourceId: UUID, targetId: UUID): UUID[] | null {
    if (sourceId === targetId) return [sourceId];

    const visited = new Set<UUID>();
    const parentMap = new Map<UUID, UUID>();
    const queue: UUID[] = [sourceId];

    visited.add(sourceId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === targetId) {
        // إعادة بناء المسار
        const path: UUID[] = [];
        let curr: UUID | undefined = targetId;
        while (curr) {
          path.unshift(curr);
          curr = parentMap.get(curr);
        }
        return path;
      }

      const edges = this.graph.getEdgesByCategory(current, RelationCategory.BLOOD_LINEAGE);
      for (const edge of edges) {
        const neighborId = edge.sourceId === current ? edge.targetId : edge.sourceId;
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          parentMap.set(neighborId, current);
          queue.push(neighborId);
        }
      }
    }

    return null;
  }
}
