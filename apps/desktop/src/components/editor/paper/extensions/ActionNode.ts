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
        return (editor.commands as any).splitBlock({ type: 'action' });
      },
    };
  },
});
