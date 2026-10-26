import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CharacterNodeView from './CharacterNodeView';

export const CharacterNode = Node.create({
  name: 'character',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      character_id: {
        default: null,
      },
      tone: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.paper-node-character',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-character paper-block' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CharacterNodeView);
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // Pressing Enter in a Character node creates a Dialogue node
        return editor.commands.splitBlock({ type: 'dialogue' });
      },
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { empty, $anchor } = selection;
        
        if (!empty) return false;
        
        if ($anchor.parentOffset === 0) {
          const beforePos = $anchor.before();
          const parentSize = $anchor.parent.content.size;
          
          if (parentSize === 0) {
            // Delete empty character node and focus previous block
            return editor.chain()
              .deleteRange({ from: beforePos, to: beforePos + $anchor.parent.nodeSize })
              .focus(beforePos - 1)
              .run();
          } else {
            // Prevent merging character text backward into action/slugline
            return true;
          }
        }
        return false;
      },
    };
  },
});
