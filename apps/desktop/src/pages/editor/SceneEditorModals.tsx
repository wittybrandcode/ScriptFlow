import React from 'react';
import type { IScene, ILocation, IScenario } from '@scriptflow/core';
import CharacterModal from '../../components/CharacterModal';
import LocationModal from '../../components/LocationModal';
import SceneRemindersModal from '../../components/editor/SceneRemindersModal';
import ExportSettingsModal from '../../components/pdf/ExportSettingsModal';

export interface SceneEditorModalsProps {
  // Character Modal
  showCharModal: boolean;
  setShowCharModal: (show: boolean) => void;
  setSelectedCharId: (id: string) => void;

  // Location Modal
  showLocationModal: boolean;
  setShowLocationModal: (show: boolean) => void;
  editingLocationId: string | null;
  locations: ILocation[];
  scene: Partial<IScene> & { location_id?: string | null; location_name?: string | null };
  setScene: React.Dispatch<React.SetStateAction<any>>;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved' | 'error') => void;

  // Reminders Modal
  showRemindersModal: boolean;
  setShowRemindersModal: (show: boolean) => void;
  sceneId?: string | number;

  // Export Modal
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  onExportWithSettings: (options?: any) => void;
  activeScenario?: Partial<IScenario> | null;
}

const SceneEditorModals: React.FC<SceneEditorModalsProps> = ({
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
          onCharacterAdded={(newChar: any) => {
            if (newChar?.id) {
              setSelectedCharId(String(newChar.id));
            }
          }}
          onCharacterUpdated={() => {}}
        />
      )}

      {showLocationModal && (
        <LocationModal
          location={editingLocationId ? locations.find(l => l.id === editingLocationId) || null : null}
          onClose={() => setShowLocationModal(false)}
          onLocationAdded={(newLoc: any) => {
            if (newLoc && newLoc.id) {
              setScene((prev: any) => ({ ...prev, location_id: newLoc.id, location_name: newLoc.name }));
              setSaveStatus('unsaved');
            }
          }}
          onLocationUpdated={(updatedLoc: any) => {
            if (updatedLoc && updatedLoc.id && scene.location_id === updatedLoc.id) {
              setScene((prev: any) => ({ ...prev, location_name: updatedLoc.name }));
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
        directorName={(activeScenario as any)?.director_name || ''}
        writerName={(activeScenario as any)?.writer_name || ''}
        sceneCount={1}
      />
    </>
  );
};

export default React.memo(SceneEditorModals);
