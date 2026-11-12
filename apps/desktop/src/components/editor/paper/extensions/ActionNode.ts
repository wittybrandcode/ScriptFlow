import { Node, mergeAttributes } from '@tiptap/core';

export const ActionNode = Node.create({
  name: 'action',
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
        tag: 'div.paper-node-action',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-action paper-block' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        return editor.commands.splitBlock();
      },
    };
  },
});
