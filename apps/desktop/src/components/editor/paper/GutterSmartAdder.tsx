import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Plus } from 'lucide-react';

export interface TabItem {
  type: string;
  label: string;
  shortcut: string;
}

const TAB_ITEMS: TabItem[] = [
  { type: 'action', label: 'حدث', shortcut: '1' },
  { type: 'character', label: 'شخصية', shortcut: '2' },
  { type: 'dialogue', label: 'حوار', shortcut: '3' },
  { type: 'transition', label: 'انتقال', shortcut: '4' },
  { type: 'shot', label: 'كاميرا', shortcut: '5' },
  { type: 'audio', label: 'صوت', shortcut: '6' },
  { type: 'textOnScreen', label: 'نص شاشة', shortcut: '7' },
  { type: 'directorNote', label: 'ملاحظة', shortcut: '8' },
  { type: 'parenthetical', label: 'أقواس', shortcut: '9' },
];

export interface GutterSmartAdderProps {
  editor: Editor | null;
  scale?: number;
}

export default function GutterSmartAdder({ editor, scale = 1 }: GutterSmartAdderProps) {
  const [hoveredBlock, setHoveredBlock] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMenuOpen) return;

      const contentEl = document.querySelector('.paper-content');
      if (!contentEl || !editor || !editor.view) return;

      const target = e.target as HTMLElement | null;
      const blockEl = target?.closest('.paper-block') as HTMLElement | null;
      if (!blockEl) {
        const rect = contentEl.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        if (
          mouseX < rect.left ||
          mouseX > rect.right ||
          mouseY < rect.top ||
          mouseY > rect.bottom
        ) {
          setHoveredBlock(null);
        }
        return;
      }

      try {
        const pos = editor.view.posAtDOM(blockEl, 0);
        if (typeof pos !== 'number') return;

        const $pos = editor.state.doc.resolve(pos);
        const node = $pos.node(1);
        if (!node) return;

        const nodeType = node.type.name;
        const blockPos = $pos.start(1) - 1;
        
        let shouldShow = false;
        let allowedOptions: TabItem[] = [];

        if (nodeType === 'dialogue') {
          shouldShow = true;
          allowedOptions = TAB_ITEMS;
        } else if (nodeType === 'character') {
          const nextPos = blockPos + node.nodeSize;
          const nextNode = editor.state.doc.nodeAt(nextPos);
          const hasSpeechAfter = nextNode && (nextNode.type.name === 'dialogue' || nextNode.type.name === 'parenthetical');
          
          if (!hasSpeechAfter) {
            shouldShow = true;
            allowedOptions = [
              { type: 'dialogue', label: 'حوار', shortcut: '3' }
            ];
          }
        } else if (nodeType === 'action') {
          shouldShow = true;
          allowedOptions = TAB_ITEMS;
        }

        if (!shouldShow) {
          setHoveredBlock(null);
          return;
        }

        const rect = blockEl.getBoundingClientRect();
        const contentRect = contentEl.getBoundingClientRect();

        const logicalTop = (rect.top - contentRect.top) / scale;
        const logicalHeight = rect.height / scale;

        const logicalLineHeight = 28;
        const lastLineTop = logicalTop + logicalHeight - logicalLineHeight;
        const buttonTop = lastLineTop + (logicalLineHeight - 24) / 2;

        setHoveredBlock({
          top: buttonTop,
          blockPos,
          nodeSize: node.nodeSize,
          allowedOptions
        });
      } catch (err) {
        setHoveredBlock(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [editor, isMenuOpen, scale]);

  const insertBlock = (type: string) => {
    if (!editor || !hoveredBlock) return;

    const insertPos = hoveredBlock.blockPos + hoveredBlock.nodeSize;

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, { type })
      .setTextSelection(insertPos + 1)
      .run();

    setIsMenuOpen(false);
    setHoveredBlock(null);
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const allowed = hoveredBlock?.allowedOptions || TAB_ITEMS;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % allowed.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + allowed.length) % allowed.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertBlock(allowed[activeIndex].type);
      } else if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, activeIndex, hoveredBlock]);

  if (!hoveredBlock) return null;

  const allowed = hoveredBlock.allowedOptions || TAB_ITEMS;

  return (
    <div
      className="absolute right-[-40px] z-50 transition-all duration-150"
      style={{ top: `${hoveredBlock.top}px` }}
    >
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="w-6 h-6 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 flex items-center justify-center shadow-xs transition-transform active:scale-95"
        title="إضافة عنصر محدد تلقائياً"
      >
        <Plus size={14} className={isMenuOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
      </button>

      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-8 top-0 bg-white border border-zinc-200 rounded-lg shadow-xl p-1 w-44 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="text-[10px] font-bold text-zinc-400 px-2 py-1 border-b border-zinc-100 mb-1">
            اختر نوع العنصر للدرجة الحالية
          </div>
          {allowed.map((item: TabItem, idx: number) => (
            <button
              key={item.type}
              onClick={() => insertBlock(item.type)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-right transition-colors ${
                idx === activeIndex
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] text-zinc-400 font-mono">[{item.shortcut}]</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
