/**
 * Data Bridge: Converts Database Blocks <-> Tiptap JSON AST
 */

export interface TiptapMark {
  type: 'bold' | 'italic' | 'underline' | 'highlight';
  attrs?: Record<string, any>;
}

export interface TiptapNode {
  type: string;
  text?: string;
  marks?: TiptapMark[];
  attrs?: Record<string, any>;
  content?: TiptapNode[];
}

export interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
}

export interface ScriptBlockData {
  id: string;
  type: string;
  content?: string | null;
  character_id?: string | null;
  character_name?: string | null;
  metadata?: string | Record<string, any> | null;
  sort_order?: number;
  [key: string]: any;
}

/**
 * Generates a unique block ID if one is missing.
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `blk_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Parses HTML formatted text to Tiptap JSON inline content nodes, preserving bold, italic, underline, highlight marks.
 */
let sharedParser: DOMParser | null = null;

export function htmlToTiptapContent(html?: string | null): TiptapNode[] | undefined {
  if (!html) return undefined;
  
  if (!html.includes('<')) {
    return [{ type: 'text', text: html }];
  }

  if (typeof DOMParser === 'undefined') {
    return [{ type: 'text', text: html.replace(/<[^>]*>/g, '').trim() }];
  }

  if (!sharedParser) {
    sharedParser = new DOMParser();
  }
  const doc = sharedParser.parseFromString(html, 'text/html');
  const result: TiptapNode[] = [];

  function traverse(node: Node, currentMarks: TiptapMark[] = []) {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      if (node.nodeValue) {
        result.push({
          type: 'text',
          text: node.nodeValue,
          marks: currentMarks.length > 0 ? currentMarks : undefined
        });
      }
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const element = node as HTMLElement;
      const newMarks: TiptapMark[] = [...currentMarks];
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'strong' || tagName === 'b') {
        newMarks.push({ type: 'bold' });
      } else if (tagName === 'em' || tagName === 'i') {
        newMarks.push({ type: 'italic' });
      } else if (tagName === 'u') {
        newMarks.push({ type: 'underline' });
      } else if (tagName === 'mark') {
        newMarks.push({ type: 'highlight' });
      }
      
      element.childNodes.forEach(child => traverse(child, newMarks));
    }
  }

  doc.body.childNodes.forEach(child => traverse(child, []));
  return result.length > 0 ? result : undefined;
}

/**
 * Converts Tiptap JSON inline content nodes back to HTML, preserving formatting marks.
 */
export function tiptapContentToHtml(content?: TiptapNode[] | null): string {
  if (!content || !Array.isArray(content)) return '';
  
  return content.map(node => {
    if (node.type !== 'text') return '';
    let text = node.text || '';
    
    // Escape HTML characters to prevent XSS/broken HTML, while preserving formatting marks
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    if (node.marks && Array.isArray(node.marks)) {
      node.marks.forEach(mark => {
        if (mark.type === 'bold') {
          text = `<strong>${text}</strong>`;
        } else if (mark.type === 'italic') {
          text = `<em>${text}</em>`;
        } else if (mark.type === 'underline') {
          text = `<u>${text}</u>`;
        } else if (mark.type === 'highlight') {
          text = `<mark>${text}</mark>`;
        }
      });
    }
    return text;
  }).join('');
}

/**
 * Converts DB blocks to Tiptap JSON AST.
 * Expands DIALOGUE blocks into Character -> [Parenthetical] -> Dialogue nodes.
 */
export function blocksToTiptap(blocks: ScriptBlockData[], characters: any[] = []): TiptapDoc {
  const content: TiptapNode[] = [];

  const sortedBlocks = [...blocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  sortedBlocks.forEach(block => {
    if (block.type === 'DIALOGUE') {
      let metadata: Record<string, any> = {};
      try { 
        metadata = typeof block.metadata === 'string' ? JSON.parse(block.metadata || '{}') : (block.metadata || {}); 
      } catch (e) {}
      
      let charName = characters.find(c => String(c.id) === String(block.character_id))?.name || block.character_name || 'شخصية مجهولة';
      
      // 1. Add Character Node
      content.push({
        type: 'character',
        attrs: { 
          character_id: block.character_id,
          tone: (metadata.tone && metadata.tone !== 'عادي') ? metadata.tone : null
        },
        content: [{ type: 'text', text: charName }]
      });

      // 2. Add Dialogue Node
      content.push({
        type: 'dialogue',
        attrs: { block_id: block.id },
        content: htmlToTiptapContent(block.content)
      });
      
    } else {
      const typeMap: Record<string, string> = {
        'ACTION': 'action',
        'TRANSITION': 'transition',
        'SHOT': 'shot',
        'AUDIO': 'audio',
        'DIRECTOR_NOTE': 'directorNote',
        'TEXT': 'textOnScreen'
      };

      const tiptapType = typeMap[block.type] || 'action';

      content.push({
        type: tiptapType,
        attrs: { block_id: block.id },
        content: htmlToTiptapContent(block.content)
      });
    }
  });

  // Ensure there's at least one empty block if the scene is completely empty
  if (content.length === 0) {
    content.push({ type: 'action' });
  }

  return {
    type: 'doc',
    content: content
  };
}

/**
 * Converts Tiptap JSON AST to DB blocks.
 * Merges Character -> [Parenthetical] -> Dialogue into a single DIALOGUE block.
 */
export function tiptapToBlocks(json: TiptapDoc | null | undefined, characters: any[] = []): ScriptBlockData[] {
  if (!json || !json.content) return [];

  const nodes = json.content;
  const blocks: ScriptBlockData[] = [];
  
  const GAP = 65536;
  let currentSortOrder = GAP;

  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    const textContent = node.content ? node.content.map(n => n.text || '').join('') : '';
    
    if (node.type === 'character') {
      let charName = textContent;
      let tone = node.attrs?.tone || null;
      
      const toneMatch = charName.match(/\(([^)]+)\)$/);
      if (toneMatch) {
        if (!tone) {
          tone = toneMatch[1].trim();
        }
        charName = charName.replace(/\s*\([^)]+\)$/, '').trim();
      }
      
      let dialogText = '';
      let blockId = node.attrs?.block_id || generateId();
      
      let nextIdx = i + 1;
      
      if (nextIdx < nodes.length && nodes[nextIdx].type === 'parenthetical') {
        const pContent = nodes[nextIdx].content;
        let rawTone = pContent ? pContent.map(n => n.text || '').join('') : '';
        if (!tone) {
          tone = rawTone.replace(/^\(|\)$/g, '').trim();
        }
        nextIdx++;
      }
      
      if (nextIdx < nodes.length && nodes[nextIdx].type === 'dialogue') {
        dialogText = tiptapContentToHtml(nodes[nextIdx].content);
        blockId = nodes[nextIdx].attrs?.block_id || blockId;
        
        const safeCharName = charName || '';
        const charMatch = characters.find(c => c.name && c.name.trim() === safeCharName.trim());
        const charId = charMatch ? charMatch.id : null;

        blocks.push({
          id: blockId,
          type: 'DIALOGUE',
          content: dialogText,
          character_id: charId,
          character_name: charName,
          metadata: JSON.stringify(tone ? { tone } : {}),
          sort_order: currentSortOrder
        });
        
        currentSortOrder += GAP;
        i = nextIdx + 1;
        continue;
      } else {
        blocks.push({
          id: blockId,
          type: 'ACTION',
          content: charName,
          sort_order: currentSortOrder
        });
        currentSortOrder += GAP;
        i++;
        continue;
      }
    } 
    
    if (node.type === 'parenthetical') {
      blocks.push({
        id: node.attrs?.block_id || generateId(),
        type: 'DIRECTOR_NOTE',
        content: tiptapContentToHtml(node.content),
        sort_order: currentSortOrder
      });
      currentSortOrder += GAP;
      i++;
      continue;
    }

    if (node.type === 'dialogue') {
      blocks.push({
        id: node.attrs?.block_id || generateId(),
        type: 'DIALOGUE',
        content: tiptapContentToHtml(node.content),
        character_id: null,
        character_name: 'شخصية مجهولة',
        metadata: JSON.stringify({}),
        sort_order: currentSortOrder
      });
      currentSortOrder += GAP;
      i++;
      continue;
    }

    const typeMap: Record<string, string> = {
      'action': 'ACTION',
      'transition': 'TRANSITION',
      'shot': 'SHOT',
      'audio': 'AUDIO',
      'directorNote': 'DIRECTOR_NOTE',
      'textOnScreen': 'TEXT'
    };

    if (typeMap[node.type]) {
      blocks.push({
        id: node.attrs?.block_id || generateId(),
        type: typeMap[node.type],
        content: tiptapContentToHtml(node.content),
        sort_order: currentSortOrder
      });
      currentSortOrder += GAP;
    }

    i++;
  }

  return blocks;
}
