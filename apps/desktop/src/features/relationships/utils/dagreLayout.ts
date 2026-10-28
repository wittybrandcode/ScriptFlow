import dagre from 'dagre';
import { LineageEngine, Gender } from 'nasab';

const LINEAGE_COLORS = ['#3b82f620', '#10b98120', '#f59e0b20', '#8b5cf620', '#ec489920', '#ef444420'];

export interface LayoutResult {
  nodes: any[];
  edges: any[];
}

export const getLayoutedElements = (nodes: any[], edges: any[], direction: string = 'TB'): LayoutResult => {
  // Create a fresh graph for family tree nodes
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ 
    rankdir: direction, 
    nodesep: 100,   // Horizontal spacing between sibling nodes
    ranksep: 160,   // Vertical spacing between generations
    edgesep: 40,    // Minimum spacing between edges
    marginx: 40,
    marginy: 40,
  });

  // Biological/lineage edges that define the tree hierarchy
  const biologicalEdgeTypes = [
    'PARENT_MALE', 'PARENT_FEMALE', 'PARENT', 'AUNT', 'UNCLE',
    'MARRIAGE', 'HUSBAND_OF', 'WIFE_OF', 'EX_MARRIAGE',
    'MARRIAGE_LINK', 'SIBLING_ALIGNMENT'
  ];

  // 1. Identify all nodes connected to family lineage
  const familyNodeIds = new Set<string | number>();
  edges.forEach((edge: any) => {
    const rel = edge.data?.relType || '';
    const isBiological = biologicalEdgeTypes.some(t => rel === t || rel.includes(t));
    if (isBiological) {
      familyNodeIds.add(edge.source);
      familyNodeIds.add(edge.target);
    }
  });

  // Separate nodes: family tree vs unrelated/dramatic-only
  const familyNodes: any[] = [];
  const unrelatedNodes: any[] = [];

  nodes.forEach((node: any) => {
    if (node.type === 'union' || familyNodeIds.has(node.id)) {
      familyNodes.push(node);
    } else {
      unrelatedNodes.push(node);
    }
  });

  // 2. Add family nodes to Dagre
  familyNodes.forEach((node: any) => {
    const isUnion = node.type === 'union';
    const w = isUnion ? 40 : (node.data?.width || 230);
    const h = isUnion ? 40 : (node.data?.expanded ? 300 : (node.data?.height || 120));
    g.setNode(node.id, { width: w, height: h });
  });

  // 3. Add biological edges to Dagre
  edges.forEach((edge: any) => {
    const rel = edge.data?.relType || '';
    const isMarriage = rel.includes('MARRIAGE') || rel.includes('SPOUSE') || rel.includes('زوج') || rel === 'HUSBAND_OF' || rel === 'WIFE_OF' || rel === 'MARRIAGE_LINK';
    const isBiological = biologicalEdgeTypes.some(t => rel === t || rel.includes(t));
    
    if (isBiological && g.hasNode(edge.source) && g.hasNode(edge.target)) {
      if (isMarriage) {
        g.setEdge(edge.source, edge.target, { minlen: 1, weight: 3 });
      } else {
        g.setEdge(edge.source, edge.target, { minlen: 2, weight: 2 });
      }
    }
  });

  // Run Layout on family tree only
  dagre.layout(g);

  // Position family tree nodes
  let minFamilyX = Infinity;
  let layoutedFamilyNodes = familyNodes.map((node: any) => {
    const nodeWithPosition = g.node(node.id);
    if (!nodeWithPosition) return node;

    const isUnion = node.type === 'union';
    const w = isUnion ? 40 : (node.data?.width || 230);
    const h = isUnion ? 40 : (node.data?.expanded ? 300 : (node.data?.height || 120));

    const posX = nodeWithPosition.x - w / 2;
    if (node.type !== 'union' && posX < minFamilyX) {
      minFamilyX = posX;
    }

    return {
      ...node,
      position: {
        x: posX,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });

  // 4. Shift family tree to the right to make space for the unrelated sidebar
  // Unrelated sidebar takes x: 50px to 280px. Family tree starts at x: 350px.
  const targetMinX = 350;
  const shiftX = isFinite(minFamilyX) ? (targetMinX - minFamilyX) : 0;

  layoutedFamilyNodes = layoutedFamilyNodes.map(node => ({
    ...node,
    position: {
      x: node.position.x + shiftX,
      y: node.position.y
    }
  }));

  // 5. Place unrelated/dramatic characters on the left side
  const unrelatedStartX = 50;
  const unrelatedStartY = 80;
  const verticalSpacing = 160;

  const layoutedUnrelatedNodes = unrelatedNodes.map((node, index) => {
    return {
      ...node,
      position: {
        x: unrelatedStartX,
        y: unrelatedStartY + index * verticalSpacing
      }
    };
  });

  const finalNodes = [...layoutedFamilyNodes, ...layoutedUnrelatedNodes];

  try {
    const nasabNodes = finalNodes.map(n => ({
      id: String(n.id),
      name: n.data?.name || 'Unknown',
      gender: n.data?.gender?.toUpperCase() === 'FEMALE' ? Gender.FEMALE : Gender.MALE,
      isDeceased: n.data?.isDeceased
    }));
    const nasabEdges = edges.map(e => ({
      sourceId: String(e.source),
      targetId: String(e.target),
      type: e.data?.relType || 'INFERRED'
    }));
    
    const lineageNodes = LineageEngine.propagate(nasabNodes, nasabEdges);
    
    finalNodes.forEach(n => {
      const lineageNode = lineageNodes.find(ln => ln.id === String(n.id));
      if (lineageNode?.lineageId) {
        let hash = 0;
        for (let i = 0; i < lineageNode.lineageId.length; i++) hash = lineageNode.lineageId.charCodeAt(i) + ((hash << 5) - hash);
        const colorIndex = Math.abs(hash) % LINEAGE_COLORS.length;
        n.style = { ...n.style, backgroundColor: LINEAGE_COLORS[colorIndex], borderRadius: '1rem', padding: '4px' };
      }
    });
  } catch (e) {
    console.error('Lineage coloring failed', e);
  }

  return { nodes: finalNodes, edges };
};
