import { Person, Relation } from '../core/types';
import { RelationType } from '../core/enums';
import { normalizeType } from '../core/normalizer';

export interface D3Node {
  id: string;
  name: string;
  gender: string;
  isDeceased: boolean;
  children: D3Node[];
  isMarriageNode?: boolean;
}

export class D3TreeAdapter {
  /**
   * Converts a NASAB graph into a hierarchical tree format suitable for d3-hierarchy.
   * Note: Pure trees do not support multiple parents combining, so marriages are represented
   * as special 'Family/Marriage' intermediate nodes to avoid overlapping paths, or by choosing a primary lineage.
   * This implementation creates a generic DAG node structure, but when passed to D3 hierarchy it will only traverse the first parent effectively unless structured with marriage nodes.
   * We will structure it with Marriage nodes.
   */
  static transform(persons: Person[], relations: Relation[], rootPersonId: string): D3Node | null {
    const personMap = new Map(persons.map(p => [p.id, p]));
    
    // Build adjacency list for children
    const childrenMap = new Map<string, string[]>();
    relations.forEach(r => {
      const type = normalizeType(r.type);
      if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE) {
        if (!childrenMap.has(r.sourceId)) childrenMap.set(r.sourceId, []);
        childrenMap.get(r.sourceId)!.push(r.targetId);
      }
    });

    const buildTree = (currentId: string, visited: Set<string>): D3Node | null => {
        if (visited.has(currentId)) return null; // Cycle protection
        visited.add(currentId);

        const person = personMap.get(currentId);
        if (!person) return null;

        const node: D3Node = {
            id: person.id,
            name: person.name,
            gender: person.gender,
            isDeceased: person.isDeceased,
            children: []
        };

        const childrenObj = childrenMap.get(currentId) || [];
        for (const childId of childrenObj) {
            const childNode = buildTree(childId, new Set(visited));
            if (childNode) {
                node.children.push(childNode);
            }
        }

        return node;
    };

    return buildTree(rootPersonId, new Set<string>());
  }
}
