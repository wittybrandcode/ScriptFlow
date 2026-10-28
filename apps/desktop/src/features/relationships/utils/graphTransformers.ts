/**
 * graphTransformers.ts
 * 
 * Transforms raw mapped edges into an ELK-compatible graph structure
 * by injecting hidden marriage nodes and rewiring children.
 * 
 * CRITICAL: At this stage, edges have ALREADY been processed by loadGraph.
 *   - edge.type = 'smoothstep' | 'default' | 'straight' (React Flow rendering type)
 *   - edge.data.relType = 'PARENT_MALE' | 'HUSBAND_OF' | 'WIFE_OF' | ... (semantic type)
 *   - edge.data.category = 'BIOLOGICAL' | 'DRAMATIC' | 'INFERRED' | ...
 * 
 * We must use edge.data.relType and edge.data.category for detection, NOT edge.type.
 */

function isMarriageEdge(edge: any): boolean {
  const relType = (edge.data?.relType || '').toUpperCase();
  return relType.includes('HUSBAND') || relType.includes('WIFE') || relType.includes('MARRIAGE') || relType.includes('SPOUSE');
}

function isParentChildEdge(edge: any): boolean {
  const relType = (edge.data?.relType || '').toUpperCase();
  if (relType === 'UNION_PARENT') return true;
  return relType.includes('PARENT') || relType.includes('CHILD') || relType.includes('MOTHER') || relType.includes('FATHER') || relType.includes('SON') || relType.includes('DAUGHTER');
}

export interface TransformResult {
  nodes: any[];
  edges: any[];
}

export const transformMarriages = (nodes: any[], edges: any[]): TransformResult => {
  const newNodes = [...nodes];
  const newEdges: any[] = [];
  const marriageMap: Record<string, string> = {}; // key: sorted "idA-idB", value: marriage node id
  const spouseOf: Record<string, string> = {};     // parentId -> marriageNodeId (for child rewiring)

  // ━━━ Pass 1: Find marriages, create hidden nodes ━━━
  edges.forEach((edge: any) => {
    if (isMarriageEdge(edge)) {
      const p1 = edge.source;
      const p2 = edge.target;
      const [a, b] = [p1, p2].sort();
      const key = `${a}-${b}`;
      const mId = `m-${a}-${b}`;

      if (!marriageMap[key]) {
        marriageMap[key] = mId;

        // Track which parents map to which marriage node
        spouseOf[a] = mId;
        spouseOf[b] = mId;

        // Inject hidden marriage node (tiny, invisible)
        newNodes.push({
          id: mId,
          type: 'union',
          data: { label: '' },
          position: { x: 0, y: 0 },
          width: 40,
          height: 40,
        });

        // Spouse A → marriage node (horizontal: right→left)
        newEdges.push({
          id: `e-${a}-to-${mId}`,
          source: a,
          target: mId,
          sourceHandle: 'right',
          targetHandle: 'left-parent',
          type: 'straight',
          style: { stroke: edge.style?.stroke || '#f472b6', strokeWidth: 2.5, strokeDasharray: '6 3', opacity: 0.8 },
          data: { category: 'STRUCTURAL', relType: 'MARRIAGE_LINK' },
        });

        // Spouse B → marriage node (horizontal: left→right)
        newEdges.push({
          id: `e-${b}-to-${mId}`,
          source: b,
          target: mId,
          sourceHandle: 'left-source',
          targetHandle: 'right-parent',
          type: 'straight',
          style: { stroke: edge.style?.stroke || '#f472b6', strokeWidth: 2.5, strokeDasharray: '6 3', opacity: 0.8 },
          data: { category: 'STRUCTURAL', relType: 'MARRIAGE_LINK' },
        });
      }
      // Drop the original marriage edge entirely (don't push it)
    } else {
      // Non-marriage edges pass through
      newEdges.push(edge);
    }
  });

  // ━━━ Pass 2: Rewire parent→child edges to originate from marriage node ━━━
  const rewiredEdges = newEdges.map((edge: any) => {
    if (isParentChildEdge(edge)) {
      const parentId = edge.source;
      const mId = spouseOf[parentId];
      
      if (mId) {
        // This parent has a marriage node — rewire child to come from marriage center
        return {
          ...edge,
          id: `${edge.id}_via_${mId}`,  // Unique ID to avoid collision
          source: mId,
          sourceHandle: 'bottom-child',
        };
      }
    }
    return edge;
  });

  // ━━━ Pass 3: Sibling Alignment (Virtual parentage logic for horizontal layout) ━━━
  // Find all sibling relationships
  const siblingEdges = rewiredEdges.filter((e: any) => {
    const relType = e.data?.relType || '';
    const label = e.data?.label || '';
    const checkIsSibling = (t: string) => {
      if (!t) return false;
      const upper = t.toUpperCase();
      return upper.includes('SIBLING') || upper.includes('BROTHER') || upper.includes('SISTER') || upper.includes('أخ') || upper.includes('أخت') || upper.includes('إخوة') || upper.includes('أخوة');
    };
    return checkIsSibling(relType) || checkIsSibling(label);
  });

  // Group siblings into connected components (sibling groups)
  const siblingNeighbors: Record<string, string[]> = {};
  siblingEdges.forEach((e: any) => {
    if (!siblingNeighbors[e.source]) siblingNeighbors[e.source] = [];
    if (!siblingNeighbors[e.target]) siblingNeighbors[e.target] = [];
    siblingNeighbors[e.source].push(e.target);
    siblingNeighbors[e.target].push(e.source);
  });

  const visited = new Set<string>();
  const siblingGroups: string[][] = [];

  nodes.forEach((node: any) => {
    if (visited.has(node.id) || node.type === 'union') return;
    if (!siblingNeighbors[node.id]) return;

    const group: string[] = [];
    const queue: string[] = [node.id];
    visited.add(node.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);
      const neighbors = siblingNeighbors[current] || [];
      neighbors.forEach((n: string) => {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      });
    }
    siblingGroups.push(group);
  });

  // For each sibling group, find or create parent, and rewire all group members to it
  siblingGroups.forEach((group, index) => {
    // Find if any member of the group already has an incoming parent edge
    let parentUnionId: string | null = null;
    for (const memberId of group) {
      const parentEdge = rewiredEdges.find((e: any) => e.target === memberId && (isParentChildEdge(e) || e.source.startsWith('m-')));
      if (parentEdge) {
        parentUnionId = parentEdge.source;
        break;
      }
    }

    // If no parent found, create a virtual union node
    if (!parentUnionId) {
      const vId = `v-union-siblings-group-${index}`;
      parentUnionId = vId;

      newNodes.push({
        id: vId,
        type: 'union',
        data: { label: '', isVirtual: true },
        position: { x: 0, y: 0 },
        width: 40,
        height: 40,
      });
    }

    // Ensure all group members are connected to this parentUnionId
    group.forEach(memberId => {
      const hasParentEdge = rewiredEdges.some((e: any) => e.source === parentUnionId && e.target === memberId);
      if (!hasParentEdge) {
        rewiredEdges.push({
          id: `e-virtual-align-${parentUnionId}-to-${memberId}`,
          source: parentUnionId,
          target: memberId,
          sourceHandle: 'bottom-child',
          targetHandle: 'top',
          type: 'straight',
          style: { stroke: 'transparent', opacity: 0 }, // Completely invisible
          data: { category: 'STRUCTURAL', relType: 'SIBLING_ALIGNMENT' }
        });
      }
    });
  });

  // ━━━ Pass 4: Deduplicate child edges ━━━
  const seen = new Set<string>();
  const dedupedEdges = rewiredEdges.filter((edge: any) => {
    const key = `${edge.source}->${edge.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { nodes: newNodes, edges: dedupedEdges };
};
