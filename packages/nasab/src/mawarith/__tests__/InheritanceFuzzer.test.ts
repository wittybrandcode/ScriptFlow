import { describe, it } from 'vitest';
import fc from 'fast-check';
import { Person, Relation } from '../../core/types';
import { Gender, RelationType } from '../../core/enums';
import { InheritanceEngine } from '../InheritanceEngine';
import Fraction from '../../core/Fraction';

function generateRandomGraph() {
  return fc.record({
    hasSpouse: fc.boolean(),
    numSons: fc.integer({ min: 0, max: 10 }),
    numDaughters: fc.integer({ min: 0, max: 10 }),
    hasFather: fc.boolean(),
    hasMother: fc.boolean(),
    numBrothers: fc.integer({ min: 0, max: 5 }),
    numSisters: fc.integer({ min: 0, max: 5 }),
    numPaternalBrothers: fc.integer({ min: 0, max: 5 }),
    numPaternalSisters: fc.integer({ min: 0, max: 5 }),
    numMaternalSiblings: fc.integer({ min: 0, max: 5 }),
  }).map(state => {
    const nodes: Person[] = [
      { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true }
    ];
    const edges: Relation[] = [];

    let nodeId = 1;

    if (state.hasSpouse) {
      nodes.push({ id: `n_${nodeId}`, name: 'زوجة', gender: Gender.FEMALE, isDeceased: false });
      edges.push({ sourceId: `n_${nodeId}`, targetId: 'dead', type: RelationType.SPOUSE_FEMALE });
      nodeId++;
    }

    if (state.hasFather) {
      nodes.push({ id: `n_${nodeId}`, name: 'أب', gender: Gender.MALE, isDeceased: false });
      edges.push({ sourceId: `n_${nodeId}`, targetId: 'dead', type: RelationType.PARENT_MALE });
      nodeId++;
    }

    if (state.hasMother) {
      nodes.push({ id: `n_${nodeId}`, name: 'أم', gender: Gender.FEMALE, isDeceased: false });
      edges.push({ sourceId: `n_${nodeId}`, targetId: 'dead', type: RelationType.PARENT_FEMALE });
      nodeId++;
    }

    for (let i=0; i<state.numSons; i++) {
      nodes.push({ id: `n_${nodeId}`, name: 'ابن', gender: Gender.MALE, isDeceased: false });
      edges.push({ sourceId: 'dead', targetId: `n_${nodeId}`, type: RelationType.PARENT_MALE });
      nodeId++;
    }

    for (let i=0; i<state.numDaughters; i++) {
      nodes.push({ id: `n_${nodeId}`, name: 'بنت', gender: Gender.FEMALE, isDeceased: false });
      edges.push({ sourceId: 'dead', targetId: `n_${nodeId}`, type: RelationType.PARENT_MALE });
      nodeId++;
    }

    for (let i=0; i<state.numBrothers; i++) {
      nodes.push({ id: `n_${nodeId}`, name: 'أخ شقيق', gender: Gender.MALE, isDeceased: false });
      edges.push({ sourceId: `n_${nodeId}`, targetId: 'dead', type: RelationType.SIBLING_MALE });
      nodeId++;
    }

    for (let i=0; i<state.numSisters; i++) {
      nodes.push({ id: `n_${nodeId}`, name: 'أخت شقيقة', gender: Gender.FEMALE, isDeceased: false });
      edges.push({ sourceId: `n_${nodeId}`, targetId: 'dead', type: RelationType.SIBLING_FEMALE });
      nodeId++;
    }

    // You could also add half-siblings, but full siblings are enough to test the engine complexity for fuzzing.
    
    return { nodes, edges };
  });
}

describe('InheritanceEngine - Fuzz Testing (Property-Based)', () => {
  it('يجب أن يكون مجموع كسور الأسهم مساوياً لـ 1 أو أقل (في حال الرد بدون أصحاب الفروض المناسبين)', () => {
    // running 1000 times as a basic fuzz test
    fc.assert(
      fc.property(generateRandomGraph(), ({ nodes, edges }) => {
        
        // At least one survivor to test correctly
        if (nodes.length <= 1) return true;

        const results = InheritanceEngine.calculate('dead', nodes, edges, 'SHAFII');

        // Sum up all exactShares
        let sum = new Fraction(0n, 1n);
        for (const h of results) {
           if (!h.isBlocked && h.exactShare) {
               sum = sum.add(h.exactShare);
           }
        }

        const sumVal = Number(sum.n) / Number(sum.d);
        
        // The sum must be <= 1 (if no Asoba and some Fard are left over) or strictly 1 if all inheritance is distributed.
        // It should never exceed 1 (since Awl should be applied to normalize).
        // Due to fractions, allow extremely minor tolerance just in case of arbitrary floating output, but Fraction uses BigInt so it's precise.
        
        return sumVal <= 1.000001; 
      }),
      { numRuns: 1000 }
    );
  });
});
