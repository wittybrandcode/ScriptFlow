import { Person, Relation } from '../core/types';

export interface ReactFlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string; [key: string]: any };
  type?: string;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
}

export interface ReactFlowGraph {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

export class ReactFlowAdapter {
  /**
   * Transforms a Nasab graph (nodes and edges) into a ReactFlow compatible format.
   * Employs a very basic tree layout approach to position relatives.
   */
  public static transform(
    persons: Person[],
    relations: Relation[],
    options?: { xOffset?: number; yOffset?: number }
  ): ReactFlowGraph {
    const nodes: ReactFlowNode[] = [];
    const edges: ReactFlowEdge[] = [];

    const xOffset = options?.xOffset || 200;
    const yOffset = options?.yOffset || 150;

    // Build adjacency and basic levels
    const adjacency = new Map<string, string[]>(); // parent -> children
    const inDegree = new Map<string, number>();

    persons.forEach(p => {
      adjacency.set(p.id, []);
      inDegree.set(p.id, 0);
    });

    relations.forEach((r, index) => {
      edges.push({
        id: `e_${r.sourceId}_${r.targetId}_${index}`,
        source: r.sourceId,
        target: r.targetId,
        label: r.type,
      });

      if (r.type.includes('PARENT')) {
        // source is parent, target is child
        adjacency.get(r.sourceId)?.push(r.targetId);
        inDegree.set(r.targetId, (inDegree.get(r.targetId) || 0) + 1);
      }
    });

    // Find roots (inDegree = 0)
    const roots = persons.filter(p => (inDegree.get(p.id) || 0) === 0);
    const levels = new Map<string, number>(); // id -> level

    // BFS to assign levels
    const queue: { id: string, level: number }[] = [];
    roots.forEach(r => queue.push({ id: r.id, level: 0 }));

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (!levels.has(id)) {
        levels.set(id, level);
        const children = adjacency.get(id) || [];
        children.forEach(child => {
          queue.push({ id: child, level: level + 1 });
        });
      }
    }

    // Assign positions based on level
    const levelCounts = new Map<number, number>();

    persons.forEach(p => {
      const level = levels.get(p.id) || 0; // default to 0 if disconnected
      const countIndex = levelCounts.get(level) || 0;
      
      nodes.push({
        id: p.id,
        position: { x: countIndex * xOffset, y: level * yOffset },
        data: { label: p.name || p.id, gender: p.gender, isDeceased: p.isDeceased },
      });

      levelCounts.set(level, countIndex + 1);
    });

    // Center align nodes in each level to make it look more like a tree
    const maxNodesInLevel = Math.max(...Array.from(levelCounts.values()));
    nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      const count = levelCounts.get(level) || 1;
      const totalWidthForLevel = count * xOffset;
      const maxWidth = maxNodesInLevel * xOffset;
      // offset to center
      node.position.x += (maxWidth - totalWidthForLevel) / 2;
    });

    return { nodes, edges };
  }
}
