import { Node, mergeAttributes } from '@tiptap/core';

export const ShotNode = Node.create({
  name: 'shot',
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
        tag: 'div.paper-node-shot',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-shot paper-block' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        return editor.chain().splitBlock().setNode('action').run();
      },
    };
  },
});
