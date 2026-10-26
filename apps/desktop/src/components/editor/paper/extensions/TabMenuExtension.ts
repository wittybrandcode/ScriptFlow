import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface TabMenuOptions {
  onOpen: (data: { pos: number; coords: { top: number; left: number } }) => void;
  onClose: () => void;
}

export const TabMenuPluginKey = new PluginKey('tabMenu');

export const TabMenuExtension = Extension.create<TabMenuOptions>({
  name: 'tabMenu',

  addOptions() {
    return {
      onOpen: () => {},
      onClose: () => {},
    };
  },

  addProseMirrorPlugins() {
    const { onOpen, onClose } = this.options;

    return [
      new Plugin({
        key: TabMenuPluginKey,
        props: {
          handleKeyDown(view, event) {
            if (event.key === 'Tab') {
              event.preventDefault(); // Always prevent default Tab behavior
              
              const { state } = view;
              const { selection } = state;

              // Calculate the coordinates for the menu popup
              const coords = view.coordsAtPos(selection.from);
              
              // Trigger the React callback to open the menu
              onOpen({
                pos: selection.from,
                coords: {
                  top: coords.top,
                  left: coords.left,
                },
              });

              return true; // Handled
            }
            
            // Close the menu if any other key is pressed
            if (event.key === 'Escape') {
               onClose();
               return false; // Let it propagate if needed
            }
            
            // If they are typing and the menu is open, we probably want to close it, but 
            // the React component can handle its own focus.
            return false;
          },
        },
      }),
    ];
  },
});
