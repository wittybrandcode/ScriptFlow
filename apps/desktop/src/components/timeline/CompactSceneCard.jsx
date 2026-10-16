import React, { useState, memo, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MapPin, GripVertical, Eye } from 'lucide-react';
import ScenePreviewModal from './ScenePreviewModal';

const CompactSceneCard = memo(function CompactSceneCard({ scene, isOverlay, virtualize = false }) {
  const [showPreview, setShowPreview] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: scene.id.toString(),
    data: {
      type: 'Scene',
      scene
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const isInt = scene.location_type === 'INT';
  const duration = useMemo(() => {
    let dur = scene.estimated_duration;
    if (!dur || dur <= 0) {
      if (scene.page_count) {
        dur = scene.page_count * 60;
      } else if (scene.line_count) {
        dur = Math.ceil(scene.line_count / 8);
      } else if (scene.content) {
        const lines = scene.content.split(/\r?\n/).length;
        dur = Math.ceil(lines / 8);
      } else if (scene.description) {
        const lines = scene.description.split(/\r?\n/).length;
        dur = Math.max(1, Math.ceil(lines / 8));
      } else {
        dur = 1;
      }
    }
    return dur;
  }, [scene]);
  const virtualClass = virtualize && !isDragging && !isOverlay ? 'virtualize-compact' : '';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes} 
        {...listeners}
        className={`group relative flex items-stretch gap-2 bg-card border border-border/50 rounded-lg p-2 hover:border-primary/30 transition-colors shadow-sm ${
          isOverlay ? 'shadow-xl border-primary/50 cursor-grabbing' : 'cursor-grab active:cursor-grabbing'
        } ${virtualClass}`}
      >
        {/* Drag Handle */}
        <div 
          className="flex items-center justify-center text-muted-foreground/50 hover:text-foreground shrink-0 w-4"
        >
          <GripVertical size={14} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Header: Number, INT/EXT, Title */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-none ${
              isInt ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
            }`}>
              {isInt ? 'INT' : 'EXT'}
            </span>
            <span className="text-[11px] font-black text-foreground truncate flex-1">
              {scene.scene_number}. {scene.title || 'بدون عنوان'}
            </span>
          </div>

          {/* Location & Time */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-muted-foreground min-w-0 flex-1">
              <MapPin size={10} className="shrink-0" />
              <span className="text-[9px] font-bold truncate">
                {scene.location_name || 'بدون موقع'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground shrink-0 bg-secondary/50 px-1.5 py-0.5 rounded ml-2">
              <Clock size={10} />
              <span className="text-[9px] font-bold">{duration}m</span>
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex flex-col items-center justify-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowPreview(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="معاينة المشهد"
          >
            <Eye size={13} />
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <ScenePreviewModal 
          sceneId={scene.id} 
          onClose={() => setShowPreview(false)} 
        />
      )}
    </>
  );
})

export default CompactSceneCard;
