import React from 'react';
import { Undo2, FileDown } from 'lucide-react';
import { TIME_MAP } from '../../constants/sceneConstants';

export interface SceneEditorTopBarProps {
  scene: any;
  sceneStartPage: number;
  onNavigateBack: () => void;
  onExportPDF: () => void;
  isExporting?: boolean;
}

export const SceneEditorTopBar: React.FC<SceneEditorTopBarProps> = ({
  scene,
  sceneStartPage,
  onNavigateBack,
  onExportPDF,
  isExporting = false
}) => {
  return (
    <div className="bg-card border-b border-border p-3 shrink-0 flex items-center justify-between shadow-xs z-10">
      <div className="flex items-center gap-3">
        <button 
          onClick={onNavigateBack}
          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground transition-colors cursor-pointer"
          title="العودة"
        >
          <Undo2 size={18} />
        </button>
        <div>
          <h1 className="text-base font-black text-foreground flex items-center gap-2">
            مشهد {scene.scene_number || 1}: {scene.title || 'بدون عنوان'}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary font-bold text-muted-foreground">
              ص {sceneStartPage}
            </span>
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium">
            {scene.location_type === 'INT' ? 'داخلي' : 'خارجي'} / {scene.location_name || '...'} • {(TIME_MAP as any)[scene.time_of_day] || scene.time_of_day}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onExportPDF}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-lg font-bold text-xs hover:bg-secondary/80 transition-all cursor-pointer disabled:opacity-50"
        >
          <FileDown size={15} />
          {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
        </button>
      </div>
    </div>
  );
};

export default SceneEditorTopBar;
