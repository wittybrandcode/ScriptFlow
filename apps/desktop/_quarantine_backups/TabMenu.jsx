import React, { useEffect, useRef, useState } from 'react';

const MENU_ITEMS = [
  { id: '1', type: 'action', label: 'حدث', section: 'أساسيات الكتابة' },
  { id: '2', type: 'character', label: 'شخصية', section: 'أساسيات الكتابة' },
  { id: '3', type: 'dialogue', label: 'حوار', section: 'أساسيات الكتابة' },
  { id: '4', type: 'transition', label: 'انتقال', section: 'أساسيات الكتابة' },
  { id: '5', type: 'shot', label: 'كاميرا', section: 'عناصر تقنية' },
  { id: '6', type: 'audio', label: 'صوت', section: 'عناصر تقنية' },
  { id: '7', type: 'textOnScreen', label: 'نص شاشة', section: 'عناصر تقنية' },
  { id: '8', type: 'directorNote', label: 'ملاحظة', section: 'عناصر تقنية' },
  { id: '9', type: 'parenthetical', label: 'أقواس', section: 'عناصر تقنية' },
];

export function TabMenu({ editor, position, onClose }) {
  const menuRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!position) return;
    setActiveIndex(0); // Reset index on open

    const handleKeyDown = (e) => {
      // Map both standard top row digits and Numpad digits (1-9) for fast insertion
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const item = MENU_ITEMS.find((i) => i.id === e.key);
        if (item) {
          applyItem(item);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % MENU_ITEMS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        applyItem(MENU_ITEMS[activeIndex]);
      } else if (e.key === 'Tab') {
        // Pressing Tab again closes the menu
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Capture phase to intercept key presses before TipTap
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [position, editor, activeIndex]);

  const applyItem = (item) => {
    if (editor) {
      const { state } = editor;
      const { selection } = state;
      const { empty, $anchor } = selection;

      const isCurrentNodeEmpty = empty && $anchor.parent.content.size === 0;

      if (isCurrentNodeEmpty) {
        editor.chain().focus().setNode(item.type).run();
      } else {
        editor.chain().focus().splitBlock().setNode(item.type).run();
      }
    }
    onClose();
  };

  if (!position) return null;

  const MENU_HEIGHT = 380; // approximate height of 9 items + padding
  const showAbove = position.coords.top + MENU_HEIGHT > window.innerHeight;
  const topStyle = showAbove 
    ? position.coords.top - MENU_HEIGHT - 12
    : position.coords.top + 24;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-zinc-200 rounded-xl shadow-2xl p-1.5 w-48 text-zinc-800 text-sm font-sans flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150"
      style={{
        top: topStyle,
        left: position.coords.left - 220,
      }}
      dir="rtl"
    >
      {MENU_ITEMS.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={item.id}
            onClick={() => applyItem(item)}
            className={`flex flex-row items-center gap-3 w-full px-2 py-1.5 rounded-lg text-right select-none transition-colors border border-transparent cursor-pointer ${
              isActive ? 'bg-zinc-100 border-zinc-100/50' : 'hover:bg-zinc-50'
            }`}
          >
            {/* Circle outline with number */}
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
              isActive ? 'border-zinc-400 bg-white text-black' : 'border-zinc-300 bg-white text-zinc-700'
            }`}>
              {item.id}
            </div>
            {/* Label */}
            <span className={`text-[13px] font-semibold transition-colors ${
              isActive ? 'text-black' : 'text-zinc-800'
            }`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
