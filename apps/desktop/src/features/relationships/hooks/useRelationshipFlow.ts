import { useCallback } from 'react';
import { Node, Edge, NodeChange, EdgeChange, Connection, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

export interface UseRelationshipFlowOptions {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  rawGraphData: React.MutableRefObject<any>;
  setManualLinkPopup: (popup: any) => void;
  setManualLinkLabel: (label: string) => void;
  setPartner1: (id: string) => void;
  setPartner2: (id: string) => void;
  setRelType: (rel: string) => void;
  setShowAllRelTypes: (show: boolean) => void;
  setCoParentPopup: (popup: any) => void;
}

export function useRelationshipFlow({
  setNodes,
  setEdges,
  rawGraphData,
  setManualLinkPopup,
  setManualLinkLabel,
  setPartner1,
  setPartner2,
  setRelType,
  setShowAllRelTypes,
  setCoParentPopup,
}: UseRelationshipFlowOptions) {
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds: Node[]) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const { source, target } = params;
      if (!source || !target || source === target) return;
      const srcNode = rawGraphData.current?.nodes.find((n: any) => n.id === source);
      const tgtNode = rawGraphData.current?.nodes.find((n: any) => n.id === target);
      setManualLinkPopup({
        source,
        target,
        sourceName: srcNode?.data?.name || source,
        targetName: tgtNode?.data?.name || target,
      });
      setManualLinkLabel('');
    },
    [rawGraphData, setManualLinkPopup, setManualLinkLabel]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setPartner1(node.id);
      setPartner2('');
      setShowAllRelTypes(false);
    },
    [setPartner1, setPartner2, setShowAllRelTypes]
  );

  const onPaneClick = useCallback(() => {
    setPartner1('');
    setPartner2('');
    setRelType('');
    setShowAllRelTypes(false);
    setCoParentPopup(null);
  }, [setPartner1, setPartner2, setRelType, setShowAllRelTypes, setCoParentPopup]);

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (edge.data?.category === 'INFERRED_CO_PARENT') {
        setCoParentPopup({
          x: event?.clientX || window.innerWidth / 2,
          y: event?.clientY || window.innerHeight / 2,
          source: edge.source,
          target: edge.target,
          edgeId: edge.id,
        });
        return;
      }
      setCoParentPopup(null);
      setPartner1(edge.source);
      setPartner2(edge.target);
      setShowAllRelTypes(false);
      if (edge.data && edge.data.relType) {
        setRelType(edge.data.relType as string);
      }
    },
    [setCoParentPopup, setPartner1, setPartner2, setShowAllRelTypes, setRelType]
  );

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    onPaneClick,
    onEdgeClick,
  };
}
