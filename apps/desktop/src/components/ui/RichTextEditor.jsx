import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Bold, Italic, Underline as UnderlineIcon, Highlighter } from 'lucide-react';

/**
 * Floating toolbar that appears when text is selected.
 * Replaces BubbleMenu which is not available in this Tiptap version.
 */
function FloatingToolbar({ editor }) {
  const [coords, setCoords] = useState(null);
  const toolbarRef = useRef(null);

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
    
    // Use viewport-fixed coordinates so toolbar never overlaps the text
    const centerX = (start.left + end.left) / 2;
    const topY = Math.min(start.top, end.top);
    
    // Toolbar height ~36px + 8px gap above the line
    const toolbarWidth = 180;
    setCoords({
      left: Math.max(8, centerX - toolbarWidth / 2),
      top: topY - 44
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    
    editor.on('selectionUpdate', updatePosition);
    editor.on('blur', () => setTimeout(() => setCoords(null), 200));
    
    return () => {
      editor.off('selectionUpdate', updatePosition);
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
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-md hover:bg-zinc-100 transition-colors ${editor.isActive('bold') ? 'bg-zinc-150 text-black font-semibold' : 'text-zinc-600'}`}
        title="عريض (Ctrl+B)"
      >
        <Bold size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-md hover:bg-zinc-100 transition-colors ${editor.isActive('italic') ? 'bg-zinc-150 text-black font-semibold' : 'text-zinc-600'}`}
        title="مائل (Ctrl+I)"
      >
        <Italic size={15} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded-md hover:bg-zinc-100 transition-colors ${editor.isActive('underline') ? 'bg-zinc-150 text-black font-semibold' : 'text-zinc-600'}`}
        title="تسطير (Ctrl+U)"
      >
        <UnderlineIcon size={15} />
      </button>
      <div className="w-[1px] h-4 bg-zinc-200 mx-0.5" />
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded-md hover:bg-yellow-100 transition-colors ${editor.isActive('highlight') ? 'bg-yellow-200 text-yellow-900 font-semibold' : 'text-zinc-600'}`}
        title="تظليل (Highlight)"
      >
        <Highlighter size={15} />
      </button>
    </div>
  );
}

export default function RichTextEditor({ 
  value = '', 
  onChange, 
  placeholder = 'ابدأ الكتابة...', 
  className = '', 
  autoFocus = false,
  onKeyDown,
  readOnly = false,
  minHeight = 'auto',
  onFocus
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
        underline: false,
      }),
      Underline,
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 text-yellow-900 rounded-sm px-0.5',
        },
      }),
    ],
    content: value || '',
    editable: !readOnly,
    autofocus: autoFocus ? 'end' : false,
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML();
      onChange && onChange(html);
    },
    onFocus: ({ editor, event }) => {
      if (onFocus) onFocus(event);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm focus:outline-none min-w-full text-foreground max-w-none ${className}`,
        style: `min-height: ${minHeight};`,
        dir: 'rtl'
      },
      handleKeyDown: (view, event) => {
        if (onKeyDown) {
          return onKeyDown(event);
        }
        return false;
      }
    },
  });

  // Sync value if changed externally (e.g. tab switch in CharacterProfile)
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentHtml = editor.getHTML();
      // Only update if truly different to avoid cursor reset
      if (value !== currentHtml) {
        editor.commands.setContent(value || '');
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="relative w-full h-full tiptap-wrapper" onClick={() => editor.commands.focus()}>
      {!readOnly && <FloatingToolbar editor={editor} />}
      
      {editor.isEmpty && !editor.isFocused && (
         <div className="absolute top-1.5 right-2 text-muted-foreground/40 pointer-events-none text-sm whitespace-nowrap">
            {placeholder}
         </div>
      )}

      <EditorContent editor={editor} className="w-full h-full" />
    </div>
  );
}
