import { useEffect } from 'react';
import { Editor } from '@tiptap/react';

export interface UseEditorShortcutsProps {
  editor: Editor | null;
  onSave?: () => void;
}

export function useEditorShortcuts({ editor, onSave }: UseEditorShortcutsProps) {
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for manual save trigger
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (onSave) onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, onSave]);
}
