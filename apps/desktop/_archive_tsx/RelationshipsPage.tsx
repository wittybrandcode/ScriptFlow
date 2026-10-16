import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ReactFlow, Controls, Background, Panel, applyNodeChanges, applyEdgeChanges, Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, AlertCircle } from 'lucide-react';

import { useUIStore } from '../../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../../hooks/queries/useScenarios';
import { useCharactersQuery, useUpdateCharacterMutation } from '../../hooks/queries';

import CustomCharacterNode from '../../components/dashboard/CustomCharacterNode';
import UnionNode from '../../components/dashboard/UnionNode';
import RelationshipsToolbar from './components/RelationshipsToolbar';
import EdgeList from './components/EdgeList';
import CharacterRPGPanel from './components/modals/CharacterRPGPanel';
import ErrorModal from './components/modals/ErrorModal';
import CoParentPopup from './components/modals/CoParentPopup';
import ManualLinkPopup from './components/modals/ManualLinkPopup';

import { useRelationshipGraph } from './hooks/useRelationshipGraph';
import { useRelationshipActions } from './hooks/useRelationshipActions';
import { biologicalTypes, dramaticTypes } from './utils/typeRegistry';
import CustomRelationshipEdge from './components/CustomRelationshipEdge';

const nodeTypes = { customCharacter: CustomCharacterNode, union: UnionNode };
const edgeTypes = { customRelation: CustomRelationshipEdge };

export default function RelationshipsPage() {
  const { activeScenarioId, setTopBarConfig } = useUIStore();
  const { data: characters = [] } = useCharactersQuery(activeScenarioId);
  const updateCharacterMutation = useUpdateCharacterMutation();

  const [viewMode, setViewMode] = useState<'BIOLOGICAL' | 'DRAMATIC'>('BIOLOGICAL');
  const [partner1, setPartner1] = useState<string>('');
  const [partner2, setPartner2] = useState<string>('');
  const [relType, setRelType] = useState<string>('MARRIAGE');
  const [showAllRelTypes, setShowAllRelTypes] = useState<boolean>(false);
  const [addingPartner, setAddingPartner] = useState<boolean>(false);

  const [coParentPopup, setCoParentPopup] = useState<any>(null);
  const [errorModalMessage, setErrorModalMessage] = useState<any>(null);
  const [manualLinkPopup, setManualLinkPopup] = useState<any>(null);
  const [manualLinkLabel, setManualLinkLabel] = useState<string>('');

  useEffect(() => {
    setTopBarConfig({ pageName: 'خريطة العلاقات المتصلة' });
    return () => setTopBarConfig(null);
  }, [setTopBarConfig]);

  const {
    nodes, edges, setNodes, setEdges,
    isLoading, loadGraph, onNodeDragStop, rawGraphData, nasabMetadata
  } = useRelationshipGraph(activeScenarioId, viewMode);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const {
    addRelationship,
    addManualDramaticRelationship,
    removeRelationship,
    handleCoParentChoice: apiHandleCoParentChoice
  } = useRelationshipActions(activeScenarioId, rawGraphData, setErrorModalMessage, loadGraph);

  // Sync node selection visual state with partner1
  useEffect(() => {
    setNodes((nds: Node[]) => nds.map(n => ({
      ...n,
      selected: n.id === String(partner1)
    })));
  }, [partner1, setNodes]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds: Node[]) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds)), [setEdges]);

  const onConnect = useCallback((params: Connection) => {
    const { source, target } = params;
    if (!source || !target || source === target) return;
    const srcNode = rawGraphData.current?.nodes.find((n: any) => n.id === source);
    const tgtNode = rawGraphData.current?.nodes.find((n: any) => n.id === target);
    setManualLinkPopup({
      source, target,
      sourceName: srcNode?.data?.name || source,
      targetName: tgtNode?.data?.name || target
    });
    setManualLinkLabel('');
  }, [rawGraphData]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setPartner1(node.id);
    setPartner2(''); 
    setShowAllRelTypes(false); 
  }, []);

  const onPaneClick = useCallback(() => {
    setPartner1('');
    setPartner2('');
    setRelType('');
    setShowAllRelTypes(false);
    setCoParentPopup(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (edge.data?.category === 'INFERRED_CO_PARENT') {
      setCoParentPopup({
        x: event?.clientX || window.innerWidth / 2,
        y: event?.clientY || window.innerHeight / 2,
        source: edge.source,
        target: edge.target,
        edgeId: edge.id
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
  }, []);

  const handleAddPartner = async (isBypass = false, actionParams = null) => {
    setAddingPartner(true);
    const success = await addRelationship(partner1, partner2, relType, isBypass, actionParams);
    if (success) {
      setPartner1('');
      setPartner2('');
    }
    setAddingPartner(false);
  };

  const handleManualLink = async () => {
    if (!manualLinkPopup) return;
    setAddingPartner(true);
    const success = await addManualDramaticRelationship(manualLinkPopup.source, manualLinkPopup.target, manualLinkLabel);
    if (success) {
      setManualLinkPopup(null);
      setManualLinkLabel('');
    }
    setAddingPartner(false);
  };

  const handleRemoveEdge = async (edgeId: string) => {
    if (edgeId.startsWith('e_bio_s_')) {
      setErrorModalMessage({ message: 'لا يمكن حذف الأخوة المستنتجة بشكل مباشر. يرجى إزالة الأب أو الأم المشتركة من ملف الشخصية أو بحذف رابطهم.' });
      return;
    }
    if (edgeId.startsWith('e_union_')) {
      setErrorModalMessage({ message: 'لا يمكن حذف خط الارتباط المجمع المباشر. لحذف القرابة، احذف علاقة الزواج أولاً أو قم بفك ارتباط الابن من صفحة الشخصية.' });
      return;
    }
    if (!confirm('هل تريد بالتأكيد إزالة هذه العلاقة؟')) return;
    await removeRelationship(edgeId);
  };

  const handleCoParentChoice = async (choiceType: string) => {
    setAddingPartner(true);
    const success = await apiHandleCoParentChoice(coParentPopup, choiceType);
    if (success) setCoParentPopup(null);
    setAddingPartner(false);
  };

  const handleToggleDeceased = useCallback(async (characterId: string) => {
    try {
      const charNode = rawGraphData.current?.nodes.find((n: any) => n.id === String(characterId));
      const currentStatus = charNode?.data?.isDeceased ? 1 : 0;
      const newStatus = currentStatus ? 0 : 1;
      
      await updateCharacterMutation.mutateAsync({ id: characterId, data: { is_deceased: newStatus } });
      await loadGraph();
    } catch (err) {
      console.error('Failed to toggle deceased status:', err);
    }
  }, [rawGraphData, loadGraph, updateCharacterMutation]);

  const handleSaveRPG = useCallback(async (characterId: string, rpgData: any) => {
    try {
      const charNode = rawGraphData.current?.nodes.find((n: any) => n.id === String(characterId));
      const currentMeta = charNode?.data?.metadata ? JSON.parse(charNode.data.metadata) : {};
      
      const updatedMeta = {
        ...currentMeta,
        rpg: {
          traits: rpgData.traits,
          titles: rpgData.titles,
          class: rpgData.combatClass,
          isDisqualified: rpgData.isDisqualified,
          metadata: {
            ...(currentMeta.rpg?.metadata || {}),
            successionLaw: rpgData.successionLaw
          }
        }
      };
      
      await updateCharacterMutation.mutateAsync({ 
        id: characterId, 
        data: { metadata: JSON.stringify(updatedMeta) } 
      });
      
      await loadGraph();
    } catch (err) {
      console.error('Failed to save RPG data:', err);
    }
  }, [rawGraphData, loadGraph, updateCharacterMutation]);

  const p1Node = useMemo(() => nodes.find(n => n.id === partner1), [nodes, partner1]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground">جاري تحميل خريطة العلاقات والمعادلات الفقهية...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-background">
      <RelationshipsToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        characters={characters}
        partner1={partner1}
        setPartner1={setPartner1}
        partner2={partner2}
        setPartner2={setPartner2}
        relType={relType}
        setRelType={setRelType}
        showAllRelTypes={showAllRelTypes}
        setShowAllRelTypes={setShowAllRelTypes}
        addingPartner={addingPartner}
        handleAddPartner={handleAddPartner}
        nasabMetadata={nasabMetadata}
        biologicalTypes={biologicalTypes}
        dramaticTypes={dramaticTypes}
      />

      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onEdgeClick={onEdgeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          dir="rtl"
        >
          <Background color="#94a3b8" gap={24} size={1} />
          <Controls />
          <Panel position="top-right" className="bg-card/80 backdrop-blur border border-border p-2 rounded-xl text-xs shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">{viewMode === 'BIOLOGICAL' ? 'نظام الأنساب الفقهي (NASAB)' : 'شبكة التفاعلات الدرامية'}</span>
          </Panel>
        </ReactFlow>

        <EdgeList edges={edges} onRemoveEdge={handleRemoveEdge} />
      </div>

      {p1Node && p1Node.type === 'customCharacter' && (
        <CharacterRPGPanel
          node={p1Node}
          onClose={() => setPartner1('')}
          onSave={handleSaveRPG}
          onToggleDeceased={handleToggleDeceased}
        />
      )}

      {coParentPopup && (
        <CoParentPopup
          popup={coParentPopup}
          onChoice={handleCoParentChoice}
          onClose={() => setCoParentPopup(null)}
        />
      )}

      {manualLinkPopup && (
        <ManualLinkPopup
          popup={manualLinkPopup}
          label={manualLinkLabel}
          setLabel={setManualLinkLabel}
          onSubmit={handleManualLink}
          onClose={() => setManualLinkPopup(null)}
          loading={addingPartner}
        />
      )}

      {errorModalMessage && (
        <ErrorModal
          modalData={errorModalMessage}
          onClose={() => setErrorModalMessage(null)}
        />
      )}
    </div>
  );
}
