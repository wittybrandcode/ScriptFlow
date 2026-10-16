import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Bold as BoldIcon, Italic as ItalicIcon, Underline as UnderlineIcon, Highlighter } from 'lucide-react';

export interface FloatingToolbarProps {
  editor: Editor | null;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor }) => {
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!editor) return;
    
    const { from, to, empty } = editor.state.selection;
    if (empty) {
      setCoords(null);
      return;
    }

    const view = editor.view;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    
    const centerX = (start.left + end.left) / 2;
    const topY = Math.min(start.top, end.top);
    
    const toolbarWidth = 180;
    setCoords({
      left: Math.max(8, centerX - toolbarWidth / 2),
      top: topY - 44
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    
    editor.on('selectionUpdate', updatePosition);
    const handleBlur = () => setTimeout(() => setCoords(null), 200);
    editor.on('blur', handleBlur);
    
    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('blur', handleBlur);
    };
  }, [editor, updatePosition]);

  if (!coords || !editor) return null;

  return (
    <div 
      ref={toolbarRef}
      className="flex items-center p-1 gap-0.5 rounded-lg border shadow-xl animate-in fade-in zoom-in-95 duration-150 bg-white border-zinc-200 text-zinc-800"
      style={{ 
        position: 'fixed', 
        left: coords.left, 
        top: Math.max(4, coords.top),
        zIndex: 99999,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-zinc-100 transition-colors ${editor.isActive('bold') ? 'bg-zinc-200 text-indigo-600 font-bold' : ''}`}
        title="عريض (Ctrl+B)"
      >
        <BoldIcon size={14} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-zinc-100 transition-colors ${editor.isActive('italic') ? 'bg-zinc-200 text-indigo-600 font-bold' : ''}`}
        title="مائل (Ctrl+I)"
      >
        <ItalicIcon size={14} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-zinc-100 transition-colors ${editor.isActive('underline') ? 'bg-zinc-200 text-indigo-600 font-bold' : ''}`}
        title="تحته خط (Ctrl+U)"
      >
        <UnderlineIcon size={14} />
      </button>

      <div className="w-[1px] h-4 mx-1 bg-zinc-200" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded hover:bg-zinc-100 transition-colors ${editor.isActive('highlight') ? 'bg-amber-100 text-amber-600' : ''}`}
        title="تظليل (Highlight)"
      >
        <Highlighter size={14} />
      </button>
    </div>
  );
};

export default FloatingToolbar;
