import React from 'react';
import { Film, Users2, MapPin, StickyNote, CheckSquare } from 'lucide-react';
import SceneMetadataForm from './SceneMetadataForm';
import SceneTasksBoard from './SceneTasksBoard';

export interface SceneEditorSidebarProps {
  scene: any;
  setScene: React.Dispatch<React.SetStateAction<any>>;
  characters: any[];
  locations: any[];
  episodes: any[];
  onOpenCharModal: () => void;
  onOpenLocationModal: () => void;
}

export const SceneEditorSidebar: React.FC<SceneEditorSidebarProps> = ({
  scene,
  setScene,
  characters,
  locations,
  episodes,
  onOpenCharModal,
  onOpenLocationModal,
}) => {
  const [activeTab, setActiveTab] = React.useState<'metadata' | 'tasks'>('metadata');

  return (
    <div className="w-80 border-r border-border bg-card/50 flex flex-col h-full overflow-hidden shrink-0">
      {/* Sidebar Tabs */}
      <div className="flex items-center border-b border-border p-1 bg-secondary/20">
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'metadata' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:bg-secondary/40'
          }`}
        >
          <Film size={14} />
          بيانات المشهد
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'tasks' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:bg-secondary/40'
          }`}
        >
          <CheckSquare size={14} />
          المهام والملاحظات
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeTab === 'metadata' ? (
          <SceneMetadataForm
            scene={scene}
            setScene={setScene}
            characters={characters}
            locations={locations}
            episodes={episodes}
            onOpenCharModal={onOpenCharModal}
            onOpenLocationModal={onOpenLocationModal}
          />
        ) : (
          <SceneTasksBoard sceneId={scene.id} />
        )}
      </div>
    </div>
  );
};

export default SceneEditorSidebar;
