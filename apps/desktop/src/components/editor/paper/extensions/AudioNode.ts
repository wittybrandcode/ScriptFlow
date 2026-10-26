import { Node, mergeAttributes } from '@tiptap/core';

export const AudioNode = Node.create({
  name: 'audio',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'div.paper-node-audio',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-audio paper-block' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        return (editor.commands as any).splitBlock({ type: 'action' });
      },
    };
  },
});
