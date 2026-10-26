import React, { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

export interface SortableItemProps {
  id: string | number;
  children: React.ReactNode | ((props: { dragHandleProps: Record<string, any> }) => React.ReactNode);
  className?: string;
  handleClass?: string;
  disabled?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  virtualize?: boolean;
}

const SortableItem = memo(function SortableItem({
  id,
  children,
  className = '',
  handleClass = "ml-3",
  disabled = false,
  onMoveUp,
  onMoveDown,
  virtualize = false
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  const isFunction = typeof children === 'function';
  const virtualClass = virtualize && !isDragging ? 'virtualize-item' : '';

  return (
    <div ref={setNodeRef} style={style} className={`${className} ${virtualClass} flex items-center relative group`}>
      {!isFunction && !disabled && (
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${handleClass}`}>
          {onMoveUp && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
              className="p-1 hover:bg-primary/10 rounded text-muted-foreground/30 hover:text-primary transition-colors"
              title="نقل للأعلى"
            >
              <ChevronUp size={16} />
            </button>
          )}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-md text-muted-foreground/20 hover:text-foreground hover:bg-secondary transition-colors"
            title="اسحب لإعادة الترتيب"
          >
            <GripVertical size={18} />
          </div>
          {onMoveDown && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }} 
              className="p-1 hover:bg-primary/10 rounded text-muted-foreground/30 hover:text-primary transition-colors"
              title="نقل للأسفل"
            >
              <ChevronDown size={16} />
            </button>
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {typeof children === 'function' ? children({ dragHandleProps: { ...attributes, ...listeners } }) : children}
      </div>
    </div>
  );
});

export default SortableItem;
