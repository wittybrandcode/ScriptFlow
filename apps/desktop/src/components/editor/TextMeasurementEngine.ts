/**
 * TextMeasurementEngine.ts
 * Unified text measurement utility for ScriptFlow Enterprise
 * 
 * Shared between PaperEditor (PaginationExtension) and ScenePaperRenderer
 * to guarantee identical page-break calculations across all editor modes.
 * 
 * Grid System: 794×1123px (A4 at 96 DPI)
 * Content Area: 602×924px
 * Grid Unit: 28px | Lines per page: 33
 */

export interface GridConfig {
  PAGE_WIDTH: number;
  PAGE_HEIGHT: number;
  MARGIN_TOP: number;
  MARGIN_BOTTOM: number;
  MARGIN_LEFT: number;
  MARGIN_RIGHT: number;
  CONTENT_WIDTH: number;
  CONTENT_HEIGHT: number;
  GRID_UNIT: number;
  MAX_LINES: number;
  SCENE_HEADER_UNITS: number;
  PAGE_CYCLE: number;
  FONT_SIZE: number;
}

// === Unified Grid Constants ===
export const GRID: GridConfig = {
  PAGE_WIDTH: 794,
  PAGE_HEIGHT: 1123,
  MARGIN_TOP: 96,
  MARGIN_BOTTOM: 103,
  MARGIN_LEFT: 96,
  MARGIN_RIGHT: 96,
  CONTENT_WIDTH: 602,   // 794 - 96 - 96
  CONTENT_HEIGHT: 924,  // 1123 - 96 - 103
  GRID_UNIT: 28,
  MAX_LINES: 33,        // 924 / 28
  SCENE_HEADER_UNITS: 2, // 2 × 28 = 56px
  PAGE_CYCLE: 1151,     // 1123 + 28 (page + gap)
  FONT_SIZE: 16,
};

// === Font Definitions ===
const FONTS: Record<string, string> = {
  action:        '400 16px "IBM Plex Sans Arabic", sans-serif',
  character:     '700 18px "IBM Plex Sans Arabic", sans-serif',
  parenthetical: 'italic 500 14px "IBM Plex Sans Arabic", sans-serif',
  dialogue:      '500 16px "IBM Plex Sans Arabic", sans-serif',
  transition:    '800 14px "IBM Plex Sans Arabic", sans-serif',
  shot:          '800 14px "IBM Plex Sans Arabic", sans-serif',
  audio:         '700 14px "IBM Plex Sans Arabic", sans-serif',
  directorNote:  '500 14px "IBM Plex Sans Arabic", sans-serif',
  textOnScreen:  '700 14px monospace, "IBM Plex Sans Arabic"',
  textNode:      '700 14px monospace, "IBM Plex Sans Arabic"',
};

// Nodes that consume 1 extra grid unit for top margin
export const NODES_WITH_MARGIN = new Set<string>([
  'character', 'CHARACTER',
  'transition', 'TRANSITION',
  'shot', 'SHOT',
  'audio', 'AUDIO',
  'directorNote', 'DIRECTOR_NOTE',
  'textOnScreen', 'textNode', 'TEXT',
]);

// Nodes that use narrower width
const NARROW_WIDTH_FACTOR: Record<string, number> = {
  dialogue: 0.85,
  DIALOGUE: 0.85,
  parenthetical: 0.75,
  PARENTHETICAL: 0.75,
};

// Singleton canvas for measurement (reused across calls)
let _canvas: HTMLCanvasElement | null = null;
let _ctx: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!_ctx) {
    _canvas = document.createElement('canvas');
    _ctx = _canvas.getContext('2d');
  }
  return _ctx;
}

/**
 * Strip HTML tags from a string to get pure text content.
 * Ensures Canvas API measures only visible characters.
 */
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Simple LRU Cache for measurements to prevent UI thread hijacking
 */
const _measureCache = new Map<string, number>();
const MAX_CACHE_SIZE = 5000;

/**
 * Measure how many grid lines a text block consumes.
 * Automatically strips HTML tags for consistent measurement.
 * Utilizes an LRU Cache to return O(1) for repeated measurements.
 * 
 * @param text - The text content (plain or HTML)
 * @param blockType - The block type (e.g. 'action', 'dialogue', 'CHARACTER')
 * @returns Total grid lines consumed (including margin)
 */
export function measureBlockLines(text: string | undefined | null, blockType: string): number {
  const cleanText = stripHtml(text);
  const hasMargin = NODES_WITH_MARGIN.has(blockType);
  
  if (!cleanText) {
    return hasMargin ? 2 : 1;
  }

  const normalizedType = blockType.toLowerCase();
  const cacheKey = `${normalizedType}:${cleanText.length}:${cleanText}`;
  
  if (_measureCache.has(cacheKey)) {
    // Bring to front (LRU)
    const val = _measureCache.get(cacheKey)!;
    _measureCache.delete(cacheKey);
    _measureCache.set(cacheKey, val);
    return val;
  }
  
  const ctx = getContext();
  
  if (!ctx) {
    // Canvas fallback estimation if running in SSR / Headless environment
    const charLimit = Math.floor(GRID.CONTENT_WIDTH / 10);
    const estimatedLines = Math.max(1, Math.ceil(cleanText.length / charLimit));
    const result = estimatedLines + (hasMargin ? 1 : 0);
    return result;
  }

  // Determine font
  const fontStr = FONTS[normalizedType] || FONTS.action;
  ctx.font = fontStr;

  // Determine max width
  const widthFactor = NARROW_WIDTH_FACTOR[blockType] || NARROW_WIDTH_FACTOR[normalizedType] || 1.0;
  const maxWidth = GRID.CONTENT_WIDTH * widthFactor;

  // Word-wrap measurement (uses cleaned text, no HTML tags)
  const words = cleanText.split(' ');
  let currentLine = '';
  let measuredLines = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? (currentLine + ' ' + word) : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      measuredLines++;
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  // Add margin unit for nodes that have margin-top
  const finalMeasuredLines = measuredLines + (hasMargin ? 1 : 0);
  
  // Save to Cache
  if (_measureCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _measureCache.keys().next().value;
    if (firstKey !== undefined) {
      _measureCache.delete(firstKey);
    }
  }
  _measureCache.set(cacheKey, finalMeasuredLines);
  
  return finalMeasuredLines;
}

export interface LayoutBlockNode {
  id: string;
  type: string;
  content?: string;
  textContent?: string;
  character_id?: string | null;
  character_name?: string;
  tone?: string;
  metadata?: string | Record<string, any>;
  sort_order?: number;
}

export interface GroupPage {
  pageNumber: number;
  blocks: LayoutBlockNode[];
}

export interface GroupBlocksResult {
  pages: GroupPage[];
  totalPages: number;
}

export interface GroupBlocksOptions {
  hasSceneHeader?: boolean;
}

/**
 * Group blocks into pages based on line calculations.
 * This is the SINGLE SOURCE OF TRUTH for pagination across all editor modes.
 */
export function groupBlocksByPage(blocks: LayoutBlockNode[], options: GroupBlocksOptions = {}): GroupBlocksResult {
  const { hasSceneHeader = true } = options;
  
  let lineCount = hasSceneHeader ? (GRID.SCENE_HEADER_UNITS + 1) : 0; // 3 lines header + 1 line spacer
  let currentPageBlocks: LayoutBlockNode[] = [];
  const pages: GroupPage[] = [];
  let pageNumber = 1;

  let lastType: string | null = null;
  let lastBlock: LayoutBlockNode | null = null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const text = block.content || block.textContent || '';
    const type = block.type || 'action';
    
    // Measure total lines consumed by this block
    const nodeLines = measureBlockLines(text, type);
    
    // Check if this block will be the first on the current page (meaning its margin-top is ignored in CSS)
    const isFirstBlockOnPage = (currentPageBlocks.length === 0);
    let currentBlockLines = nodeLines;
    if (isFirstBlockOnPage && NODES_WITH_MARGIN.has(type)) {
      currentBlockLines = Math.max(1, nodeLines - 1);
    }

    if (lineCount + currentBlockLines > GRID.MAX_LINES) {
      // ORPHAN RULE: dialogue after character → pull character to next page
      const normalType = type.toLowerCase();
      const normalLast = lastType ? lastType.toLowerCase() : null;
      
      let wasPulled = false;
      if ((normalType === 'dialogue') && (normalLast === 'character') && lastBlock) {
        currentPageBlocks.pop();
        wasPulled = true;
      }
      
      // Close current page
      pages.push({ pageNumber, blocks: [...currentPageBlocks] });
      pageNumber++;
      
      // Start new page
      if (wasPulled && lastBlock) {
        let lastLines = measureBlockLines(lastBlock.content || lastBlock.textContent || '', lastBlock.type || 'action');
        if (NODES_WITH_MARGIN.has(lastBlock.type || 'action')) {
          lastLines = Math.max(1, lastLines - 1);
        }
        currentPageBlocks = [lastBlock, block];
        lineCount = (GRID.SCENE_HEADER_UNITS + 1) + lastLines + nodeLines;
      } else {
        currentPageBlocks = [block];
        let firstNodeLines = nodeLines;
        if (NODES_WITH_MARGIN.has(type)) {
          firstNodeLines = Math.max(1, nodeLines - 1);
        }
        lineCount = (GRID.SCENE_HEADER_UNITS + 1) + firstNodeLines;
      }
    } else {
      currentPageBlocks.push(block);
      lineCount += currentBlockLines;
    }

    lastType = type;
    lastBlock = block;
  }

  // Don't forget the last page
  if (currentPageBlocks.length > 0) {
    pages.push({ pageNumber, blocks: currentPageBlocks });
  }

  if (pages.length === 0) {
    pages.push({ pageNumber: 1, blocks: [] });
  }

  return { pages, totalPages: pages.length };
}

/**
 * Expands database blocks into a flat list of ProseMirror-compatible layout nodes.
 */
export function expandBlocksToLayoutNodes(blocks: any[], characters: any[] = []): LayoutBlockNode[] {
  const nodes: LayoutBlockNode[] = [];
  
  // Sort blocks by sort_order
  const sortedBlocks = [...blocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  sortedBlocks.forEach(block => {
    const rawType = String(block.type || 'action');
    const upperType = rawType.toUpperCase();

    if (upperType === 'DIALOGUE') {
      let metadata: Record<string, any> = {};
      try { 
        metadata = typeof block.metadata === 'string' ? JSON.parse(block.metadata || '{}') : (block.metadata || {}); 
      } catch (e) {}
      
      const char = Array.isArray(characters) ? characters.find(c => String(c.id) === String(block.character_id)) : null;
      let charName = char ? char.name : (block.character_name || 'شخصية');
      
      if (metadata.tone && metadata.tone !== 'عادي') {
        charName = `${charName} (${metadata.tone})`;
      }
      
      nodes.push({
        id: `${block.id}-char`,
        type: 'character',
        content: charName,
        character_id: block.character_id,
        character_name: charName
      });

      nodes.push({
        id: block.id,
        type: 'dialogue',
        content: block.content || '',
        character_id: block.character_id,
        character_name: charName,
        metadata: block.metadata
      });
    } else {
      const typeMap: Record<string, string> = {
        'ACTION': 'action',
        'ACTION_TEXT': 'action',
        'CHARACTER': 'character',
        'PARENTHETICAL': 'parenthetical',
        'DIALOGUE': 'dialogue',
        'TRANSITION': 'transition',
        'SHOT': 'shot',
        'AUDIO': 'audio',
        'DIRECTOR_NOTE': 'directorNote',
        'DIRECTORNOTE': 'directorNote',
        'TEXT': 'textOnScreen',
        'TEXTONSCREEN': 'textOnScreen'
      };
      
      const normalizedType = typeMap[upperType] || rawType.toLowerCase();
      
      nodes.push({
        id: block.id,
        type: normalizedType,
        content: block.content || '',
        tone: block.tone,
        metadata: block.metadata
      });
    }
  });

  return nodes;
}

/**
 * Calculates the exact page eighths for a scene based on its text layout lines.
 */
export function calculateSceneEighths(blocks: any[], characters: any[] = []): number {
  if (!blocks || blocks.length === 0) return 0;
  
  const layoutNodes = expandBlocksToLayoutNodes(blocks, characters);
  let totalLines = GRID.SCENE_HEADER_UNITS + 1;
  
  layoutNodes.forEach(node => {
    const text = node.content || node.textContent || '';
    const type = node.type || 'action';
    totalLines += measureBlockLines(text, type);
  });
  
  const rawEighths = (totalLines / GRID.MAX_LINES) * 8;
  return Math.ceil(rawEighths);
}
