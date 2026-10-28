import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MarkerType, Node, Edge } from '@xyflow/react';
import { TYPE_MAP } from '../utils/typeRegistry';
import { getLayoutedElements } from '../utils/dagreLayout';
import { transformMarriages } from '../utils/graphTransformers';
import { translator, normalizeType, getInverseRelation, isMarriage, isSibling, GraphEngine, LineageEngine, Gender } from 'nasab';

export interface NasabMetadata {
  warnings: string[];
}

export function useRelationshipGraph(scenarioId: string | undefined | null, viewMode: string) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nasabMetadata, setNasabMetadata] = useState<NasabMetadata>({ warnings: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const rawGraphData = useRef<{ nodes: any[]; edges: any[] } | null>(null);
  
  // Track node positions dragged by the user, overrides ELK layout
  const positionOverrides = useRef<Record<string, { x: number; y: number }>>({});

  const processGraph = useCallback(async (rawNodes: any[], rawEdges: any[]) => {
    let filteredEdges = rawEdges;
    if (viewMode === 'BIOLOGICAL') {
      filteredEdges = rawEdges.filter((e: any) => e.data?.category === 'BIOLOGICAL' || e.data?.category === 'INFERRED' || e.data?.category === 'INFERRED_CO_PARENT' || e.data?.category === 'DRAMATIC');
    }

    // ═══ Transform marriages into union nodes (BIOLOGICAL mode only) ═══
    let currentNodes = [...rawNodes];
    let currentEdges = [...filteredEdges];
    
    if (viewMode === 'BIOLOGICAL') {
      const transformed = transformMarriages(currentNodes, currentEdges);
      currentNodes = transformed.nodes;
      currentEdges = transformed.edges;
    }

    // Dagre: compute positions only. Edges pass through UNCHANGED.
    const { nodes: layoutedNodes } = await getLayoutedElements(currentNodes, currentEdges);
    
    // ═══ Dynamic wire direction fix for spouse edges ═══
    // After layout, compare spouse positions to the union node and flip handles if needed
    if (viewMode === 'BIOLOGICAL') {
      currentEdges = currentEdges.map((edge: any) => {
        if (edge.data?.relType !== 'MARRIAGE_LINK') return edge;
        
        const sourceNode = layoutedNodes.find((n: any) => n.id === edge.source);
        const targetNode = layoutedNodes.find((n: any) => n.id === edge.target);
        if (!sourceNode || !targetNode) return edge;

        const isSourceUnion = sourceNode.type === 'union';
        const isTargetUnion = targetNode.type === 'union';

        // Source is a person, target is the union node
        if (!isSourceUnion && isTargetUnion) {
          const personCenterX = sourceNode.position.x + (sourceNode.type === 'union' ? 20 : 115);
          const unionCenterX = targetNode.position.x + 20;

          if (personCenterX < unionCenterX) {
            // Person is to the LEFT of union → wire from person's RIGHT to union's LEFT
            return { ...edge, sourceHandle: 'right', targetHandle: 'left-parent' };
          } else {
            // Person is to the RIGHT of union → wire from person's LEFT to union's RIGHT
            return { ...edge, sourceHandle: 'left-source', targetHandle: 'right-parent' };
          }
        }
        return edge;
      });
    }

    let finalNodes = layoutedNodes
      .filter((n: any) => !n.id.startsWith('v-union-siblings-group-'))
      .map((n: any) => ({
        ...n,
        position: viewMode === 'BIOLOGICAL' ? n.position : (positionOverrides.current[n.id] || n.position),
        draggable: viewMode !== 'BIOLOGICAL'
      }));

    // Edges: filter out virtual sibling alignment edges and format/apply opacity
    let finalEdges = currentEdges
      .filter((e: any) => e.data?.relType !== 'SIBLING_ALIGNMENT' && !e.id.startsWith('e-virtual-align-'))
      .map((e: any) => {
        if (viewMode === 'DRAMATIC') {
          if (e.data?.category !== 'DRAMATIC') {
            return { 
              ...e, 
              style: { ...e.style, opacity: 0.15 }, 
              labelStyle: { ...e.labelStyle, fillOpacity: 0.3 },
              labelBgStyle: { ...e.labelBgStyle, fillOpacity: 0.15 },
              zIndex: -1, 
              animated: false 
            };
          }
          return { ...e, zIndex: 50 };
        }
        return e;
      });

    setNodes(finalNodes);
    setEdges(finalEdges);
  }, [viewMode]);

  // Debounced wrapper for processGraph to avoid mid-input/frequent layout stuttering
  const debouncedProcessGraph = useMemo(() => {
    let timer: any;
    const debounced = (rawNodes: any[], rawEdges: any[]) => {
      return new Promise<void>((resolve) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          processGraph(rawNodes, rawEdges).then(resolve);
        }, 200);
      });
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  }, [processGraph]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => debouncedProcessGraph.cancel();
  }, [debouncedProcessGraph]);

  const loadGraph = useCallback(async () => {
    if (!scenarioId) return;
    try {
      setIsLoading(true);
      const { CharacterRepository, CharacterRelationshipRepository } = await import('@scriptflow/database');
      const charRepo = new CharacterRepository();
      const relRepo = new CharacterRelationshipRepository();

      const dbNodes = await charRepo.getByScenarioId(scenarioId);
      const dbEdges = await relRepo.getByScenarioId(scenarioId);

      // Import nasab validators and engines
      const { KinshipValidator, InferenceEngine } = await import('nasab');

      const nasabNodes = dbNodes.map(n => {
        const meta = n.metadata ? JSON.parse(n.metadata) : {};
        const rpg = meta.rpg || {};
        return {
          id: String(n.id),
          name: n.name,
          gender: n.gender?.toUpperCase() === 'FEMALE' ? Gender.FEMALE : Gender.MALE,
          birthDate: n.birth_date || undefined,
          deathDate: n.death_date || undefined,
          isDeceased: Boolean(n.is_deceased),
          traits: rpg.traits || [],
          isDisqualified: rpg.isDisqualified || false
        };
      });

      const nasabEdges = dbEdges.map(e => ({
        sourceId: String(e.character_id),
        targetId: String(e.partner_id),
        type: e.relationship_type as any
      }));

      // Validate all relationships to populate warnings
      const warnings: string[] = [];
      for (const edge of nasabEdges) {
        const otherEdges = nasabEdges.filter(e => e !== edge);
        const valRes = KinshipValidator.validate(
          edge.sourceId,
          edge.targetId,
          edge.type,
          nasabNodes as any,
          otherEdges as any,
          'DRAMATIC'
        );
        if (valRes.status === 'WARNING' || valRes.status === 'ERROR') {
          warnings.push(valRes.error?.message || `تعارض في العلاقة بين ${edge.sourceId} و ${edge.targetId}`);
        }
      }

      // Detect cycles
      const cycles = GraphEngine.detectCycles(nasabEdges as any);
      if (cycles.length > 0) {
        warnings.push(`⚠️ دورة مستحيلة: ${cycles.map(c => c.join(' → ')).join(', ')}`);
      }

      // Infer relationships automatically
      let inferredMappedEdges: any[] = [];
      try {
        const inferredRelations = InferenceEngine.infer(nasabNodes as any, nasabEdges as any);
        inferredMappedEdges = inferredRelations.map((inf: any, idx: number) => ({
          id: `e_bio_s_${inf.sourceId}_${inf.targetId}_${idx}`, // SCRIPTFLOW expects e_bio_s_ prefix for inferred sibling-like edges
          source: inf.sourceId,
          target: inf.targetId,
          type: inf.type,
          category: 'INFERRED'
        }));
      } catch (infErr) {
        console.warn('Inference failed:', infErr);
      }

      // Use LineageEngine to compute lineage IDs
      const propagatedNodes = LineageEngine.propagate(nasabNodes as any, nasabEdges as any);
      const lineageMap = new Map(propagatedNodes.map(n => [n.id, n.lineageId]));

      const json = {
        nasabMetadata: { warnings },
        nodes: dbNodes.map(n => {
          const meta = n.metadata ? JSON.parse(n.metadata) : {};
          const rpg = meta.rpg || {};
          const charLineageId = lineageMap.get(String(n.id)) || null;
          return {
            id: String(n.id),
            position: JSON.parse((n as any).graph_position || '{"x":0,"y":0}'),
            data: { 
              ...n, 
              isDeceased: Boolean(n.is_deceased),
              traits: rpg.traits || [],
              isDisqualified: rpg.isDisqualified || false,
              rpgMetadata: rpg,
              lineageId: charLineageId
            }
          };
        }),
        edges: [
          ...dbEdges.map(e => ({
             id: String(e.id),
             source: String(e.character_id),
             target: String(e.partner_id),
             type: e.relationship_type,
             category: e.relationship_category || 'DRAMATIC'
          })),
          ...inferredMappedEdges
        ]
      };

      setNasabMetadata(json.nasabMetadata || { warnings: [] });
      
      const mappedNodes = json.nodes.map(n => ({
        id: n.id,
        type: 'customCharacter',
        data: n.data,
        position: n.position,
        draggable: true,
      }));

      mappedNodes.forEach(n => {
        if (n.position && (n.position.x !== 0 || n.position.y !== 0)) {
            positionOverrides.current[n.id] = n.position;
        }
      });

      const parentEdges: Record<string, string[]> = {};
      json.edges.forEach(e => {
        if (e.type === 'PARENT_MALE' || e.type === 'PARENT_FEMALE') {
          if (!parentEdges[e.source]) parentEdges[e.source] = [];
          parentEdges[e.source].push(e.id);
        }
      });
      Object.keys(parentEdges).forEach(source => parentEdges[source].sort());

      const mappedEdges = json.edges.map(e => {
        let actualSource = e.source;
        let actualTarget = e.target;
        let actualType = normalizeType(e.type);

        if (actualType === 'CHILD_MALE' || actualType === 'CHILD_FEMALE') {
           actualSource = e.target;
           actualTarget = e.source;
           const parentChar = json.nodes.find(n => n.id === actualSource);
           const inv = getInverseRelation(actualType, parentChar?.data?.gender?.toUpperCase());
           actualType = (inv || 'PARENT_MALE') as any;
        }

        // ═══ Arabic translation via nasab translator ═══
        const arabicLabel = translator.getRelationLabel(actualType);
        const hasTranslation = arabicLabel && arabicLabel !== actualType;

        const isM = isMarriage(actualType);
        const isS = isSibling(actualType) || Boolean(arabicLabel && (arabicLabel.includes('أخ') || arabicLabel.includes('أخت') || arabicLabel.includes('إخوة')));

        let label = '';
        let color = '#94a3b8';
        let sourceHandle = 'bottom';
        let targetHandle = 'top';
        let markerStart = undefined;
        let markerEnd: any = { type: MarkerType.ArrowClosed, color: '#94a3b8' };

        if (isM || isS) {
          sourceHandle = 'right';
          targetHandle = 'left';
        }

        if ((actualType as any) === 'SIBLING_INFERRED') {
          label = hasTranslation ? arabicLabel : 'أخوة';
          color = '#10b981';
          markerEnd = { type: MarkerType.ArrowClosed, color: '#10b981' };
        } else if (e.category === 'INFERRED_CO_PARENT') {
          label = '❓ تحديد العلاقة';
          color = '#f59e0b';
          sourceHandle = 'right';
          targetHandle = 'left';
          markerEnd = { type: MarkerType.ArrowClosed, color };
        } else if (actualType === 'CO_PARENT_MALE' || actualType === 'CO_PARENT_FEMALE') {
          label = actualType === 'CO_PARENT_MALE' ? 'شريك إنجاب' : 'شريكة إنجاب';
          color = '#f59e0b';
          sourceHandle = 'right';
          targetHandle = 'left';
          markerEnd = { type: MarkerType.ArrowClosed, color };
        } else if (e.category === 'INFERRED') {
          label = hasTranslation ? arabicLabel : actualType;
          color = '#8b5cf6';
          markerEnd = { type: MarkerType.ArrowClosed, color };
        } else {
          const typeInfo = TYPE_MAP[actualType];
          if (typeInfo) {
            const sourceChar = json.nodes.find(n => n.id === actualSource);
            const srcGender = sourceChar?.data?.gender?.toUpperCase();
            if (hasTranslation) {
              label = arabicLabel;
            } else {
              label = (srcGender === 'FEMALE' && typeInfo.edgeLabelFemale) ? typeInfo.edgeLabelFemale : (typeInfo.edgeLabelMale || typeInfo.edgeLabel || typeInfo.label);
            }
            color = typeInfo.color || '#94a3b8';
            
            if (actualType === 'PARENT_MALE' || actualType === 'PARENT_FEMALE') {
              const childrenEdges = parentEdges[actualSource] || [];
              const middleIndex = Math.floor((childrenEdges.length - 1) / 2);
              if (childrenEdges[middleIndex] !== e.id) {
                label = '';
              }
            }
          } else {
            label = hasTranslation ? arabicLabel : actualType;
            if (e.category === 'DRAMATIC') {
              color = '#ec4899';
              sourceHandle = 'right';
              targetHandle = 'left';
            }
          }
          markerEnd = { type: MarkerType.ArrowClosed, color: color };
        }

        const nativeLabel = label;

        return {
          id: e.id,
          source: actualSource,
          target: actualTarget,
          sourceHandle,
          targetHandle,
          label: nativeLabel,
          type: 'customRelation',
          animated: e.category === 'DRAMATIC' || e.category === 'INFERRED' || e.category === 'INFERRED_CO_PARENT',
          zIndex: e.category === 'DRAMATIC' ? 1 : -1, // <-- ALL EDGES BEHIND NODES
          style: { 
            stroke: color, 
            strokeWidth: e.category === 'DRAMATIC' ? 2.5 : (e.category === 'INFERRED_CO_PARENT' ? 3 : (isM ? 2.5 : 2)), 
            strokeDasharray: (e.category === 'DRAMATIC' || e.category === 'INFERRED' || e.category === 'INFERRED_CO_PARENT' || actualType === 'CO_PARENT_MALE' || actualType === 'CO_PARENT_FEMALE' || (isM && viewMode === 'BIOLOGICAL')) ? '6 3' : 'none',
            opacity: 0.85
          },
          pathOptions: { borderRadius: 16 },
          labelStyle: { fill: color, fontWeight: 700, fontSize: 9, fontFamily: 'Outfit, Inter, sans-serif' },
          labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95, rx: 8, ry: 8, stroke: color, strokeWidth: 1.5 },
          labelBgPadding: [8, 5],
          labelShowBg: true,
          markerStart,
          markerEnd: (isS || isM) ? undefined : markerEnd,
          data: { category: e.category, relType: actualType, label: label, color: color, isSibling: isS, isMarriage: isM }
        };
      });

      rawGraphData.current = { nodes: mappedNodes, edges: mappedEdges };
      await debouncedProcessGraph(mappedNodes, mappedEdges);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [scenarioId, debouncedProcessGraph, viewMode]);

  useEffect(() => {
    if (rawGraphData.current) {
      const run = async () => {
        await debouncedProcessGraph(rawGraphData.current!.nodes, rawGraphData.current!.edges);
      };
      run();
    }
  }, [viewMode, debouncedProcessGraph]);

  const onNodeDragStop = useCallback(async (_event: any, node: Node) => {
    try {
      positionOverrides.current[node.id] = node.position;
      const { CharacterRepository } = await import('@scriptflow/database');
      const charRepo = new CharacterRepository();
      await charRepo.update(node.id, { graph_position: JSON.stringify(node.position) } as any);
      setNodes(nds => nds.map(n => n.id === node.id ? { ...n, position: node.position } : n));
    } catch (err) {
      console.error('Failed to save position:', err);
    }
  }, []);

  return { nodes, edges, setNodes, setEdges, isLoading, loadGraph, onNodeDragStop, rawGraphData, nasabMetadata };
}
