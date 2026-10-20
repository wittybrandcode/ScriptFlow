import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { ChevronDown } from 'lucide-react';

import { ActionNode } from './extensions/ActionNode';
import { CharacterNode } from './extensions/CharacterNode';
import { DialogueNode } from './extensions/DialogueNode';
import { ParentheticalNode } from './extensions/ParentheticalNode';
import { TransitionNode } from './extensions/TransitionNode';
import { ShotNode } from './extensions/ShotNode';
import { AudioNode } from './extensions/AudioNode';
import { DirectorNoteNode } from './extensions/DirectorNoteNode';
import { TextNode } from './extensions/TextNode';
import { TabMenuExtension } from './extensions/TabMenuExtension';
import { PaginationExtension } from './extensions/PaginationExtension';

import { TabMenu } from './TabMenu';
import { blocksToTiptap, tiptapToBlocks } from './bridge';
import { useUIStore } from '../../../store/useUIStore';
import FloatingToolbar from './FloatingToolbar';
import GutterSmartAdder from './GutterSmartAdder';
import './paper-editor.css';

const timeMap: Record<string, string> = {
  'DAY': 'نهار',
  'NIGHT': 'ليل',
  'DAWN': 'فجر',
  'MORNING': 'صباح',
  'AFTERNOON': 'بعد الظهر',
  'EVENING': 'مساء',
  'DUSK': 'غروب',
  'LATE_NIGHT': 'منتصف الليل'
};

export interface PaperEditorProps {
  scene: any;
  initialBlocks?: any[];
  characters?: any[];
  locations?: any[];
  onUpdateBlocks?: (blocks: any[]) => void;
  onUpdateScene?: (field: string, value: any) => void;
  paperZoom?: number;
  startPageNumber?: number;
  scenarioName?: string;
  episodes?: any[];
  onAddCharacter?: (name: string) => Promise<any>;
}

export default function PaperEditor({ 
  scene, 
  initialBlocks = [], 
  characters = [], 
  locations = [], 
  onUpdateBlocks, 
  onUpdateScene, 
  paperZoom = 1,
  startPageNumber = 1,
  scenarioName = 'مشروع بدون عنوان',
  episodes = [],
  onAddCharacter
}: PaperEditorProps) {
  const { showDebugGrid, showDebugMargins } = useUIStore();
  const currentEpisode = episodes?.find(e => e.id === scene?.episode_id);
  const [menuPosition, setMenuPosition] = useState<any>(null);
  const debounceRef = useRef<any>(null);

  // States for interactive Scene Header dropdowns
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const timeDropdownRef = useRef<HTMLDivElement>(null);

  // Close scene header dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target as Node)) {
        setIsTimeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initialContent = React.useMemo(() => {
    return blocksToTiptap(initialBlocks, characters);
  }, [initialBlocks, characters]);

  const editor = useEditor({
    extensions: [
      Document,
      Text,
      BoldExtension,
      ItalicExtension,
      Underline,
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 text-yellow-900 rounded-sm px-0.5',
        },
      }),
      ActionNode,
      CharacterNode,
      DialogueNode,
      ParentheticalNode,
      TransitionNode,
      ShotNode,
      AudioNode,
      DirectorNoteNode,
      TextNode,
      PaginationExtension.configure({
        scene: scene,
        scenarioName: scenarioName
      }),
      Placeholder.configure({
        placeholder: ({ node }: any) => {
          switch (node.type.name) {
            case 'action': return 'وصف الحدث...';
            case 'character': return 'اسم الشخصية';
            case 'dialogue': return 'الحوار...';
            case 'parenthetical': return '(توجيه حركي)';
            case 'transition': return 'انتقال:';
            case 'shot': return 'توجيه كاميرا';
            case 'audio': return 'مؤثر صوتي';
            case 'directorNote': return 'ملاحظة إخراجية...';
            case 'textOnScreen': return 'نص شاشة';
            default: return '';
          }
        },
      }),
      CharacterCount,
      TabMenuExtension.configure({
        onOpen: (pos: any) => {
          setMenuPosition(pos);
        },
        onClose: () => {
          setMenuPosition(null);
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }: any) => {
      // ONLY trigger update when the editor is actually focused by the user!
      // This strictly prevents false dirty state triggers during mount/normalization!
      if (!editor.isFocused) return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        const json = editor.getJSON();
        const newBlocks = tiptapToBlocks(json, characters);
        if (onUpdateBlocks) {
          onUpdateBlocks(newBlocks);
        }
      }, 800);
    },
    characters: characters,
    onAddCharacter: onAddCharacter,
  } as any);

  // Sync characters list with editor options
  useEffect(() => {
    if (editor) {
      (editor.options as any).characters = characters;
      (editor.options as any).onAddCharacter = onAddCharacter;
    }
  }, [editor, characters, onAddCharacter]);

  // Sync changes from parent blocks state when NOT focused
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const newContent = blocksToTiptap(initialBlocks, characters);
      const currentJson = editor.getJSON();
      if (JSON.stringify(currentJson) !== JSON.stringify(newContent)) {
        editor.commands.setContent(newContent, false as any);
      }
    }
  }, [initialBlocks, editor, characters]);

  // Clean up on unmount and setup workspace background extraction
  useEffect(() => {
    // Extract workspace background color to perfectly camouflage the physical gap
    const updateWorkspaceBg = () => {
      const workspace = document.querySelector('.bg-secondary\\/30') || document.querySelector('.paper-editor-container')?.parentElement;
      if (workspace) {
        const bgColor = window.getComputedStyle(workspace).backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          document.documentElement.style.setProperty('--workspace-bg', bgColor);
        }
      }
    };
    
    // Slight delay to ensure DOM is fully rendered and styled
    const timer = setTimeout(updateWorkspaceBg, 100);
    
    return () => {
      clearTimeout(timer);
      if (editor) editor.destroy();
    };
  }, [editor]);

  const [totalPages, setTotalPages] = useState(1);
  const paperContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paperContentRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Height of the entire content area
        const height = entry.contentRect.height;
        // With CSS transform, height is already logical (unscaled)
        const pages = Math.max(1, Math.ceil(height / 1151));
        setTotalPages(pages);
      }
    });
    resizeObserver.observe(paperContentRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!editor) {
    return null;
  }

  const scale = paperZoom;
  const totalHeight = totalPages * 1123 + (totalPages - 1) * 28;

  return (
    <div 
      style={{ 
        width: `${794 * scale}px`, 
        height: `${totalHeight * scale}px`,
        flexShrink: 0
      }}
      className="relative"
      onClick={() => setMenuPosition(null)}
    >
      <FloatingToolbar editor={editor} />

      {/* Tab Menu UI */}
      <TabMenu 
        editor={editor} 
        position={menuPosition} 
        onClose={() => {
          setMenuPosition(null);
          editor.commands.focus();
        }} 
      />

      <div
        data-paper-wrapper="true"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `794px`,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <div className="paper-page">
          
          {/* PHYSICAL BACKGROUND PAGES LAYER */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Separate physical pages with premium shadows */}
            {Array.from({ length: totalPages }).map((_, i) => (
              <div 
                key={i} 
                className="absolute w-full bg-white rounded-[2px] overflow-hidden"
                style={{
                  top: `${i * 1151}px`,
                  height: '1123px', /* A4 Height at 96 DPI */
                  left: 0,
                }}
              >
                {showDebugGrid && (
                  <div className="absolute inset-x-[96px] pointer-events-none z-20" style={{ top: '96px', height: '924px' }}>
                    {Array.from({ length: 33 }).map((_, lineIdx) => (
                      <div 
                        key={lineIdx} 
                        className="absolute left-0 right-0 border-t border-indigo-400/25 flex items-center justify-between"
                        style={{ top: `${lineIdx * 28}px`, height: '28px' }}
                      >
                        <span className="text-[9px] font-mono text-indigo-400/40 select-none mr-[-24px]">{lineIdx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showDebugMargins && (
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="absolute left-0 right-0 border-b border-dashed border-rose-500/30" style={{ top: '96px' }} />
                    <div className="absolute left-0 right-0 border-t border-dashed border-rose-500/30" style={{ bottom: '103px' }} />
                    <div className="absolute top-0 bottom-0 border-r border-dashed border-rose-500/30" style={{ left: '96px' }} />
                    <div className="absolute top-0 bottom-0 border-l border-dashed border-rose-500/30" style={{ right: '96px' }} />
                  </div>
                )}

                {/* Episode Running Header (28px high, top 68px) */}
                {scene?.episode_id && (
                  <div 
                    className="absolute left-[96px] right-[96px] select-none flex items-center justify-between text-black font-sans pointer-events-none" 
                    style={{ top: '68px', height: '28px', lineHeight: '28px', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <div className="font-bold">
                      {currentEpisode ? `الحلقة ${currentEpisode.episode_number}` : 'الحلقة ...'}
                    </div>
                    <div className="font-bold">
                      {currentEpisode?.title ? `( ${currentEpisode.title} )` : ''}
                    </div>
                  </div>
                )}

                {/* Page Footer (28px high, top 1048px) */}
                <div 
                  className="absolute left-[96px] right-[96px] select-none flex items-center justify-between text-black font-sans pointer-events-none" 
                  style={{ top: '1048px', height: '28px', lineHeight: '28px', fontSize: '14px', boxSizing: 'border-box' }}
                >
                  <div className="font-bold text-black">{scenarioName || 'مشروع بدون عنوان'}</div>
                  <div className="flex items-center justify-center border-[1.5px] border-black font-bold text-black min-w-[24px] h-[24px] px-1.5 rounded-md text-[13px] bg-white">
                    {startPageNumber + i}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TEXT CONTENT LAYER */}
          <div className="paper-content" ref={paperContentRef}>
            {/* Top Margin for the very first page */}
            <div style={{ height: '96px' }}></div>
            
            {/* Scene Header (Slugline) - Exactly 2 Grid Units High (56px), top of Page 1 */}
            <div 
              className="w-full select-none flex flex-col relative z-10" 
              style={{ height: '56px' }}
            >
              <div className="flex items-center justify-between text-black border-b-[2px] border-black" style={{ fontSize: '18px', height: '28px', lineHeight: '28px', boxSizing: 'border-box' }}>
                <div className="font-bold">مشهد {scene?.scene_number || 1} ( ص 1 )</div>
                <div className="font-bold">( {scene?.title || 'بدون عنوان'} )</div>
              </div>
              <div className="flex items-center justify-between font-bold text-black" style={{ fontSize: '14px', height: '28px', lineHeight: '28px', boxSizing: 'border-box' }}>
                <div className="flex items-center gap-1">
                  {/* Location Type */}
                  <div className="relative group/type inline-block" ref={typeDropdownRef}>
                    <div 
                      onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                      className="inline-flex items-center gap-1 hover:bg-zinc-50 rounded px-1 -mx-1 transition-colors cursor-pointer select-none"
                    >
                      <span>
                        {scene?.location_type === 'INT' ? 'داخلي' : scene?.location_type === 'EXT' ? 'خارجي' : scene?.location_type === 'INT/EXT' ? 'داخلي/خارجي' : (scene?.location_type || 'داخلي')}
                      </span>
                      <div className="opacity-0 group-hover/type:opacity-100 transition-opacity duration-150 flex items-center justify-center w-3.5 h-3.5 rounded border border-zinc-200 bg-white shadow-sm text-zinc-500 hover:text-black">
                        <ChevronDown size={8} strokeWidth={3} />
                      </div>
                    </div>
                    
                    {isTypeDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-zinc-200 rounded-lg shadow-xl z-[9999] flex flex-col p-1 text-right font-sans select-none" dir="rtl">
                        {[
                          { value: 'INT', label: 'داخلي' },
                          { value: 'EXT', label: 'خارجي' },
                          { value: 'INT/EXT', label: 'داخلي/خارجي' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              if (onUpdateScene) onUpdateScene('location_type', opt.value);
                              setIsTypeDropdownOpen(false);
                            }}
                            className="w-full text-right px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-black rounded transition-colors font-medium"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-zinc-400 select-none">/</span>

                  {/* Location Name */}
                  <div className="relative group/loc inline-block" ref={locationDropdownRef}>
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={scene?.location_name || ''}
                        onChange={(e) => {
                          if (onUpdateScene) {
                            onUpdateScene('location_id', null);
                            onUpdateScene('location_name', e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                            editor.commands.focus();
                          }
                        }}
                        placeholder="الموقع..."
                        className="bg-transparent border-none font-bold text-black focus:outline-none focus:bg-zinc-50 rounded px-1 w-36 placeholder:text-zinc-300 inline-block text-right transition-colors"
                      />
                      <div 
                        onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                        className="opacity-0 group-hover/loc:opacity-100 transition-opacity duration-150 flex items-center justify-center w-3.5 h-3.5 rounded border border-zinc-200 bg-white shadow-sm text-zinc-500 hover:text-black cursor-pointer select-none"
                      >
                        <ChevronDown size={8} strokeWidth={3} />
                      </div>
                    </div>
                    
                    {isLocationDropdownOpen && locations.length > 0 && (
                      <div className="absolute right-0 top-full mt-1 w-48 max-h-60 overflow-y-auto bg-white border border-zinc-200 rounded-lg shadow-xl z-[9999] flex flex-col p-1 text-right font-sans select-none" dir="rtl">
                        {locations.map(loc => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              if (onUpdateScene) {
                                onUpdateScene('location_id', loc.id);
                                onUpdateScene('location_name', loc.name);
                              }
                              setIsLocationDropdownOpen(false);
                            }}
                            className="w-full text-right px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-black rounded transition-colors font-medium"
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Time of Day */}
                <div className="relative group/time inline-block text-right" ref={timeDropdownRef}>
                  <div 
                    onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                    className="inline-flex items-center gap-1 hover:bg-zinc-50 rounded px-1 -mx-1 transition-colors cursor-pointer select-none"
                  >
                    <div className="opacity-0 group-hover/time:opacity-100 transition-opacity duration-150 flex items-center justify-center w-3.5 h-3.5 rounded border border-zinc-200 bg-white shadow-sm text-zinc-500 hover:text-black">
                      <ChevronDown size={8} strokeWidth={3} />
                    </div>
                    <span>
                      {timeMap[scene?.time_of_day] || scene?.time_of_day || 'نهار'}
                    </span>
                  </div>

                  {isTimeDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-zinc-200 rounded-lg shadow-xl z-[9999] flex flex-col p-1 text-right font-sans select-none" dir="rtl">
                      {[
                        { value: 'DAY', label: 'نهار' },
                        { value: 'NIGHT', label: 'ليل' },
                        { value: 'DAWN', label: 'فجر' },
                        { value: 'MORNING', label: 'صباح' },
                        { value: 'AFTERNOON', label: 'بعد الظهر' },
                        { value: 'EVENING', label: 'مساء' },
                        { value: 'DUSK', label: 'غروب' },
                        { value: 'LATE_NIGHT', label: 'منتصف الليل' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (onUpdateScene) onUpdateScene('time_of_day', opt.value);
                            setIsTimeDropdownOpen(false);
                          }}
                          className="w-full text-right px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-black rounded transition-colors font-medium"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Spacer between header and editor content (exactly 1 line = 28px) */}
            <div style={{ height: '28px' }}></div>
            
            <EditorContent editor={editor} />
            <GutterSmartAdder editor={editor} scale={scale} />
          </div>
        </div>
      </div>
    </div>
  );
}
