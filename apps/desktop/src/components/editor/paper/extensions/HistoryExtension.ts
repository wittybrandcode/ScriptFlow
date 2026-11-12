import { Extension } from '@tiptap/core';
import { history, undo, redo } from 'prosemirror-history';

export const HistoryExtension = Extension.create({
  name: 'history',

  addProseMirrorPlugins() {
    return [history()];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => undo(this.editor.state, this.editor.view.dispatch),
      'Mod-y': () => redo(this.editor.state, this.editor.view.dispatch),
      'Shift-Mod-z': () => redo(this.editor.state, this.editor.view.dispatch),
    };
  },
});

