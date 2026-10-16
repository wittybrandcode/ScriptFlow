import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';

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
import { useEditorShortcuts } from './useEditorShortcuts';
import './paper-editor.css';

export interface PaperEditorProps {
  blocks: any[];
  setBlocks: React.Dispatch<React.SetStateAction<any[]>>;
  characters?: any[];
  scene?: any;
  startPageNumber?: number;
  scenarioName?: string;
  episodes?: any[];
}

export default function PaperEditor({
  blocks = [],
  setBlocks,
  characters = [],
  scene,
  startPageNumber = 1,
  scenarioName = 'مشروع بدون عنوان',
  episodes = []
}: PaperEditorProps) {
  const { setSaveStatus } = useUIStore();
  const [tabMenuState, setTabMenuState] = useState<any>({ isOpen: false });
  const isUpdatingFromProps = useRef<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  const handleUpdate = useCallback(({ editor: currentEditor }: any) => {
    if (isUpdatingFromProps.current) return;
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const json = currentEditor.getJSON();
      const updatedBlocks = tiptapToBlocks(json as any, characters);
      setBlocks(updatedBlocks);
      setSaveStatus('saved');
    }, 500);
  }, [characters, setBlocks, setSaveStatus]);

  const editor = useEditor({
    extensions: [
      Document,
      Text,
      BoldExtension,
      ItalicExtension,
      Underline,
      Highlight,
      ActionNode,
      CharacterNode,
      DialogueNode,
      ParentheticalNode,
      TransitionNode,
      ShotNode,
      AudioNode,
      DirectorNoteNode,
      TextNode,
      Placeholder.configure({
        placeholder: 'اكتب تفاصيل السيناريو هنا...',
      }),
      CharacterCount,
      TabMenuExtension.configure({
        onMenuStateChange: (state: any) => setTabMenuState(state),
      }),
      PaginationExtension.configure({
        hasSceneHeader: true,
        startPageNumber: startPageNumber,
        scenarioName: scenarioName,
        scene: scene,
        episodes: episodes
      }),
    ],
    content: blocksToTiptap(blocks, characters),
    autofocus: 'end',
    onUpdate: handleUpdate,
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEditorShortcuts({
    editor,
    onSave: () => setSaveStatus('saved')
  });

  // Sync external blocks into editor AST
  const lastSyncHash = useRef<string>('');
  
  useEffect(() => {
    if (!editor) return;
    
    // Create a fast hash of blocks to avoid full JSON.stringify on AST
    const blocksHash = blocks.map(b => `${b.id}:${b.type}:${b.content?.length || 0}`).join('|');
    
    // If hash matches the last sync, we don't need to overwrite AST
    if (lastSyncHash.current === blocksHash) return;
    
    // Only compare if hash is different
    const currentJson = editor.getJSON();
    const newJson = blocksToTiptap(blocks, characters);

    // Fast check: length mismatch or different structure
    if (currentJson.content?.length !== newJson.content?.length || JSON.stringify(currentJson) !== JSON.stringify(newJson)) {
      isUpdatingFromProps.current = true;
      editor.commands.setContent(newJson, false as any);
      lastSyncHash.current = blocksHash;
      isUpdatingFromProps.current = false;
    }
  }, [blocks, characters, editor]);

  return (
    <div className="relative w-full h-full flex flex-col items-center overflow-y-auto custom-scrollbar p-6 bg-zinc-100">
      <FloatingToolbar editor={editor} />
      
      <div className="relative">
        <GutterSmartAdder editor={editor} scale={1} />
        
        <div className="paper-editor-container bg-white shadow-xl rounded-sm">
          <EditorContent editor={editor} />
        </div>
      </div>

      {tabMenuState.isOpen && (
        <TabMenu 
          editor={editor}
          position={(tabMenuState as any).position || tabMenuState}
          onClose={() => setTabMenuState({ isOpen: false })}
        />
      )}
    </div>
  );
}
