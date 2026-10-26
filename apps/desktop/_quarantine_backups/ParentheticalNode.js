import { Node, mergeAttributes } from '@tiptap/core';

export const ParentheticalNode = Node.create({
  name: 'parenthetical',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'div.paper-node-parenthetical',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-parenthetical paper-block' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // Pressing Enter in a Parenthetical creates Dialogue
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
            // Delete empty parenthetical and focus previous block
            return editor.chain()
              .deleteRange({ from: beforePos, to: beforePos + $anchor.parent.nodeSize })
              .focus(beforePos - 1)
              .run();
          } else {
            // Prevent merging parenthetical text backward into character
            return true;
          }
        }
        return false;
      },
    };
  },
});
