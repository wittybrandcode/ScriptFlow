import { Node, mergeAttributes } from '@tiptap/core';

export const TransitionNode = Node.create({
  name: 'transition',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'div.paper-node-transition',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-transition paper-block' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        return (editor.commands as any).splitBlock({ type: 'action' });
      },
    };
  },
});
