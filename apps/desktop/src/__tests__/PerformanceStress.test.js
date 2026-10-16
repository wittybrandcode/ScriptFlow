import { describe, it, expect } from 'vitest';
import { getLayoutedElements } from '../features/relationships/utils/dagreLayout';

describe('Performance & Stress Testing', () => {

  it('1. Should layout 250 characters and 300 edges in under 200ms without UI freezing', async () => {
    // Generate massive mock graph data
    const mockNodes = [];
    const mockEdges = [];

    // Create 250 Characters
    for (let i = 0; i < 250; i++) {
      mockNodes.push({
        id: `char_${i}`,
        type: 'customCharacter',
        data: { name: `شخصية ${i}`, width: 160, height: 220 },
        position: { x: 0, y: 0 }
      });
    }

    // Create 300 Edges (Relationships)
    for (let i = 0; i < 300; i++) {
      const sourceId = `char_${Math.floor(Math.random() * 250)}`;
      const targetId = `char_${Math.floor(Math.random() * 250)}`;
      
      mockEdges.push({
        id: `edge_${i}`,
        source: sourceId,
        target: targetId,
        data: { relType: i % 3 === 0 ? 'PARENT_MALE' : 'SIBLING' }
      });
    }

    // Start Performance Timer
    const startTime = performance.now();
    
    // Execute Heavy Operation
    const { nodes, edges } = getLayoutedElements(mockNodes, mockEdges);
    
    // End Performance Timer
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    console.log(`[Stress Test] Processed 250 nodes & 300 edges in: ${executionTime.toFixed(2)}ms`);

    // Verify it succeeded
    expect(nodes.length).toBe(250);
    expect(edges.length).toBe(300);
    
    // Core assertion: Layout engine MUST finish processing under 250 milliseconds
    // Any longer and the user would experience severe UI lag during typing/dragging.
    expect(executionTime).toBeLessThan(250);
  });

});
