import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CharacterModal from '../components/CharacterModal'
import LocationModal from '../components/LocationModal'
import PaperEditor from '../components/editor/paper/PaperEditor'
import SceneEditorTopBar from '../components/editor/SceneEditorTopBar'
import SceneEditorSidebar from '../components/editor/SceneEditorSidebar'
import { useSceneEditorState } from '../components/editor/useSceneEditorState'
import { useToast } from '../hooks/useToast'

export default function SceneEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    activeScenario,
    sceneStartPage,
    characters,
    locations,
    episodes,
    scene,
    setScene,
    blocks,
    setBlocks,
    loaded
  } = useSceneEditorState({ id, showToast });

  const [showCharModal, setShowCharModal] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { exportToPDF } = await import('../utils/exportPDF');
      await exportToPDF({
        scenario: activeScenario,
        scenes: [{ ...scene, blocks }],
        characters,
        episodes,
        pageNumbering: []
      }, {
        exportType: 'SINGLE_PDF',
        exportLevel: 'SCENE',
        targetEntityId: id,
        scenarioName: activeScenario?.title || 'مشروع بدون عنوان'
      });
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 h-full">
        <div className="flex items-center gap-3 text-muted-foreground font-bold">
          جاري تحميل المشهد...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* 1. Dynamic TopBar */}
      <SceneEditorTopBar 
        scene={scene}
        sceneStartPage={sceneStartPage}
        onNavigateBack={() => navigate(-1)}
        onExportPDF={handleExportPDF}
        isExporting={exporting}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Paper Editor Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <PaperEditor 
            blocks={blocks}
            setBlocks={setBlocks}
            characters={characters}
            scene={scene}
            startPageNumber={sceneStartPage}
            scenarioName={activeScenario?.title || 'مشروع بدون عنوان'}
            episodes={episodes}
          />
        </div>

        {/* Modular Right Sidebar */}
        <SceneEditorSidebar 
          scene={scene}
          setScene={setScene}
          characters={characters}
          locations={locations}
          episodes={episodes}
          onOpenCharModal={() => setShowCharModal(true)}
          onOpenLocationModal={() => setShowLocationModal(true)}
        />
      </div>

      {showCharModal && (
        <CharacterModal
          onClose={() => setShowCharModal(false)}
          onCharacterAdded={() => {}}
        />
      )}

      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onLocationAdded={() => {}}
        />
      )}
    </div>
  );
}
