import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';

const TAB_ITEMS = [
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

export default function GutterSmartAdder({ editor, scale = 1 }) {
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isMenuOpen) return;

      const contentEl = document.querySelector('.paper-content');
      if (!contentEl || !editor || !editor.view) return;

      // Find the closest paper block
      const blockEl = e.target.closest('.paper-block');
      if (!blockEl) {
        // If cursor moves away, we hide the button unless menu is open
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
        // Get the depth 1 block node to prevent getting inline text nodes
        const node = $pos.node(1);
        if (!node) return;

        const nodeType = node.type.name;
        const blockPos = $pos.start(1) - 1;
        
        // Strict Constitution Filtering
        let shouldShow = false;
        let allowedOptions = [];

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

        // Convert viewport pixels to logical pixels inside the scaled paper container
        const logicalTop = (rect.top - contentRect.top) / scale;
        const logicalHeight = rect.height / scale;

        // Calculate layout properties for the last line of the block (baseline alignment)
        const logicalLineHeight = 28;
        const lastLineTop = logicalTop + logicalHeight - logicalLineHeight;
        const buttonTop = lastLineTop + (logicalLineHeight - 24) / 2; // Centers the 24px button vertically in the last line

        // Check viewport limits to see if it should open upwards
        const buttonViewportY = rect.top + rect.height - logicalLineHeight + (logicalLineHeight - 24) / 2;
        const menuHeight = allowedOptions.length * 36 + 16;
        const spaceBelow = window.innerHeight - buttonViewportY;
        const isUpward = spaceBelow < menuHeight;

        setHoveredBlock({
          pos: blockPos,
          node,
          top: buttonTop,
          height: logicalHeight,
          options: allowedOptions,
          openUpward: isUpward,
        });
      } catch (err) {
        // posAtDOM can throw on widgets or page breaks
      }
    };

    const handleMouseLeave = () => {
      if (!isMenuOpen) {
        setHoveredBlock(null);
      }
    };

    const handleClickOutside = (e) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
        setHoveredBlock(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleClickOutside);
    const contentEl = document.querySelector('.paper-content');
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
  }, [editor, isMenuOpen, scale]);

  // Handle Keyboard Shortcuts when the dropdown is open
  useEffect(() => {
    if (!isMenuOpen || !hoveredBlock) return;

    setActiveIndex(0); // Reset index on open

    const handleKeyDown = (e) => {
      const options = hoveredBlock.options;

      // Handle number keys 1-9 and Numpad 1-9
      let pressedShortcut = null;
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
        const opt = options.find((o) => o.shortcut === pressedShortcut);
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

  const insertBlock = (type) => {
    const { pos, node } = hoveredBlock;
    const insertPos = pos + node.nodeSize;

    editor.chain()
      .focus()
      .insertContentAt(insertPos, { type, content: [] })
      .setTextSelection(insertPos + 1)
      .run();

    setIsMenuOpen(false);
    setHoveredBlock(null);
  };

  return (
    <div
      className="absolute z-[999] select-none"
      style={{
        top: `${hoveredBlock.top}px`,
        right: '48px', // Positioned centered in the 96px right padding margin
        transform: 'translateX(50%)',
      }}
    >
      {/* Gutter '+' Trigger Button - Black Square design */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`w-6 h-6 rounded-md flex items-center justify-center shadow-md transition-all duration-150 cursor-pointer ${
          isMenuOpen
            ? 'bg-zinc-800 scale-110'
            : 'bg-zinc-950 hover:bg-black text-white'
        }`}
        title="إضافة كتلة جديدة"
      >
        <Plus size={13} strokeWidth={3.5} className="text-white" />
      </button>

      {/* Context-Aware Dropdown Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className={`absolute right-full mr-2 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-[9999] flex flex-col p-1.5 animate-in fade-in slide-in-from-right-1 duration-150 text-right font-sans gap-0.5 ${
            hoveredBlock.openUpward ? 'bottom-0' : 'top-0'
          }`}
          dir="rtl"
        >
          {hoveredBlock.options.map((opt, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={opt.type}
                onClick={() => insertBlock(opt.type)}
                className={`flex flex-row items-center gap-3 w-full px-2 py-1.5 rounded-lg text-right select-none transition-colors border border-transparent cursor-pointer ${
                  isActive ? 'bg-zinc-100 border-zinc-100/50' : 'hover:bg-zinc-50'
                }`}
              >
                {/* Circle outline with number/shortcut */}
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                  isActive ? 'border-zinc-400 bg-white text-black' : 'border-zinc-300 bg-white text-zinc-700'
                }`}>
                  {opt.shortcut}
                </div>
                {/* Label */}
                <span className={`text-[13px] font-semibold transition-colors ${
                  isActive ? 'text-black' : 'text-zinc-800'
                }`}>
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
