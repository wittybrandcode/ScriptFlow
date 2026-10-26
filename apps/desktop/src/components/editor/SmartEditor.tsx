import React, { useRef, useEffect, useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from '../SortableItem';
import { 
  GripVertical, 
  Trash2, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  EyeOff, 
  Volume2, 
  Camera, 
  AlertCircle, 
  Scissors, 
  AlignLeft, 
  MonitorPlay, 
  Users2, 
  Timer 
} from 'lucide-react';

import ToneSelector from './ToneSelector';
import RichTextEditor from '../ui/RichTextEditor';

export type BlockType = 'ACTION' | 'DIALOGUE' | 'AUDIO' | 'SHOT' | 'TEXT' | 'DIRECTOR_NOTE' | 'TRANSITION';

export interface SmartBlock {
  id: string | number;
  type: BlockType;
  content: string;
  sort_order: number;
  character_id?: string | number | null;
  metadata?: string;
  isNew?: boolean;
  [key: string]: any;
}

export interface CharacterItem {
  id: string | number;
  name: string;
  [key: string]: any;
}

export interface SmartEditorProps {
  blocks: any[];
  setBlocks: React.Dispatch<React.SetStateAction<any[]>>;
  onAddBlock: (index: number, type?: any, characterId?: any) => void;
  onUpdateBlock: (id: any, updates: any) => void;
  onDeleteBlock: (id: any) => void;
  onReorderBlocks?: (blocks: any[]) => void;
  characters?: CharacterItem[];
  onShowCharModal?: () => void;
  onOpenReminders?: () => void;
  onQuickAddCharacter?: (name: string) => any;
  scene?: {
    id?: string | number;
    estimated_duration?: number;
    [key: string]: any;
  };
  onSceneChange?: (field: string, value: any) => void;
  activeBlockId?: string | number | null;
  setActiveBlockId: (id: string | null) => void;
}

// القيم الافتراضية لمدة كل نوع كتلة (بالدقائق)
const DEFAULT_DURATIONS: Record<string, number> = {
  DIALOGUE: 0.5,
  ACTION: 0.5,
  AUDIO: 0.25,
  SHOT: 0.1,
  TEXT: 0.15,
  DIRECTOR_NOTE: 0,
  TRANSITION: 0.05
};

// ثابت الفجوة بين أرقام الترتيب - كبير بما يكفي لـ 16 عملية سحب متتالية قبل إعادة التوازن
const SORT_GAP = 65536;

// قراءة مدة كتلة من metadata
const getBlockDuration = (block: any): number => {
  try {
    const meta = JSON.parse(block.metadata || '{}');
    return meta.duration !== undefined ? meta.duration : (DEFAULT_DURATIONS[block.type] ?? 0);
  } catch (e) {
    console.warn('Failed to parse block duration metadata', e);
    return DEFAULT_DURATIONS[block.type] ?? 0;
  }
};

interface BlockDividerProps {
  index?: number;
  onAddBlock: (type: BlockType) => void;
}

function BlockDivider({ onAddBlock }: BlockDividerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative group/divider py-1.5 my-[-6px] z-10 transition-all flex justify-center items-center select-none">
      {/* Horizontal line */}
      <div className="absolute inset-x-0 h-[1px] bg-border/40 group-hover/divider:bg-primary/20 pointer-events-none" />
      
      {isOpen ? (
        <div className="relative flex items-center gap-1 p-1 bg-card border border-border shadow-lg rounded-full animate-in zoom-in-95 duration-100 z-20">
          <button 
            type="button"
            onClick={() => { onAddBlock('ACTION'); setIsOpen(false); }}
            className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground text-[10px] flex items-center justify-center font-bold transition-colors"
            title="إضافة حدث (Action)"
          >
            <AlignLeft size={13} />
          </button>
          <button 
            type="button"
            onClick={() => { onAddBlock('DIALOGUE'); setIsOpen(false); }}
            className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground text-[10px] flex items-center justify-center font-bold transition-colors"
            title="إضافة حوار (Dialogue)"
          >
            <Users2 size={13} />
          </button>
          <button 
            type="button"
            onClick={() => { onAddBlock('SHOT'); setIsOpen(false); }}
            className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground text-[10px] flex items-center justify-center font-bold transition-colors"
            title="إضافة توجيه كاميرا (Shot)"
          >
            <Camera size={13} />
          </button>
          <button 
            type="button"
            onClick={() => { onAddBlock('AUDIO'); setIsOpen(false); }}
            className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground text-[10px] flex items-center justify-center font-bold transition-colors"
            title="إضافة مؤثر صوتي (Audio)"
          >
            <Volume2 size={13} />
          </button>
          <button 
            type="button"
            onClick={() => { onAddBlock('TEXT'); setIsOpen(false); }}
            className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground text-[10px] flex items-center justify-center font-bold transition-colors"
            title="إضافة نص (Text)"
          >
            <MonitorPlay size={13} />
          </button>
          <button 
            type="button"
            onClick={() => { onAddBlock('DIRECTOR_NOTE'); setIsOpen(false); }}
            className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground text-[10px] flex items-center justify-center font-bold transition-colors"
            title="ملاحظة إخراجية (Director Note)"
          >
            <AlertCircle size={13} />
          </button>
          <button 
            type="button"
            onClick={() => { onAddBlock('TRANSITION'); setIsOpen(false); }}
            className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground text-[10px] flex items-center justify-center font-bold transition-colors"
            title="إضافة انتقال (Transition)"
          >
            <Scissors size={13} />
          </button>
          <div className="w-[1px] h-3 bg-border mx-0.5" />
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-secondary rounded-full text-muted-foreground/60 hover:text-foreground transition-colors"
            title="إغلاق"
          >
            <Plus size={13} className="rotate-45" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative z-10 w-5 h-5 rounded-full border border-border bg-card flex items-center justify-center shadow-sm text-muted-foreground hover:text-primary hover:border-primary/50 opacity-0 group-hover/divider:opacity-100 transition-all transform scale-75 group-hover/divider:scale-100"
          title="إضافة كتلة هنا"
        >
          <Plus size={10} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

export default function SmartEditor({
  blocks,
  setBlocks,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlocks,
  characters = [],
  scene,
  onSceneChange,
  activeBlockId,
  setActiveBlockId
}: SmartEditorProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [expandedShots, setExpandedShots] = useState<Record<string, boolean>>({});
  const activeBlock = blocks.find(b => b.id === activeId);
  const containerRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // تحديث مدة كتلة في metadata
  const updateBlockDuration = (blockId: string | number, newDuration: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    let meta: Record<string, any> = {};
    try { 
      meta = JSON.parse(block.metadata || '{}'); 
    } catch(e) {
      console.warn('Failed to parse block metadata for duration update', e);
    }
    const newMeta = JSON.stringify({ ...meta, duration: newDuration });
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, metadata: newMeta } : b));
    onUpdateBlock(blockId, { metadata: newMeta });
  };

  // حساب المجموع الإجمالي وتحديث estimated_duration تلقائياً
  const totalDuration = blocks.reduce((sum, b) => sum + getBlockDuration(b), 0);
  const totalRounded = Math.round(totalDuration * 100) / 100;

  useEffect(() => {
    if (scene && onSceneChange && blocks.length > 0 && totalRounded !== scene.estimated_duration) {
      onSceneChange('estimated_duration', totalRounded || 1);
    }
  }, [totalRounded]);

  // Auto-resize textareas on mount and data change
  useEffect(() => {
    if (!containerRef.current) return;
    const textareas = containerRef.current.querySelectorAll('.auto-resize-textarea');
    textareas.forEach(t => {
      const el = t as HTMLElement;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [blocks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      
      let newSortOrder = 0.0;
      if (newIndex === 0) {
        newSortOrder = blocks[0].sort_order - SORT_GAP;
      } else if (newIndex === blocks.length - 1) {
        newSortOrder = blocks[blocks.length - 1].sort_order + SORT_GAP;
      } else {
        const prevIndex = newIndex < oldIndex ? newIndex - 1 : newIndex;
        const nextIndex = newIndex < oldIndex ? newIndex : newIndex + 1;
        newSortOrder = (blocks[prevIndex].sort_order + blocks[nextIndex].sort_order) / 2.0;
      }

      const movedBlock = { ...blocks[oldIndex], sort_order: newSortOrder };
      let newBlocks = arrayMove(blocks, oldIndex, newIndex);
      newBlocks[newIndex] = movedBlock;
      newBlocks.sort((a, b) => a.sort_order - b.sort_order);
      
      setBlocks(newBlocks);
      onUpdateBlock(movedBlock.id, { sort_order: newSortOrder });

      if (newIndex > 0 && newIndex < newBlocks.length - 1) {
        if (Math.abs(newBlocks[newIndex + 1].sort_order - newBlocks[newIndex - 1].sort_order) < 1) {
          if (onReorderBlocks) onReorderBlocks(newBlocks);
        }
      }
    }
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newIndex = index - 1;
      let newSortOrder = 0.0;
      if (newIndex === 0) {
        newSortOrder = blocks[0].sort_order - SORT_GAP;
      } else {
        newSortOrder = (blocks[newIndex - 1].sort_order + blocks[newIndex].sort_order) / 2.0;
      }
      
      const movedBlock = { ...blocks[index], sort_order: newSortOrder };
      let newBlocks = arrayMove(blocks, index, newIndex);
      newBlocks[newIndex] = movedBlock;
      newBlocks.sort((a, b) => a.sort_order - b.sort_order);
      
      setBlocks(newBlocks);
      onUpdateBlock(movedBlock.id, { sort_order: newSortOrder });
      
      if (newIndex > 0 && newIndex < newBlocks.length - 1) {
        if (Math.abs(newBlocks[newIndex + 1].sort_order - newBlocks[newIndex - 1].sort_order) < 1) {
          if (onReorderBlocks) onReorderBlocks(newBlocks);
        }
      }
      
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newIndex = index + 1;
      let newSortOrder = 0.0;
      if (newIndex === blocks.length - 1) {
        newSortOrder = blocks[blocks.length - 1].sort_order + SORT_GAP;
      } else {
        newSortOrder = (blocks[newIndex].sort_order + blocks[newIndex + 1].sort_order) / 2.0;
      }
      
      const movedBlock = { ...blocks[index], sort_order: newSortOrder };
      let newBlocks = arrayMove(blocks, index, newIndex);
      newBlocks[newIndex] = movedBlock;
      newBlocks.sort((a, b) => a.sort_order - b.sort_order);
      
      setBlocks(newBlocks);
      onUpdateBlock(movedBlock.id, { sort_order: newSortOrder });

      if (newIndex > 0 && newIndex < newBlocks.length - 1) {
        if (Math.abs(newBlocks[newIndex + 1].sort_order - newBlocks[newIndex - 1].sort_order) < 1) {
          if (onReorderBlocks) onReorderBlocks(newBlocks);
        }
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const getBlockStyle = (type: string) => {
    switch(type) {
      case 'ACTION': return 'w-full text-right font-normal text-foreground';
      case 'AUDIO': return 'w-full text-right font-bold text-foreground/80 uppercase italic tracking-wide';
      case 'TEXT': return 'w-[80%] mx-auto text-center font-mono text-foreground/80 uppercase tracking-widest';
      case 'DIRECTOR_NOTE': return 'w-[80%] mx-auto text-center font-medium text-foreground/60 italic';
      case 'TRANSITION': return 'w-full text-left font-black uppercase text-foreground/80';
      case 'SHOT': return 'w-[80%] mr-auto text-right font-black uppercase text-foreground/80 border-b border-border/80';
      default: return 'w-full text-right';
    }
  };

  const getPlaceholder = (type: string) => {
    switch(type) {
      case 'ACTION': return 'وصف المشهد والحدث...';
      case 'AUDIO': return '[ مؤثر صوتي أو موسيقى ]...';
      case 'TEXT': return 'نص يظهر على الشاشة...';
      case 'DIRECTOR_NOTE': return 'ملاحظة إخراجية...';
      case 'TRANSITION': return 'انتقال...';
      case 'SHOT': return 'توجيه كاميرا...';
      default: return '...';
    }
  };

  const getBlockTypeIcon = (type: string) => {
    switch(type) {
      case 'ACTION': return <AlignLeft size={12} strokeWidth={2.5} className="text-muted-foreground" />;
      case 'DIALOGUE': return <Users2 size={12} strokeWidth={2.5} className="text-muted-foreground" />;
      case 'SHOT': return <Camera size={12} strokeWidth={2.5} className="text-muted-foreground" />;
      case 'AUDIO': return <Volume2 size={12} strokeWidth={2.5} className="text-muted-foreground" />;
      case 'TEXT': return <MonitorPlay size={12} strokeWidth={2.5} className="text-muted-foreground" />;
      case 'DIRECTOR_NOTE': return <AlertCircle size={12} strokeWidth={2.5} className="text-muted-foreground" />;
      case 'TRANSITION': return <Scissors size={12} strokeWidth={2.5} className="text-muted-foreground" />;
      default: return null;
    }
  };

  const getBlockTypeLabel = (type: string) => {
    switch(type) {
      case 'ACTION': return 'حدث';
      case 'DIALOGUE': return 'حوار';
      case 'SHOT': return 'توجيه كاميرا';
      case 'AUDIO': return 'مؤثر صوتي';
      case 'TEXT': return 'نص على الشاشة';
      case 'DIRECTOR_NOTE': return 'ملاحظة إخراجية';
      case 'TRANSITION': return 'انتقال';
      default: return 'كتلة';
    }
  };

  const presentCharacterIds = Array.from(new Set(blocks.filter(b => b.type === 'DIALOGUE' && b.character_id).map(b => String(b.character_id))));
  const presentCharacters = presentCharacterIds.map(id => characters.find(c => String(c.id) === id)).filter(Boolean) as CharacterItem[];

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col min-h-full space-y-[10px] w-full relative pb-32 pt-2 px-2"
    >
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd} 
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.length === 0 ? (
            <div 
              role="button"
              tabIndex={0}
              className="text-center py-10 text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:bg-secondary/20" 
              onClick={() => onAddBlock(0, 'ACTION')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onAddBlock(0, 'ACTION');
                }
              }}
            >
              انقر هنا للبدء بكتابة المشهد...
            </div>
          ) : (
            blocks.map((block, index) => (
              <React.Fragment key={block.id}>
                {index === 0 && (
                  <BlockDivider 
                    index={-1} 
                    onAddBlock={(type) => onAddBlock(0, type)} 
                  />
                )}
                <SortableItem 
                   key={block.id}
                   id={block.id} 
                   className="group relative py-1 transition-all"
                >
                  {({ dragHandleProps }: { dragHandleProps: any }) => (
                  <div 
                    className="flex items-start gap-1 w-full" 
                    data-block-id={block.id}
                    data-keep-with-next={block.type === 'SHOT' ? "true" : undefined}
                  >                  
                    {block.type === 'DIALOGUE' ? (
                      <div 
                        role="region"
                        aria-label="Dialogue Block"
                        onClick={() => setActiveBlockId(String(block.id))}
                        className={`flex-1 min-w-0 bg-card border shadow-sm rounded-lg p-2 hover:border-border/100 hover:shadow transition-all group/block focus-within:ring-1 focus-within:ring-primary/20 flex flex-col gap-1.5 w-full ${
                          activeBlockId === block.id ? 'border-primary ring-1 ring-primary/10' : 'border-border/80'
                        }`}
                      >
                        {/* Header row: drag + block info + duration + delete */}
                        <div className="flex items-center justify-between px-1 w-full border-b border-border/40 pb-1 mb-0.5 select-none">
                          
                          {/* Right side: drag/arrows + icon + type label + character/tone select */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Drag & Move buttons */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                {...dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary text-muted-foreground/40 hover:text-foreground transition-colors"
                                title="اسحب لإعادة الترتيب"
                              >
                                <GripVertical size={13} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => moveBlock(index, 'up')} 
                                disabled={index === 0} 
                                className="text-muted-foreground/30 hover:text-foreground hover:bg-secondary rounded p-0.5 disabled:opacity-10 transition-all" 
                                title="تحريك لأعلى"
                              >
                                <ChevronUp size={11} strokeWidth={3} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => moveBlock(index, 'down')} 
                                disabled={index === blocks.length - 1} 
                                className="text-muted-foreground/30 hover:text-foreground hover:bg-secondary rounded p-0.5 disabled:opacity-10 transition-all" 
                                title="تحريك لأسفل"
                              >
                                <ChevronDown size={11} strokeWidth={3} />
                              </button>
                            </div>

                            {/* Block Type Badge (Icon + Arabic Label) */}
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] font-black border border-border/60">
                              {getBlockTypeIcon(block.type)}
                              <span>{getBlockTypeLabel(block.type)}</span>
                            </div>

                            {/* Character Selector & Tone Selector */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <select 
                                 value={block.character_id || ''}
                                 onChange={(e) => {
                                   const charId = e.target.value;
                                   setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, character_id: charId } : b));
                                   onUpdateBlock(block.id, { character_id: charId });
                                 }}
                                 className="appearance-none bg-secondary/60 hover:bg-secondary border-none text-[11px] font-bold text-foreground focus:outline-none cursor-pointer rounded px-2 py-0.5"
                              >
                                <option value="">شخصية...</option>
                                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <ToneSelector 
                                value={(() => {
                                  try { return JSON.parse(block.metadata || '{}').tone || ''; } catch { 
                                    return ''; 
                                  }
                                })()}
                                onChange={(newTone) => {
                                   const meta = (() => { 
                                     try { return JSON.parse(block.metadata || '{}'); } catch { 
                                       return {}; 
                                     } 
                                   })();
                                   const newMeta = JSON.stringify({ ...meta, tone: newTone });
                                   setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, metadata: newMeta } : b));
                                   onUpdateBlock(block.id, { metadata: newMeta });
                                }}
                                bare={true}
                              />
                            </div>
                          </div>

                          {/* Left side: Duration input & Delete button */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 bg-secondary/50 rounded px-1 py-0.5" title="المدة (دقائق)">
                              <Timer size={10} className="text-muted-foreground shrink-0" />
                              <input
                                type="number" min="0" step="0.05"
                                value={getBlockDuration(block)}
                                onChange={e => updateBlockDuration(block.id, parseFloat(e.target.value) || 0)}
                                className="w-8 bg-transparent text-[10px] font-bold text-center text-muted-foreground focus:outline-none focus:text-foreground"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => onDeleteBlock(block.id)} 
                              className="p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                              title="حذف الكتلة"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Content row */}
                        <div className="relative w-full flex items-start group/textarea">
                          <div dir="rtl" className="w-full bg-background border border-border/50 rounded flex-1 px-2 py-1.5 text-right">
                            <RichTextEditor
                              value={block.content}
                              onChange={(html) => {
                                setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, content: html } : b));
                                onUpdateBlock(block.id, { content: html });
                              }}
                              placeholder="اكتب الحوار هنا..."
                              autoFocus={block.isNew}
                              className="text-base leading-[1.8]"
                              onFocus={() => setActiveBlockId(String(block.id))}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        role="region"
                        aria-label="Content Block"
                        onClick={() => setActiveBlockId(String(block.id))}
                        className={`flex-1 min-w-0 bg-card border shadow-sm rounded-lg p-2 hover:border-border/100 hover:shadow transition-all group/block focus-within:ring-1 focus-within:ring-primary/20 flex flex-col gap-1.5 w-full ${
                          activeBlockId === block.id ? 'border-primary ring-1 ring-primary/10' : 'border-border/80'
                        }`}
                      >
                        {/* Header row: drag + block info + duration + delete */}
                        <div className="flex items-center justify-between px-1 w-full border-b border-border/40 pb-1 mb-0.5 select-none">
                          
                          {/* Right side: drag/arrows + icon + type label */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Drag & Move buttons */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                {...dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary text-muted-foreground/40 hover:text-foreground transition-colors"
                                title="اسحب لإعادة الترتيب"
                              >
                                <GripVertical size={13} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => moveBlock(index, 'up')} 
                                disabled={index === 0} 
                                className="text-muted-foreground/30 hover:text-foreground hover:bg-secondary rounded p-0.5 disabled:opacity-10 transition-all" 
                                title="تحريك لأعلى"
                              >
                                <ChevronUp size={11} strokeWidth={3} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => moveBlock(index, 'down')} 
                                disabled={index === blocks.length - 1} 
                                className="text-muted-foreground/30 hover:text-foreground hover:bg-secondary rounded p-0.5 disabled:opacity-10 transition-all" 
                                title="تحريك لأسفل"
                              >
                                <ChevronDown size={11} strokeWidth={3} />
                              </button>
                            </div>

                            {/* Block Type Badge (Icon + Arabic Label) */}
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] font-black border border-border/60">
                              {getBlockTypeIcon(block.type)}
                              <span>{getBlockTypeLabel(block.type)}</span>
                            </div>
                          </div>

                          {/* Left side: Duration input & Delete button */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 bg-secondary/50 rounded px-1 py-0.5" title="المدة (دقائق)">
                              <Timer size={10} className="text-muted-foreground shrink-0" />
                              <input
                                type="number" min="0" step="0.05"
                                value={getBlockDuration(block)}
                                onChange={e => updateBlockDuration(block.id, parseFloat(e.target.value) || 0)}
                                className="w-8 bg-transparent text-[10px] font-bold text-center text-muted-foreground focus:outline-none focus:text-foreground"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => onDeleteBlock(block.id)} 
                              className="p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                              title="حذف الكتلة"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Content row */}
                        {block.type === 'SHOT' && !expandedShots[block.id] && block.content !== '' ? (
                          <div 
                            role="button"
                            tabIndex={0}
                            onClick={() => setExpandedShots(prev => ({...prev, [block.id]: true}))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setExpandedShots(prev => ({...prev, [block.id]: true}));
                              }
                            }}
                            className="text-[10px] uppercase font-bold text-muted-foreground cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors py-2 px-1 w-full bg-secondary/20 rounded border border-dashed border-border"
                          >
                             <Camera size={12} className="text-muted-foreground" />
                             <span>توجيه كاميرا مخفي (انقر للعرض)</span>
                          </div>
                        ) : (
                          <div className="relative w-full flex items-start group/textarea">
                            <div dir="rtl" className={`w-full bg-background border border-border/50 rounded flex-1 px-2 py-1.5 ${getBlockStyle(block.type)}`}>
                              <RichTextEditor
                                value={block.content}
                                onChange={(html) => {
                                  setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, content: html } : b));
                                  onUpdateBlock(block.id, { content: html });
                                }}
                                placeholder={getPlaceholder(block.type)}
                                autoFocus={block.isNew}
                                className="text-base leading-[1.8]"
                                onFocus={() => setActiveBlockId(String(block.id))}
                              />
                            </div>
                            {block.type === 'SHOT' && (
                              <button 
                                type="button"
                                onClick={() => setExpandedShots(prev => ({...prev, [block.id]: false}))}
                                className="absolute -right-6 top-2 text-muted-foreground/30 hover:text-foreground opacity-0 group-hover/textarea:opacity-100 transition-opacity"
                                title="إخفاء توجيه الكاميرا"
                              >
                                <EyeOff size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                </div>
                )}
              </SortableItem>
                <BlockDivider 
                  index={index} 
                  onAddBlock={(type) => onAddBlock(index + 1, type)} 
                />
              </React.Fragment>
            ))
          )}
        </SortableContext>

        <DragOverlay dropAnimation={{
          duration: 220,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
          {activeBlock ? (
            <div className="bg-card border-2 border-primary/40 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-3 opacity-95 rotate-2 cursor-grabbing min-w-[280px] max-w-[320px] pointer-events-none ring-4 ring-primary/10">
              <div className="flex items-center justify-between mb-2">
                 <div className="text-xs font-black text-primary flex items-center gap-1.5 uppercase tracking-wider">
                   <GripVertical size={14} />
                   {activeBlock.type === 'DIALOGUE' ? 'تحريك حوار' : 'تحريك كتلة'}
                 </div>
                 {activeBlock.type === 'DIALOGUE' && (
                    <div className="text-xs font-bold opacity-70">
                       {characters.find(c => String(c.id) === String(activeBlock.character_id))?.name || ''}
                    </div>
                 )}
              </div>
              <div className="bg-background rounded-md p-2.5 text-xs line-clamp-2 border border-border/50 shadow-inner font-medium text-foreground/80 leading-relaxed text-right">
                 {activeBlock.content || '...'}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {presentCharacters.length > 0 && (
        <div className="flex justify-center mt-2 mb-8">
          <div className="flex items-center gap-2 p-1.5 rounded-full border border-border/30 bg-secondary/10 shadow-sm">
            {presentCharacters.map(char => (
               <button
                 type="button"
                 key={char.id}
                 onClick={() => onAddBlock(blocks.length, 'DIALOGUE', char.id)}
                 className="flex items-center gap-1 px-3 py-1.5 bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/40 shadow-sm rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 shrink-0"
                 title={`إضافة حوار لـ ${char.name}`}
               >
                 <Plus size={12} />
                 <span>{char.name}</span>
               </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
