import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { useUIStore } from '../../../../store/useUIStore';
import { useCreateCharacterMutation } from '../../../../hooks/queries';

export default function CharacterNodeView({ node, getPos, editor }) {
  const [isCharMenuOpen, setCharMenuOpen] = useState(false);
  const [isToneMenuOpen, setToneMenuOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newToneName, setNewToneName] = useState('');

  const charDropdownRef = useRef(null);
  const toneDropdownRef = useRef(null);
  
  const characters = editor.options.characters || [];
  const tone = node.attrs.tone || '';

  // Access the scenario store and database mutation hook directly
  const { activeScenarioId } = useUIStore();
  const createCharacterMutation = useCreateCharacterMutation();

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isCharMenuOpen && charDropdownRef.current && !charDropdownRef.current.contains(e.target)) {
        setCharMenuOpen(false);
      }
      if (isToneMenuOpen && toneDropdownRef.current && !toneDropdownRef.current.contains(e.target)) {
        setToneMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCharMenuOpen, isToneMenuOpen]);

  const selectCharacter = (char) => {
    setCharMenuOpen(false);
    const start = getPos();
    if (typeof start !== 'number') return;

    editor.chain()
      .focus()
      .command(({ tr }) => {
        const currentNode = tr.doc.nodeAt(start);
        if (!currentNode) return false;

        // Update character ID attribute
        tr.setNodeMarkup(start, undefined, {
          ...currentNode.attrs,
          character_id: char.id
        });
        
        // Replace character name text content (which is just the name now, no tone)
        tr.insertText(char.name, start + 1, start + currentNode.nodeSize - 1);
        return true;
      })
      .run();
  };

  const updateTone = (newTone) => {
    setToneMenuOpen(false);
    const start = getPos();
    if (typeof start !== 'number') return;

    editor.chain()
      .focus()
      .command(({ tr }) => {
        const currentNode = tr.doc.nodeAt(start);
        if (!currentNode) return false;

        // Update the tone attribute directly
        tr.setNodeMarkup(start, undefined, {
          ...currentNode.attrs,
          tone: (newTone && newTone !== 'عادي') ? newTone : null
        });
        return true;
      })
      .run();
  };

  const handleAddCharacter = () => {
    const trimmed = newCharName.trim();
    if (!trimmed) return;
    
    setNewCharName('');
    
    // Generate the unique ID on the client side instantly to bypass the async wait
    const newId = 'chr_' + Math.random().toString(36).substring(2, 15);
    const newChar = { id: newId, name: trimmed };
    
    // 1. Instantly select the character in the editor document (Synchronous & Immediate)
    selectCharacter(newChar);
    
    // 2. Write the character to SQLite in the background (Non-blocking)
    if (activeScenarioId) {
      createCharacterMutation.mutate({
        id: newId,
        name: trimmed,
        scenario_id: activeScenarioId
      });
    }
  };

  const handleAddTone = () => {
    const trimmed = newToneName.trim();
    if (!trimmed) return;
    
    setNewToneName('');
    updateTone(trimmed);
  };

  return (
    <NodeViewWrapper className="paper-node-character paper-block group relative">
      <div className="flex items-center justify-start gap-1 select-none">
        
        {/* 1. Character Name (Editable) */}
        <div 
          onClick={() => {
            setCharMenuOpen(!isCharMenuOpen);
            setToneMenuOpen(false);
          }}
          className="hover:bg-zinc-50 rounded px-1 -mx-1 transition-colors cursor-pointer select-text"
        >
          <NodeViewContent className="outline-none font-bold inline-block" />
        </div>

        {/* 2. Character Dropdown Arrow (visible on hover or when open) */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setCharMenuOpen(!isCharMenuOpen);
            setToneMenuOpen(false);
          }}
          className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center w-4 h-4 rounded border cursor-pointer ${
            isCharMenuOpen ? 'bg-zinc-100 border-zinc-300 text-black opacity-100' : 'bg-white border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50'
          }`}
          title="اختر شخصية"
        >
          <ChevronDown size={10} strokeWidth={3} />
        </div>

        {/* Permanent visual space */}
        <div className="w-1.5" />

        {/* 3. Tone / Emotion (if present) */}
        {tone && (
          <span className="text-zinc-500 font-medium text-sm">
            ({tone})
          </span>
        )}

        {/* 4. Tone Trigger (visible on hover or when open) */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setToneMenuOpen(!isToneMenuOpen);
            setCharMenuOpen(false);
          }}
          className={`transition-opacity duration-150 flex items-center justify-center h-4 rounded border cursor-pointer text-[9px] font-bold px-1 gap-0.5 ${
            tone 
              ? (isToneMenuOpen ? 'bg-zinc-100 border-zinc-300 text-black' : 'opacity-0 group-hover:opacity-100 bg-white border-zinc-200 text-zinc-500 hover:text-black hover:bg-zinc-50')
              : (isToneMenuOpen ? 'bg-zinc-100 border-zinc-300 text-black opacity-100' : 'opacity-0 group-hover:opacity-100 bg-zinc-50 border-dashed border-zinc-300 text-zinc-400 hover:text-black hover:bg-zinc-100')
          }`}
          title={tone ? "تغيير الشعور" : "إضافة شعور"}
        >
          {tone ? (
            <ChevronDown size={10} strokeWidth={3} />
          ) : (
            <span>+ شعور</span>
          )}
        </div>

      </div>

      {/* Character Dropdown Menu */}
      {isCharMenuOpen && (
        <div 
          ref={charDropdownRef}
          className="absolute right-0 top-full mt-1 w-48 max-h-72 bg-white border border-zinc-200 rounded-lg shadow-xl z-[9999] flex flex-col p-1 animate-in fade-in slide-in-from-top-1 duration-150 text-right font-sans"
          dir="rtl"
        >
          {/* Quick Add Character Input (At the top - Unconditional) */}
          <div className="flex items-center gap-1 p-1 border-b border-zinc-150 mb-1 bg-zinc-50/50 rounded-t-md">
            <input
              type="text"
              placeholder="شخصية جديدة..."
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              className="flex-1 min-w-0 px-2 py-1 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-400"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  e.preventDefault();
                  handleAddCharacter();
                }
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddCharacter();
              }}
              className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-zinc-800 hover:bg-black text-white rounded text-xs font-bold transition-colors"
              title="إضافة شخصية"
            >
              +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-48 flex flex-col">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={(e) => {
                  e.stopPropagation();
                  selectCharacter(char);
                }}
                className="w-full text-right px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-black rounded transition-colors font-medium"
              >
                {char.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tone Dropdown Menu */}
      {isToneMenuOpen && (
        <div 
          ref={toneDropdownRef}
          className="absolute right-[80px] top-full mt-1 w-44 max-h-72 bg-white border border-zinc-200 rounded-lg shadow-xl z-[9999] flex flex-col p-1 animate-in fade-in slide-in-from-top-1 duration-150 text-right font-sans"
          dir="rtl"
        >
          {/* Quick Add Custom Tone Input (At the top) */}
          <div className="flex items-center gap-1 p-1 border-b border-zinc-150 mb-1 bg-zinc-50/50 rounded-t-md">
            <input
              type="text"
              placeholder="شعور مخصص..."
              value={newToneName}
              onChange={(e) => setNewToneName(e.target.value)}
              className="flex-1 min-w-0 px-2 py-1 border border-zinc-200 rounded text-xs focus:outline-none focus:border-zinc-400"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  e.preventDefault();
                  handleAddTone();
                }
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddTone();
              }}
              className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-zinc-800 hover:bg-black text-white rounded text-xs font-bold transition-colors"
              title="إضافة نبرة"
            >
              +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-48 flex flex-col">
            {['عادي', 'متشائم', 'غاضب', 'هامس', 'سعيد', 'حزين', 'متردد', 'متحمس', 'خائف'].map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  updateTone(t);
                }}
                className="w-full text-right px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-black rounded transition-colors font-medium"
              >
                {t === 'عادي' ? 'بدون شعور (عادي)' : t}
              </button>
            ))}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
