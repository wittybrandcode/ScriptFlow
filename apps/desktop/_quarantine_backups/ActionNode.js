import { Node, mergeAttributes } from '@tiptap/core';

export const ActionNode = Node.create({
  name: 'action',
  group: 'block',
  content: 'inline*',

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
        // Pressing Enter in an Action node creates another Action node
        return editor.commands.splitBlock({ type: 'action' });
      },
    };
  },
});
