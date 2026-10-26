import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { measureBlockLines, GRID, NODES_WITH_MARGIN } from '../../TextMeasurementEngine';

export const PaginationExtension = Extension.create({
  name: 'pagination',
  
  addOptions() {
    return {
      scene: null,
    }
  },

  addProseMirrorPlugins() {
    const options = this.options;
    
    return [
      new Plugin({
        key: new PluginKey('pagination'),
        state: {
          init() { return DecorationSet.empty; },
          apply(tr, oldSet, oldState, newState) {
            const decos = [];
            
            // Use the SAME line-counting logic as groupBlocksByPage
            let lineCount = GRID.SCENE_HEADER_UNITS + 1;
            let pageNumber = 1;
            let isFirstBlockOnPage = true;
            
            let lastNodeName = null;
            let lastNodeOffset = -1;
            let lastNodeLines = 0;
            
            newState.doc.forEach((node, offset) => {
              const text = node.textContent;
              const type = node.type.name;
              
              // Use the SHARED measureBlockLines function
              const nodeLines = measureBlockLines(text, type);
              
              // Determine line height of the block considering whether it is first on the page
              let currentBlockLines = nodeLines;
              if (isFirstBlockOnPage && NODES_WITH_MARGIN.has(type)) {
                currentBlockLines = Math.max(1, nodeLines - 1);
              }
              
              if (lineCount + currentBlockLines > GRID.MAX_LINES) {
                let breakOffset = offset;
                const isOrphanDialogue = (type === 'dialogue' && lastNodeName === 'character');
                
                const previousLines = isOrphanDialogue 
                  ? (lineCount - lastNodeLines) 
                  : lineCount;
                
                // ORPHAN RULE (same as groupBlocksByPage)
                if (isOrphanDialogue) {
                  breakOffset = lastNodeOffset;
                  // Character node is pulled to the next page, becoming its first block:
                  let lastNodeLinesOnNewPage = lastNodeLines;
                  if (NODES_WITH_MARGIN.has(lastNodeName)) {
                    lastNodeLinesOnNewPage = Math.max(1, lastNodeLines - 1);
                  }
                  lineCount = GRID.SCENE_HEADER_UNITS + 1 + lastNodeLinesOnNewPage + nodeLines;
                  isFirstBlockOnPage = false; // Dialogue block is the second block on the new page
                } else {
                  let firstNodeLinesOnNewPage = nodeLines;
                  if (NODES_WITH_MARGIN.has(type)) {
                    firstNodeLinesOnNewPage = Math.max(1, nodeLines - 1);
                  }
                  lineCount = GRID.SCENE_HEADER_UNITS + 1 + firstNodeLinesOnNewPage;
                  isFirstBlockOnPage = false; // The current node is the first block, so the next block is not
                }
                
                pageNumber++;
                const currentPageNumber = pageNumber;
                
                const locType = options.scene?.location_type === 'INT' ? 'داخلي' : options.scene?.location_type === 'EXT' ? 'خارجي' : options.scene?.location_type || '';
                const timeOfDay = options.scene?.time_of_day === 'DAY' ? 'نهار' : options.scene?.time_of_day === 'NIGHT' ? 'ليل' : options.scene?.time_of_day || '';
                const scenarioName = options.scenarioName || 'مشروع بدون عنوان';
                
                const widget = Decoration.widget(breakOffset, () => {
                  const el = document.createElement('div');
                  el.className = 'paper-page-break-widget';
                  
                  const bottomMarginPx = GRID.PAGE_HEIGHT - GRID.MARGIN_TOP - (previousLines * GRID.GRID_UNIT);
                  
                  el.innerHTML = `
                    <div style="display: flex; flex-direction: column; width: 100%;">
                      <div style="height: ${bottomMarginPx}px; position: relative;">
                        <!-- Footers are drawn by the physical background pages layer in PaperEditor.jsx -->
                      </div>
                      <div style="height: ${GRID.GRID_UNIT}px"></div>
                      <div style="height: ${GRID.MARGIN_TOP}px"></div>
                      
                      <div class="w-full select-none flex flex-col relative z-10" style="height: ${GRID.SCENE_HEADER_UNITS * GRID.GRID_UNIT}px; box-sizing: border-box;">
                        <div class="flex items-center justify-between text-black border-b-[2px] border-black" style="font-size: 18px; height: 28px; line-height: 28px; box-sizing: border-box;">
                          <div class="font-bold">مشهد ${options.scene?.scene_number || 1} ( ص ${currentPageNumber} ) <span style="font-size: 12px;">(تابع)</span></div>
                          <div class="font-bold">( ${options.scene?.title || 'بدون عنوان'} )</div>
                        </div>
                        <div class="flex items-center justify-between font-bold text-black" style="font-size: 14px; height: 28px; line-height: 28px; box-sizing: border-box;">
                          <span>${locType} / ${options.scene?.location_name || '...'}</span>
                          <span>${timeOfDay}</span>
                        </div>
                      </div>
                      
                      <div style="height: 28px;"></div>
                    </div>
                  `;
                  return el;
                });
                
                decos.push(widget);
              } else {
                lineCount += currentBlockLines;
                isFirstBlockOnPage = false;
              }
              
              lastNodeName = node.type.name;
              lastNodeOffset = offset;
              lastNodeLines = nodeLines;
            });
            
            return DecorationSet.create(newState.doc, decos);
          }
        },
        props: {
          decorations(state) {
            return this.getState(state);
          }
        }
      })
    ];
  }
});
