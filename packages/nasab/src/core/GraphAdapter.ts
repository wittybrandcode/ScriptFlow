import { Person, Relation } from './types';
import { RelationType } from './enums';
import { normalizeType } from './normalizer';

/**
 * A utility to transform raw NASAB flat arrays (Nodes + Edges) into a fast, searchable Graph (Adjacency List).
 * This significantly speeds up complex tree queries from O(N^2) to O(1) or O(N).
 */
export class GraphAdapter {
  private nodeMap = new Map<string, Person>();
  private adjacency = new Map<string, { targetId: string, type: RelationType }[]>();
  
  constructor(nodes: Person[], edges: Relation[]) {
    // 1. Build node map for O(1) lookups
    for (const n of nodes) {
      this.nodeMap.set(n.id, n);
      this.adjacency.set(n.id, []); // Initialize empty adj list
    }
    
    // 2. Build adjacency list for fast edge lookups
    for (const e of edges) {
      const type = normalizeType(e.type);
      if (this.adjacency.has(e.sourceId)) {
        this.adjacency.get(e.sourceId)!.push({ targetId: e.targetId, type });
      }
    }
  }

  /** Get a person by ID in O(1) */
  getNode(id: string): Person | undefined {
    return this.nodeMap.get(id);
  }

  /** Get all direct relationships from a person in O(1) */
  getOutboundEdges(id: string): { targetId: string, type: RelationType }[] {
    return this.adjacency.get(id) || [];
  }

  /** Find specific relatives (Children, Parents, Spouses) using fast lookup */
  getRelatives(id: string, types: RelationType[]): Person[] {
    const edges = this.getOutboundEdges(id);
    const relatives: Person[] = [];
    
    for (const edge of edges) {
      if (types.includes(edge.type)) {
        const person = this.getNode(edge.targetId);
        if (person) relatives.push(person);
      }
    }
    return relatives;
  }
}
