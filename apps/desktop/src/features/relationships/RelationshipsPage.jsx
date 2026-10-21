import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ReactFlow, Controls, Background, Panel, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, AlertCircle } from 'lucide-react';

import { useUIStore } from '../../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../../hooks/queries/useScenarios';
import { useCharactersQuery, useUpdateCharacterMutation } from '../../hooks/queries';
import { useToast } from '../../hooks/useToast';
import ConfirmModal from '../../components/common/ConfirmModal';

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
  const { activeScenarioId } = useUIStore();
  const { setTopBarConfig } = useUIStore();
  const { data: characters = [] } = useCharactersQuery(activeScenarioId);
  const updateCharacterMutation = useUpdateCharacterMutation();

  const [viewMode, setViewMode] = useState('BIOLOGICAL'); // 'BIOLOGICAL' or 'DRAMATIC'
  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [relType, setRelType] = useState('MARRIAGE');
  const [showAllRelTypes, setShowAllRelTypes] = useState(false);
  const [addingPartner, setAddingPartner] = useState(false);

  const [coParentPopup, setCoParentPopup] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState(null);
  const [manualLinkPopup, setManualLinkPopup] = useState(null);
  const [manualLinkLabel, setManualLinkLabel] = useState('');
  const [edgeToRemove, setEdgeToRemove] = useState(null);
  const { showToast } = useToast();

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
    setNodes(nds => nds.map(n => ({
      ...n,
      selected: n.id === String(partner1)
    })));
  }, [partner1, setNodes]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);

  const onConnect = useCallback((params) => {
    const { source, target } = params;
    if (source === target) return;
    const srcNode = rawGraphData.current?.nodes.find(n => n.id === source);
    const tgtNode = rawGraphData.current?.nodes.find(n => n.id === target);
    setManualLinkPopup({
      source, target,
      sourceName: srcNode?.data?.name || source,
      targetName: tgtNode?.data?.name || target
    });
    setManualLinkLabel('');
  }, [rawGraphData]);

  const onNodeClick = useCallback((event, node) => {
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

  const onEdgeClick = useCallback((event, edge) => {
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
      setRelType(edge.data.relType);
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
    setAddingPartner(true);
    const success = await addManualDramaticRelationship(manualLinkPopup.source, manualLinkPopup.target, manualLinkLabel);
    if (success) {
      setManualLinkPopup(null);
      setManualLinkLabel('');
    }
    setAddingPartner(false);
  };

  const handleRemoveEdge = async (edgeId) => {
    if (edgeId.startsWith('e_bio_s_')) {
      setErrorModalMessage({ message: 'لا يمكن حذف الأخوة المستنتجة بشكل مباشر. يرجى إزالة الأب أو الأم المشتركة من ملف الشخصية أو بحذف رابطهم.' });
      return;
    }
    if (edgeId.startsWith('e_union_')) {
      setErrorModalMessage({ message: 'لا يمكن حذف خط الارتباط المجمع المباشر. لحذف القرابة، احذف علاقة الزواج أولاً أو قم بفك ارتباط الابن من صفحة الشخصية.' });
      return;
    }
    setEdgeToRemove(edgeId);
  };

  const confirmRemoveEdge = async () => {
    if (!edgeToRemove) return;
    try {
      await removeRelationship(edgeToRemove);
      showToast('تمت إزالة العلاقة بنجاح', 'info');
    } catch (err) {
      showToast('فشل حذف العلاقة', 'error');
    } finally {
      setEdgeToRemove(null);
    }
  };



  const handleCoParentChoice = async (choiceType) => {
    setAddingPartner(true);
    const success = await apiHandleCoParentChoice(coParentPopup, choiceType);
    if (success) setCoParentPopup(null);
    setAddingPartner(false);
  };

  // ═══ Toggle Deceased Status (via API → reload graph) ═══
  const handleToggleDeceased = useCallback(async (characterId) => {
    try {
      const charNode = rawGraphData.current?.nodes.find(n => n.id === String(characterId));
      const currentStatus = charNode?.data?.isDeceased ? 1 : 0;
      const newStatus = currentStatus ? 0 : 1;
      
      await updateCharacterMutation.mutateAsync({ id: characterId, data: { is_deceased: newStatus } });
      
      await loadGraph();
    } catch (err) {
      console.error('Failed to toggle deceased status:', err);
    }
  }, [activeScenarioId, rawGraphData, loadGraph, updateCharacterMutation]);

  // ═══ Save RPG Data (via API → reload graph) ═══
  const handleSaveRPG = useCallback(async (characterId, rpgData) => {
    try {
      const charNode = rawGraphData.current?.nodes.find(n => n.id === String(characterId));
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
        data: {
          metadata: JSON.stringify(updatedMeta)
        }
      });

      await loadGraph();
    } catch (err) {
      console.error('Failed to save RPG data:', err);
    }
  }, [rawGraphData, updateCharacterMutation, loadGraph]);

  // ═══ Enhanced Nodes — inject action handlers into each node's data ═══
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => {
      if (node.type !== 'customCharacter') return node;
      return {
        ...node,
        data: {
          ...node.data,
          onToggleDeceased: handleToggleDeceased
        }
      };
    });
  }, [nodes, handleToggleDeceased]);

  if (!activeScenarioId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <AlertCircle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">لا يوجد سيناريو نشط</h2>
        <p className="text-muted-foreground">يرجى اختيار سيناريو لعرض العلاقات.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden bg-background" style={{ height: '100%' }}>
      {/* ⚠️ NASAB WARNINGS BANNER & CONSISTENCY BADGE */}
      {nasabMetadata?.warnings && nasabMetadata.warnings.length > 0 ? (
        <div className="shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 z-10 flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-400 mb-1">
              تنبيهات محرك نسب للقرابة والكنى ({nasabMetadata.warnings.length}):
            </h4>
            <ul className="text-[11px] text-amber-300/90 list-disc list-inside space-y-1">
              {nasabMetadata.warnings.map((warning, idx) => (
                <li key={idx} dir="rtl">{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="shrink-0 bg-emerald-500/5 border-b border-emerald-500/10 px-4 py-2 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400/90 font-bold">شجرة النسب متناسقة تماماً وخالية من التعارضات</span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black tracking-wide uppercase">
            NASAB SECURE
          </span>
        </div>
      )}

      {/* ═══ Top Toolbar ═══ */}
      <RelationshipsToolbar 
        viewMode={viewMode} setViewMode={setViewMode}
        characters={characters} rawEdges={rawGraphData.current?.edges || []}
        partner1={partner1} setPartner1={setPartner1}
        partner2={partner2} setPartner2={setPartner2}
        relType={relType} setRelType={setRelType}
        showAllRelTypes={showAllRelTypes} setShowAllRelTypes={setShowAllRelTypes}
        onPartner1Change={(val) => { setPartner1(val); setPartner2(''); setShowAllRelTypes(false); }}
        handleAddPartner={handleAddPartner}
        handleRemoveEdge={handleRemoveEdge}
        handleExportGedcom={async () => {
          try {
            const { GedcomEngine } = await import('nasab');
            
            const nasabNodes = (rawGraphData.current?.nodes || []).map(n => ({
              id: String(n.id),
              name: n.data.name,
              gender: n.data.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
              isDeceased: Boolean(n.data.isDeceased),
              birthDate: n.data.birth_date || undefined,
              deathDate: n.data.death_date || undefined
            }));
            
            const nasabEdges = (rawGraphData.current?.edges || [])
              .filter(e => e.category !== 'INFERRED')
              .map(e => ({
                sourceId: String(e.source),
                targetId: String(e.target),
                type: e.type
              }));
              
            const gedcomData = GedcomEngine.generate(nasabNodes, nasabEdges);
            const blob = new Blob([gedcomData], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scriptflow_relationships_${activeScenarioId}.ged`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error('Failed to export GEDCOM:', e);
            showToast('حدث خطأ أثناء تصدير ملف GEDCOM: ' + e.message, 'error');
          }
        }}
        handleImportGedcom={async (file) => {
          try {
            const text = await file.text();
            const { GedcomEngine } = await import('nasab');
            const { nodes, edges } = GedcomEngine.parse(text);
            
            const { CharacterRepository, CharacterRelationshipRepository } = await import('@scriptflow/database');
            const { generateId } = await import('@scriptflow/core');
            const charRepo = new CharacterRepository();
            const relRepo = new CharacterRelationshipRepository();
            
            const idMap = {};
            
            for (const node of nodes) {
              const newCharId = generateId('char');
              idMap[node.id] = newCharId;
              
              await charRepo.insert({
                id: newCharId,
                scenario_id: activeScenarioId,
                name: node.name || 'مجهول',
                gender: node.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
                is_deceased: node.isDeceased ? 1 : 0,
                birth_date: node.birthDate || null,
                death_date: node.deathDate || null,
                graph_position: JSON.stringify({ x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 })
              });
            }
            
            for (const edge of edges) {
              const srcId = idMap[edge.sourceId];
              const tgtId = idMap[edge.targetId];
              if (srcId && tgtId) {
                await relRepo.insert({
                  id: generateId('rel'),
                  scenario_id: activeScenarioId,
                  character_id: srcId,
                  partner_id: tgtId,
                  relationship_type: edge.type,
                  relationship_category: 'BIOLOGICAL'
                });
              }
            }
            
            await loadGraph();
            showToast(`تم استيراد ${nodes.length} شخصية و ${edges.length} علاقة بنجاح!`, 'success');
          } catch (e) {
            console.error('Failed to import GEDCOM:', e);
            showToast('حدث خطأ أثناء استيراد ملف GEDCOM: ' + e.message, 'error');
          }
        }}
        addingPartner={addingPartner}
      />

      {/* ═══ Edge List & Filter Row ═══ */}
      <div className="shrink-0 bg-muted/20 border-b border-border px-4 py-2 z-10">
        <div className="flex items-center gap-3">
          <EdgeList 
            edges={rawGraphData.current?.edges || []}
            rawNodes={rawGraphData.current?.nodes || []}
            partner1={partner1}
            onEdgeClick={(edge) => onEdgeClick(null, edge)}
            handleRemoveEdge={handleRemoveEdge}
          />
        </div>
      </div>

      {/* ═══ Canvas & Sidebar Area ═══ */}
      <div className="flex-1 relative min-h-0 flex flex-row" style={{ minHeight: 0 }}>
        
        {/* Main Canvas Area */}
        <div className={`flex-1 relative bg-[#f8fafc] h-full z-10 transition-all duration-300`}>
          <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            {isLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <Loader2 size={48} className="animate-spin text-indigo-500" />
              </div>
            )}
            <ReactFlow
              nodes={enhancedNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              nodesDraggable={viewMode !== 'BIOLOGICAL'}
              fitView
              attributionPosition="bottom-left"
              style={{ width: '100%', height: '100%' }}
            >
              <Background color="#cbd5e1" gap={24} size={1.5} />
              <Controls className="bg-white border-gray-200 fill-gray-600 shadow-md rounded-lg" />
              <Panel position="top-right" className="bg-white/90 backdrop-blur border border-gray-200 p-2 rounded-lg text-[10px] font-bold shadow-sm text-gray-600">
                {viewMode === 'BIOLOGICAL' ? '⚙ ترتيب هرمي تلقائي' : '✋ خريطة حرة — اسحب بحرية'}
              </Panel>
              <Panel position="bottom-right" className="bg-white/80 backdrop-blur border border-gray-200 px-2.5 py-1.5 rounded-lg text-[9px] font-bold text-gray-400 flex items-center gap-1.5 shadow-sm">
                🧬 مدعوم بمكتبة <span className="text-emerald-600 font-black">نَسَب</span> <span className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded text-[8px] font-mono">v1.2.0</span>
              </Panel>
            </ReactFlow>

            <CoParentPopup 
              coParentPopup={coParentPopup}
              onClose={() => setCoParentPopup(null)}
              onChoice={handleCoParentChoice}
              addingPartner={addingPartner}
            />
          </div>
        </div>

        {/* Character RPG Panel Sidebar Area */}
        {partner1 && (
          <div className="w-[360px] lg:w-[400px] bg-white shrink-0 h-full relative z-20 shadow-[-10px_0_20px_-5px_rgba(0,0,0,0.05)] overflow-hidden border-r border-gray-100">
            <CharacterRPGPanel 
              character={enhancedNodes.find(n => String(n.id) === String(partner1))?.data}
              characters={rawGraphData.current?.nodes.map(n => n.data) || []}
              edges={edges}
              warnings={nasabMetadata?.warnings || []}
              onClose={() => { setPartner1(''); }}
              onAddRelationship={async (sourceId, targetId, relType) => {
                const isDramatic = dramaticTypes.some(t => t.id === relType);
                if (isDramatic) {
                  return await addManualDramaticRelationship(sourceId, targetId, relType);
                } else {
                  return await addRelationship(sourceId, targetId, relType);
                }
              }}
              onRemoveRelationship={async (edgeId) => {
                return await removeRelationship(edgeId);
              }}
            />
          </div>
        )}
      </div>

      <ErrorModal 
        errorModalMessage={errorModalMessage}
        onClose={() => setErrorModalMessage(null)}
        onBypass={(params) => handleAddPartner(true, params)}
        addingPartner={addingPartner}
      />

      <ManualLinkPopup 
        manualLinkPopup={manualLinkPopup}
        manualLinkLabel={manualLinkLabel}
        setManualLinkLabel={setManualLinkLabel}
        onClose={() => setManualLinkPopup(null)}
        onLink={handleManualLink}
        addingPartner={addingPartner}
      />

      <ConfirmModal
        isOpen={!!edgeToRemove}
        onClose={() => setEdgeToRemove(null)}
        onConfirm={confirmRemoveEdge}
        title="إزالة العلاقة"
        message="هل أنت متأكد من رغبتك في إزالة هذه العلاقة بين الشخصيتين؟"
        confirmText="تأكيد الإزالة"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}
