import * as Comlink from 'comlink';
import { groupBlocksByPage, expandBlocksToLayoutNodes } from '../components/editor/TextMeasurementEngine';

// نسخة خفيفة ومستقلة من TextMeasurementEngine تعمل في الـ Worker
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

const FONTS = {
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

const NARROW_WIDTH_FACTOR = {
  dialogue: 0.60,
  DIALOGUE: 0.60,
};

let _ctx = null;
function getContext() {
  if (!_ctx) {
    if (typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(1, 1);
      _ctx = offscreen.getContext('2d');
    } else {
      // Fallback if browser doesn't support OffscreenCanvas
      _ctx = {
        font: '',
        measureText: (txt) => ({ width: txt.length * 8 }) // Rough estimate
      };
    }
  }
  return _ctx;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

const _measureCache = new Map();
const MAX_CACHE_SIZE = 5000;

function measureBlockLines(text, blockType) {
  const cleanText = stripHtml(text);
  const hasMargin = NODES_WITH_MARGIN.has(blockType);
  
  if (!cleanText) {
    return hasMargin ? 2 : 1;
  }
  
  const normalizedType = blockType.toLowerCase();
  const cacheKey = `${normalizedType}:${cleanText.length}:${cleanText}`;
  
  if (_measureCache.has(cacheKey)) {
    const val = _measureCache.get(cacheKey);
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

export const ExportWorker = {
  /**
   * يعالج آلاف المشاهد في الخلفية، يحسب أحجام الكتل النصية، ويقسّمها لصفحات جاهزة.
   */
  async precalculatePagination(scenes = [], characters = []) {
    try {
      if (!Array.isArray(scenes)) {
        throw new Error('Invalid scenes parameter passed to ExportWorker: must be an array');
      }

      console.log('[ExportWorker] Calculating pagination for', scenes.length, 'scenes');
      let totalEstimatedPages = 0;
      
      const processedScenes = scenes.map(scene => {
         let sceneLines = 0;
         const blocks = scene?.blocks || [];
         blocks.forEach(b => {
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
    } catch (err) {
      console.error('[ExportWorker] Failed to precalculate pagination:', err);
      return {
        success: false,
        error: String(err?.message || err),
        totalEstimatedPages: 0,
        processedScenes: []
      };
    }
  },

  async paginateSingleScene(blocks = [], characters = []) {
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

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  Comlink.expose(ExportWorker);
}


