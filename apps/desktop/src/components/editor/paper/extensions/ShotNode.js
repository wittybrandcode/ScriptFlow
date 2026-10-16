import { Node, mergeAttributes } from '@tiptap/core';

export const ShotNode = Node.create({
  name: 'shot',
  group: 'block',
  content: 'inline*',

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
        return editor.commands.splitBlock({ type: 'action' });
      },
    };
  },
});
