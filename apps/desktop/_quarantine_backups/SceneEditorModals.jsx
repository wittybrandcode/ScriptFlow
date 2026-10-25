import React from 'react';
import CharacterModal from '../../components/CharacterModal';
import LocationModal from '../../components/LocationModal';
import SceneRemindersModal from '../../components/editor/SceneRemindersModal';
import ExportSettingsModal from '../../components/pdf/ExportSettingsModal';

const SceneEditorModals = ({
  // Character Modal
  showCharModal,
  setShowCharModal,
  setSelectedCharId,

  // Location Modal
  showLocationModal,
  setShowLocationModal,
  editingLocationId,
  locations,
  scene,
  setScene,
  setSaveStatus,

  // Reminders Modal
  showRemindersModal,
  setShowRemindersModal,
  sceneId,

  // Export Modal
  showExportModal,
  setShowExportModal,
  onExportWithSettings,
  activeScenario
}) => {
  return (
    <>
      {showCharModal && (
        <CharacterModal
          character={null}
          onClose={() => setShowCharModal(false)}
          onCharacterAdded={(newChar) => {
            setSelectedCharId(String(newChar.id));
          }}
        />
      )}

      {showLocationModal && (
        <LocationModal
          location={editingLocationId ? locations.find(l => l.id === editingLocationId) : null}
          onClose={() => setShowLocationModal(false)}
          onLocationAdded={(newLoc) => {
            if (newLoc && newLoc.id) {
              setScene(prev => ({...prev, location_id: newLoc.id, location_name: newLoc.name}));
              setSaveStatus('unsaved');
            }
          }}
          onLocationUpdated={(updatedLoc) => {
            if (updatedLoc && updatedLoc.id && scene.location_id === updatedLoc.id) {
              setScene(prev => ({...prev, location_name: updatedLoc.name}));
              setSaveStatus('unsaved');
            }
          }}
        />
      )}

      {showRemindersModal && (
        <SceneRemindersModal
          sceneId={sceneId}
          onClose={() => setShowRemindersModal(false)}
        />
      )}

      <ExportSettingsModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={onExportWithSettings}
        scenarioTitle={activeScenario?.title || ''}
        directorName={activeScenario?.director_name || ''}
        writerName={activeScenario?.writer_name || ''}
        sceneCount={1}
      />
    </>
  );
};

export default React.memo(SceneEditorModals);
