import { Node, mergeAttributes } from '@tiptap/core';

export const DialogueNode = Node.create({
  name: 'dialogue',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'div.paper-node-dialogue',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-dialogue paper-block' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // Dialogue continues dialogue until empty. If empty, it exits to Action.
        const { state } = editor;
        const { selection } = state;
        const { empty, $anchor } = selection;
        
        if (empty && $anchor.parent.content.size === 0) {
          // If the dialogue node is empty and we press enter, exit to action
          return editor.commands.clearNodes() && editor.commands.setNode('action');
        }
        
        // Otherwise, split block as dialogue
        return (editor.commands as any).splitBlock({ type: 'dialogue' });
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
            // Delete empty dialogue and focus previous block
            return editor.chain()
              .deleteRange({ from: beforePos, to: beforePos + $anchor.parent.nodeSize })
              .focus(beforePos - 1)
              .run();
          } else {
            // Prevent merging dialogue text backward into character/parenthetical
            return true;
          }
        }
        return false;
      },
    };
  },
});
