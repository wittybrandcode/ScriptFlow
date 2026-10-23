import { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Plus } from 'lucide-react';

export interface TabItem {
  type: string;
  label: string;
  shortcut: string;
}

export const TAB_ITEMS: TabItem[] = [
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

interface HoveredBlockState {
  pos: number;
  node: any;
  top: number;
  left: number;
  viewportX: number;
  viewportY: number;
  options: TabItem[];
  openUpward: boolean;
}

export default function GutterSmartAdder({ editor, scale = 1 }: GutterSmartAdderProps) {
  const [hoveredBlock, setHoveredBlock] = useState<HoveredBlockState | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMenuOpen) return;

      // 1. If mouse button is held down (user is actively dragging/selecting text), suppress '+'
      if (e.buttons !== 0) {
        setHoveredBlock(null);
        return;
      }

      // 2. If text is currently selected in the editor, suppress '+' completely (yield to FloatingToolbar)
      if (editor && !editor.state.selection.empty) {
        setHoveredBlock(null);
        return;
      }

      // 3. If window has an active text selection, suppress '+'
      const winSel = window.getSelection();
      if (winSel && winSel.toString().length > 0) {
        setHoveredBlock(null);
        return;
      }

      const target = e.target as HTMLElement | null;
      // Do not clear or recalculate if mouse is hovering over the button or menu container
      if (target?.closest('.gutter-adder-container')) return;

      const contentEl = document.querySelector('.paper-content');
      if (!contentEl || !editor || !editor.view) return;

      const blockEl = target?.closest('.paper-block') as HTMLElement | null;
      if (!blockEl) {
        if (hoveredBlock) {
          // Allow mouse to move smoothly across the small gap between text end and the '+' button
          const dist = Math.hypot(e.clientX - hoveredBlock.viewportX, e.clientY - hoveredBlock.viewportY);
          if (dist < 48) return;
        }
        setHoveredBlock(null);
        return;
      }

      try {
        const pos = editor.view.posAtDOM(blockEl, 0);
        if (typeof pos !== 'number') return;

        const $pos = editor.state.doc.resolve(pos);
        // Get the depth 1 block node to prevent getting inline text nodes
        const node = $pos.node(1);
        if (!node) return;

        const nodeType = node.type.name;
        const blockPos = $pos.start(1) - 1;

        // Strict Constitution Filtering
        let shouldShow = false;
        let allowedOptions: TabItem[] = [];

        if (nodeType === 'dialogue') {
          shouldShow = true;
          allowedOptions = TAB_ITEMS;
        } else if (nodeType === 'character') {
          // Check if the character is followed by dialogue or parenthetical
          const nextPos = blockPos + node.nodeSize;
          const nextNode = editor.state.doc.nodeAt(nextPos);
          const hasSpeechAfter = nextNode && (nextNode.type.name === 'dialogue' || nextNode.type.name === 'parenthetical');

          if (!hasSpeechAfter) {
            shouldShow = true;
            allowedOptions = [{ type: 'dialogue', label: 'حوار', shortcut: '3' }];
          }
        } else if (nodeType === 'parenthetical') {
          shouldShow = true;
          allowedOptions = [{ type: 'dialogue', label: 'حوار', shortcut: '3' }];
        } else if (
          nodeType === 'action' ||
          nodeType === 'shot' ||
          nodeType === 'transition' ||
          nodeType === 'audio' ||
          nodeType === 'textOnScreen' ||
          nodeType === 'directorNote'
        ) {
          shouldShow = true;
          allowedOptions = TAB_ITEMS;
        }

        if (!shouldShow) {
          setHoveredBlock(null);
          return;
        }

        const contentRect = contentEl.getBoundingClientRect();

        let endViewportX: number | null = null;
        let endViewportY: number | null = null;
        let lineH = 28;

        // 1. For React NodeView (e.g. CharacterNodeView with name, arrow, and tone badge)
        const flexRow = blockEl.querySelector('.flex.items-center') as HTMLElement | null;
        if (nodeType === 'character' && flexRow) {
          const children = Array.from(flexRow.children) as HTMLElement[];
          let minLeft = Infinity;
          const fRect = flexRow.getBoundingClientRect();
          endViewportY = fRect.top;
          lineH = fRect.height || 28;

          children.forEach((child) => {
            const cs = window.getComputedStyle(child);
            if (cs.display !== 'none' && cs.visibility !== 'hidden') {
              const cr = child.getBoundingClientRect();
              if (
                cr.width > 0 &&
                (parseFloat(cs.opacity) > 0.1 || (child.textContent && child.textContent.trim().length > 0))
              ) {
                if (cr.left < minLeft) {
                  minLeft = cr.left;
                }
              }
            }
          });

          if (minLeft < Infinity) {
            endViewportX = minLeft;
          }
        } else {
          // 2. Regular screenplay text blocks (dialogue, action, parenthetical, etc.)
          // The block is ONE unified, continuous component. The '+' button MUST ONLY appear
          // at the TRUE END of the block in ProseMirror (endPos = blockPos + node.nodeSize - 1).
          // We DO NOT use DOM range fragments which get split by inline marks (<mark>, <b>, <i>)!
          try {
            const endPos = blockPos + node.nodeSize - 1;
            const coords = editor.view.coordsAtPos(endPos);
            if (coords) {
              endViewportX = coords.left;
              endViewportY = coords.top;
              lineH = coords.bottom - coords.top || 28;
            }
          } catch {
            // fallback
          }
        }

        // Final fallback if element is empty or unmeasured
        if (endViewportX === null || endViewportY === null) {
          const bRect = blockEl.getBoundingClientRect();
          endViewportX = bRect.left + 20;
          endViewportY = bRect.top;
          lineH = bRect.height || 28;
        }

        // Convert viewport coordinates to logical container coordinates (accounting for zoom scale)
        const logicalCharX = (endViewportX - contentRect.left) / scale;
        const logicalCharY = (endViewportY - contentRect.top) / scale;

        // In RTL text, the sentence ends on the left; position the '+' button right at the end of the line
        const buttonTop = logicalCharY + (lineH - 24) / 2;
        let buttonLeft = logicalCharX - 24 - 10;
        // Clamp within paper width boundaries
        buttonLeft = Math.max(10, Math.min(794 - 34, buttonLeft));

        // Screen center coordinates of the button for mouse proximity tracking
        const buttonViewportX = contentRect.left + buttonLeft * scale + 12 * scale;
        const buttonViewportY = contentRect.top + buttonTop * scale + 12 * scale;

        // Determine if menu should open upward based on viewport height
        const spaceBelow = window.innerHeight - (buttonViewportY + 12 * scale);
        const menuHeight = allowedOptions.length * 36 + 16;
        const isUpward = spaceBelow < menuHeight;

        setHoveredBlock((prev) => {
          if (
            prev &&
            prev.pos === blockPos &&
            Math.abs(prev.top - buttonTop) < 2 &&
            Math.abs(prev.left - buttonLeft) < 2
          ) {
            return prev;
          }
          return {
            pos: blockPos,
            node,
            top: buttonTop,
            left: buttonLeft,
            viewportX: buttonViewportX,
            viewportY: buttonViewportY,
            options: allowedOptions,
            openUpward: isUpward,
          };
        });
      } catch (err) {
        // posAtDOM can throw on widgets or page breaks
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (isMenuOpen) return;
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget?.closest('.gutter-adder-container')) return;
      setHoveredBlock(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setHoveredBlock(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleClickOutside);
    const contentEl = document.querySelector('.paper-content') as HTMLElement | null;
    if (contentEl) {
      contentEl.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleClickOutside);
      if (contentEl) {
        contentEl.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [editor, isMenuOpen, scale, hoveredBlock]);

  // Handle Keyboard Shortcuts when the dropdown is open
  useEffect(() => {
    if (!isMenuOpen || !hoveredBlock) return;

    setActiveIndex(0); // Reset index on open

    const handleKeyDown = (e: KeyboardEvent) => {
      const options = hoveredBlock.options;

      // Handle number keys 1-9 and Numpad 1-9
      let pressedShortcut: string | null = null;
      if (e.key >= '1' && e.key <= '9') {
        pressedShortcut = e.key;
      } else if (e.code && e.code.startsWith('Numpad')) {
        const numChar = e.code.replace('Numpad', '');
        const num = parseInt(numChar, 10);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          pressedShortcut = String(num);
        }
      }

      if (pressedShortcut) {
        const opt = options.find((o: TabItem) => o.shortcut === pressedShortcut);
        if (opt) {
          e.preventDefault();
          insertBlock(opt.type);
          return;
        }
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (options[activeIndex]) {
          insertBlock(options[activeIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsMenuOpen(false);
        setHoveredBlock(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Capture phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isMenuOpen, hoveredBlock, activeIndex]);

  if (!hoveredBlock) return null;

  const insertBlock = (type: string) => {
    if (!editor || !hoveredBlock) return;
    const { pos, node } = hoveredBlock;
    const insertPos = pos + node.nodeSize;

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, { type, content: [] })
      .setTextSelection(insertPos + 1)
      .run();

    setIsMenuOpen(false);
    setHoveredBlock(null);
  };

  return (
    <div
      className="gutter-adder-container absolute z-[999] select-none"
      style={{
        top: `${hoveredBlock.top}px`,
        left: `${hoveredBlock.left}px`,
      }}
    >
      {/* '+' Trigger Button */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`w-6 h-6 rounded-md flex items-center justify-center shadow-md border transition-all duration-150 cursor-pointer ${
          isMenuOpen
            ? 'bg-zinc-950 border-zinc-950 text-white scale-110'
            : 'bg-white hover:bg-black text-black hover:text-white border-zinc-200 hover:border-black'
        }`}
        title="إضافة كتلة جديدة"
      >
        <Plus size={13} strokeWidth={3.5} className="transition-colors duration-150" />
      </button>

      {/* Context-Aware Dropdown Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className={`absolute ${
            hoveredBlock.left < 200 ? 'left-0' : 'right-0'
          } ${
            hoveredBlock.openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-[9999] flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-150 text-right font-sans gap-0.5`}
          dir="rtl"
        >
          {hoveredBlock.options.map((opt: TabItem, index: number) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => insertBlock(opt.type)}
                className={`flex flex-row items-center gap-3 w-full px-2 py-1.5 rounded-lg text-right select-none transition-colors border border-transparent cursor-pointer ${
                  isActive ? 'bg-zinc-100 border-zinc-100/50' : 'hover:bg-zinc-50'
                }`}
              >
                {/* Circle outline with number/shortcut */}
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                    isActive ? 'border-zinc-400 bg-white text-black' : 'border-zinc-300 bg-white text-zinc-700'
                  }`}
                >
                  {opt.shortcut}
                </div>
                {/* Label */}
                <span
                  className={`text-[13px] font-semibold transition-colors ${
                    isActive ? 'text-black' : 'text-zinc-800'
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
