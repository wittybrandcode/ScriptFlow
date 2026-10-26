import { Node, mergeAttributes } from '@tiptap/core';

export const TextNode = Node.create({
  name: 'textOnScreen', // "text" is a reserved node type in Prosemirror for inline text
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [
      {
        tag: 'div.paper-node-text',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'paper-node-text paper-block' }), 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { empty, $anchor } = selection;
        
        if (empty && $anchor.parent.content.size === 0) {
          return editor.commands.clearNodes() && editor.commands.setNode('action');
        }
        
        return (editor.commands as any).splitBlock({ type: 'textOnScreen' });
      },
    };
  },
});
