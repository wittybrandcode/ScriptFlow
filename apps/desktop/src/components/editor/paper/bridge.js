/**
 * Data Bridge: Converts Database Blocks <-> Tiptap JSON AST
 */

/**
 * Generates a unique block ID if one is missing.
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Parses HTML formatted text to Tiptap JSON inline content nodes, preserving bold, italic, underline, highlight marks.
 */
export function htmlToTiptapContent(html) {
  if (!html) return undefined;
  
  if (!html.includes('<')) {
    return [{ type: 'text', text: html }];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const result = [];

  function traverse(node, currentMarks = []) {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      if (node.nodeValue) {
        result.push({
          type: 'text',
          text: node.nodeValue,
          marks: currentMarks.length > 0 ? currentMarks : undefined
        });
      }
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const newMarks = [...currentMarks];
      const tagName = node.tagName.toLowerCase();
      
      if (tagName === 'strong' || tagName === 'b') {
        newMarks.push({ type: 'bold' });
      } else if (tagName === 'em' || tagName === 'i') {
        newMarks.push({ type: 'italic' });
      } else if (tagName === 'u') {
        newMarks.push({ type: 'underline' });
      } else if (tagName === 'mark') {
        newMarks.push({ type: 'highlight' });
      }
      
      node.childNodes.forEach(child => traverse(child, newMarks));
    }
  }

  doc.body.childNodes.forEach(child => traverse(child, []));
  return result.length > 0 ? result : undefined;
}

/**
 * Converts Tiptap JSON inline content nodes back to HTML, preserving formatting marks.
 */
export function tiptapContentToHtml(content) {
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
 * @param {Array} blocks Array of block objects from DB
 * @param {Array} characters Array of character objects from DB
 * @returns {Object} Tiptap JSON Document
 */
export function blocksToTiptap(blocks, characters = []) {
  const content = [];

  // Sort blocks by sort_order
  const sortedBlocks = [...blocks].sort((a, b) => a.sort_order - b.sort_order);

  sortedBlocks.forEach(block => {
    if (block.type === 'DIALOGUE') {
      let metadata = {};
      try { metadata = JSON.parse(block.metadata || '{}'); } catch (e) {}
      
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

      // 3. Add Dialogue Node
      content.push({
        type: 'dialogue',
        attrs: { block_id: block.id }, // Preserve original block ID for updates
        content: htmlToTiptapContent(block.content)
      });
      
    } else {
      // 1-to-1 Mapping
      let typeMap = {
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
 * Turns orphan Parentheticals into DIRECTOR_NOTEs.
 * @param {Object} json Tiptap JSON Document
 * @param {Array} characters Array of character objects to resolve IDs
 * @returns {Array} Array of block objects ready for DB
 */
export function tiptapToBlocks(json, characters = []) {
  if (!json || !json.content) return [];

  const nodes = json.content;
  const blocks = [];
  
  const GAP = 65536;
  let currentSortOrder = GAP;

  let i = 0;
  while (i < nodes.length) {
    const node = nodes[i];
    const textContent = node.content ? node.content.map(n => n.text).join('') : '';
    
    // Skip completely empty action nodes at the end, etc.
    // Actually we keep empty action nodes if user intended blank space, or we can filter them out.
    // For now, we process everything to keep visual fidelity.
    
    if (node.type === 'character') {
      // Look ahead to see if Dialogue follows
      let charName = textContent;
      let tone = node.attrs?.tone || null;
      
      // Fallback/compatibility: Try to extract inline tone (e.g. if loaded from old data or pasted raw text)
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
      
      // Check for separate Parenthetical node if tone was not found
      if (nextIdx < nodes.length && nodes[nextIdx].type === 'parenthetical') {
        let rawTone = nodes[nextIdx].content ? nodes[nextIdx].content.map(n => n.text).join('') : '';
        if (!tone) {
          tone = rawTone.replace(/^\(|\)$/g, '').trim();
        }
        nextIdx++;
      }
      
      // Check for Dialogue
      if (nextIdx < nodes.length && nodes[nextIdx].type === 'dialogue') {
        dialogText = tiptapContentToHtml(nodes[nextIdx].content);
        blockId = nodes[nextIdx].attrs?.block_id || blockId; // Try to use original dialogue ID
        
        // Find Character ID
        const charMatch = characters.find(c => c.name.trim() === charName.trim());
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
        i = nextIdx + 1; // Skip the processed nodes
        continue;
      } else {
        // Character without dialogue? Treat as ACTION or just ignore?
        // A character name standing alone might be a mistake. 
        // Let's convert it to ACTION to preserve text.
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
      // Orphan parenthetical
      blocks.push({
        id: node.attrs?.block_id || generateId(),
        type: 'DIRECTOR_NOTE', // Converted as per plan
        content: tiptapContentToHtml(node.content),
        sort_order: currentSortOrder
      });
      currentSortOrder += GAP;
      i++;
      continue;
    }

    if (node.type === 'dialogue') {
      // Orphan dialogue (dialogue without a character above it).
      // We assign it to an "Unknown" character or previous character.
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

    // Direct Mappings
    let typeMap = {
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
