import { bench, describe } from 'vitest';
import { Person, Relation } from '../../core/types';
import { Gender, RelationType } from '../../core/enums';
import { InheritanceEngine } from '../InheritanceEngine';

function generateTree(size: number) {
  const nodes: Person[] = [
    { id: 'dead', name: 'المتوفى', gender: Gender.MALE, isDeceased: true }
  ];
  const edges: Relation[] = [];

  // Add highly nested tree around it to cause massive inference tree checks
  for (let i=1; i<=size; i++) {
    nodes.push({ id: `n_${i}`, name: `Node ${i}`, gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE, isDeceased: false });
    
    // Make first one son, second one grandson, and so on (linear depth)
    const parentId = i === 1 ? 'dead' : `n_${i-1}`;
    edges.push({
       sourceId: parentId, 
       targetId: `n_${i}`, 
       type: i % 2 === 0 ? RelationType.PARENT_MALE : RelationType.PARENT_FEMALE 
    });
  }

  // Also add some siblings to branch out slightly
  if (size > 10) {
      nodes.push({ id: 'brother', name: 'أخ', gender: Gender.MALE, isDeceased: false });
      edges.push({ sourceId: 'brother', targetId: 'dead', type: RelationType.SIBLING_MALE });
  }

  return { nodes, edges };
}

describe('InheritanceEngine Performance Benchmarks', () => {
    
  const tree100 = generateTree(100);
  const tree1000 = generateTree(1000);
  const tree5000 = generateTree(5000);

  bench('100 Nodes Deep Tree', () => {
    InheritanceEngine.calculate('dead', tree100.nodes, tree100.edges);
  });

  bench('1000 Nodes Deep Tree', () => {
    InheritanceEngine.calculate('dead', tree1000.nodes, tree1000.edges);
  });

  bench('5000 Nodes Deep Tree', () => {
    InheritanceEngine.calculate('dead', tree5000.nodes, tree5000.edges);
  });

});
