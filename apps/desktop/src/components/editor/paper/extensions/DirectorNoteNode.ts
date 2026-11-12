import { Node, mergeAttributes } from '@tiptap/core';

export const DirectorNoteNode = Node.create({
  name: 'directorNote',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      block_id: {
        default: null,
        parseHTML: element => element.getAttribute('data-block-id'),
        renderHTML: attributes => {
          if (!attributes.block_id) return {};
          return { 'data-block-id': attributes.block_id };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.paper-node-director-note',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-director-note paper-block' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        // Continue note, or exit if empty
        const { state } = editor;
        const { selection } = state;
        const { empty, $anchor } = selection;
        
        if (empty && $anchor.parent.content.size === 0) {
          return editor.commands.clearNodes() && editor.commands.setNode('action');
        }
        
        return editor.commands.splitBlock();
      },
    };
  },
});
