import * as Comlink from 'comlink';
import { groupBlocksByPage, expandBlocksToLayoutNodes } from '../components/editor/TextMeasurementEngine';

// Grid configuration for pagination calculation
const GRID = {
  PAGE_WIDTH: 794,
  PAGE_HEIGHT: 1123,
  MARGIN_TOP: 96,
  MARGIN_BOTTOM: 103,
  MARGIN_LEFT: 96,
  MARGIN_RIGHT: 96,
  CONTENT_WIDTH: 602,   
  CONTENT_HEIGHT: 924,  
  GRID_UNIT: 28,
  MAX_LINES: 33,        
  SCENE_HEADER_UNITS: 2, 
  PAGE_CYCLE: 1151,     
  FONT_SIZE: 16,
};

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

const NODES_WITH_MARGIN = new Set([
  'character', 'CHARACTER',
  'transition', 'TRANSITION',
  'shot', 'SHOT',
  'audio', 'AUDIO',
  'directorNote', 'DIRECTOR_NOTE',
  'textOnScreen', 'textNode', 'TEXT',
]);

const NARROW_WIDTH_FACTOR: Record<string, number> = {
  dialogue: 0.85,
  DIALOGUE: 0.85,
  parenthetical: 0.75,
  PARENTHETICAL: 0.75,
};

let _ctx: OffscreenCanvasRenderingContext2D | { font: string; measureText: (txt: string) => { width: number } } | null = null;

function getContext() {
  if (!_ctx) {
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(1, 1);
      _ctx = offscreen.getContext('2d');
    } else {
      // Fallback if environment doesn't support OffscreenCanvas
      _ctx = {
        font: '',
        measureText: (txt: string) => ({ width: txt.length * 8 }) // Rough estimate
      };
    }
  }
  return _ctx;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

const _measureCache = new Map<string, number>();
const MAX_CACHE_SIZE = 5000;

function measureBlockLines(text: string, blockType: string): number {
  const cleanText = stripHtml(text);
  const hasMargin = NODES_WITH_MARGIN.has(blockType);
  
  if (!cleanText) {
    return hasMargin ? 2 : 1;
  }
  
  const normalizedType = blockType.toLowerCase();
  const cacheKey = `${normalizedType}:${cleanText.length}:${cleanText}`;
  
  if (_measureCache.has(cacheKey)) {
    const val = _measureCache.get(cacheKey)!;
    _measureCache.delete(cacheKey);
    _measureCache.set(cacheKey, val);
    return val;
  }

  const ctx = getContext();
  if (!ctx) {
    const charLimit = Math.floor(GRID.CONTENT_WIDTH / 10);
    const estimatedLines = Math.max(1, Math.ceil(cleanText.length / charLimit));
    return estimatedLines + (hasMargin ? 1 : 0);
  }
  
  ctx.font = FONTS[normalizedType] || FONTS.action;

  const widthFactor = NARROW_WIDTH_FACTOR[blockType] || NARROW_WIDTH_FACTOR[normalizedType] || 1.0;
  const maxWidth = GRID.CONTENT_WIDTH * widthFactor;

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
  const finalMeasuredLines = measuredLines + (hasMargin ? 1 : 0);
  
  if (_measureCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _measureCache.keys().next().value;
    if (firstKey !== undefined) {
      _measureCache.delete(firstKey);
    }
  }
  _measureCache.set(cacheKey, finalMeasuredLines);
  
  return finalMeasuredLines;
}

export interface PaginationResult {
  success: boolean;
  totalEstimatedPages: number;
  processedScenes: any[];
  error?: string;
}

export interface SingleScenePaginationResult {
  success: boolean;
  pages: any[];
  totalPages: number;
  error?: string;
}

export const ExportWorker = {
  /**
   * Processes scenes in background, calculates text blocks sizing and splits into pages.
   */
  async precalculatePagination(scenes: any[] = [], _characters: any[] = []): Promise<PaginationResult> {
    try {
      if (!Array.isArray(scenes)) {
        throw new Error('Invalid scenes parameter passed to ExportWorker: must be an array');
      }

      console.log('[ExportWorker] Calculating pagination for', scenes.length, 'scenes');
      let totalEstimatedPages = 0;
      
      const processedScenes = scenes.map(scene => {
         let sceneLines = 0;
         const blocks = scene?.blocks || [];
         blocks.forEach((b: any) => {
           const type = b?.type || 'action';
           sceneLines += measureBlockLines(b?.content || '', type);
         });
         
         const scenePages = Math.ceil((sceneLines + GRID.SCENE_HEADER_UNITS) / GRID.MAX_LINES);
         totalEstimatedPages += scenePages;
         
         return {
           ...scene,
           estimatedPages: scenePages
         };
      });

      return {
         success: true,
         totalEstimatedPages,
         processedScenes
      };
    } catch (err: any) {
      console.error('[ExportWorker] Failed to precalculate pagination:', err);
      return {
        success: false,
        error: String(err?.message || err),
        totalEstimatedPages: 0,
        processedScenes: []
      };
    }
  },

  async paginateSingleScene(blocks: any[] = [], characters: any[] = []): Promise<SingleScenePaginationResult> {
    try {
      const layoutNodes = expandBlocksToLayoutNodes(blocks, characters);
      const { pages, totalPages } = groupBlocksByPage(layoutNodes, { hasSceneHeader: true });
      return { success: true, pages, totalPages };
    } catch (err) {
      console.error('[ExportWorker] Failed to paginate scene:', err);
      return { success: false, pages: [], totalPages: 0, error: String(err) };
    }
  }
};

export type IExportWorker = typeof ExportWorker;

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  Comlink.expose(ExportWorker);
}
