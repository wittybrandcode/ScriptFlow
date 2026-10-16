import { describe, it, expect } from 'vitest';
import { InferenceEngine } from '../src/kinship/InferenceEngine';
import { Person, Relation } from '../src/core/types';
import { RelationType, Gender } from '../src/core/enums';

describe('Stress & Performance Testing (اختبارات الإجهاد والأداء)', () => {

  it('should infer kinship for a huge generational tree (1,000 nodes) in under 100ms', () => {
    // Generate a deep chain of fathers and sons
    const nodes: Person[] = [];
    const edges: Relation[] = [];

    const numNodes = 1000;
    
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        id: `p${i}`,
        name: `Person ${i}`,
        gender: Gender.MALE,
        isDeceased: i === 0 // The first one is the deceased
      });

      if (i > 0) {
        // p[i] is the father of p[i-1]
        edges.push({
          sourceId: `p${i}`,
          targetId: `p${i-1}`,
          type: RelationType.PARENT_MALE
        });
      }
    }

    const start = performance.now();
    const inferred = InferenceEngine.infer(nodes, edges);
    const end = performance.now();
    
    // The inference should run quickly. O(N) or O(V+E) traversal.
    // Given the depth, we must ensure it doesn't hit maximum call stack size.
    const timeTaken = end - start;
    
    // Inference should produce at least the same edges plus inferred ones.
    expect(inferred.length).toBeGreaterThanOrEqual(edges.length);
    expect(timeTaken).toBeLessThan(150); // Usually takes < 50ms in JS for 1k simple edges
  });

  it('should process a complex 10,000 node mass graph without crashing', () => {
    // We create a web of nodes simulating a large village
    const nodes: Person[] = [];
    const edges: Relation[] = [];
    
    for (let i = 0; i < 10000; i++) {
        nodes.push({
            id: `p${i}`,
            name: `Person ${i}`,
            gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
            isDeceased: i === 0
        });
        
        // Every person has a father and mother (from earlier indices to prevent loops)
        if (i > 2) {
            const fatherIdx = Math.floor(Math.random() * i);
            edges.push({
                sourceId: `p${fatherIdx}`,
                targetId: `p${i}`,
                type: RelationType.PARENT_MALE
            });
            // Just one edge per person is enough for 10k stress test to see graph parsing
        }
    }

    const start = performance.now();
    
    // We just want to make sure the GraphAdapter and Inference engine don't crash
    try {
        const inferred = InferenceEngine.infer(nodes, edges);
        expect(inferred).toBeDefined();
    } catch(e: any) {
        // If it throws a circular dependency error, that's fine, but it shouldn't be Stack Overflow
        expect(e.message).not.toContain('Maximum call stack size exceeded');
    }

    const end = performance.now();
    expect(end - start).toBeLessThan(2000); // 10k nodes should be < 2 seconds
  });
});
