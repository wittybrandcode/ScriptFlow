import { describe, expect, it } from 'vitest';
import { KinshipGraph } from '../../nasab-graph/src/KinshipGraph';
import { validateGraph } from '../src/engine';
import { Gender, RelationCategory, MadhabContext } from '../../nasab-model/src';

describe('Nasab Validator Engine', () => {
  it('should validate graph without throwing getAllNodes error', () => {
    const graph = new KinshipGraph();
    const context: MadhabContext = { madhab: 'COMMON' } as any;

    const child = {
      id: 'child_1',
      biometrics: { gender: Gender.MALE }
    } as any;

    const father1 = {
      id: 'father_1',
      biometrics: { gender: Gender.MALE }
    } as any;

    graph.addNode(child);
    graph.addNode(father1);

    graph.addEdge({
      edgeId: 'edge_1',
      sourceId: 'father_1',
      targetId: 'child_1',
      relationCategory: RelationCategory.BLOOD_LINEAGE,
      isMahram: true
    });

    const report = validateGraph(graph, context);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('should detect multiple biological fathers as error', () => {
    const graph = new KinshipGraph();
    const context: MadhabContext = { madhab: 'COMMON' } as any;

    const child = {
      id: 'child_1',
      biometrics: { gender: Gender.MALE }
    } as any;

    const father1 = {
      id: 'father_1',
      biometrics: { gender: Gender.MALE }
    } as any;

    const father2 = {
      id: 'father_2',
      biometrics: { gender: Gender.MALE }
    } as any;

    graph.addNode(child);
    graph.addNode(father1);
    graph.addNode(father2);

    graph.addEdge({
      edgeId: 'edge_1',
      sourceId: 'father_1',
      targetId: 'child_1',
      relationCategory: RelationCategory.BLOOD_LINEAGE,
      isMahram: true
    });

    graph.addEdge({
      edgeId: 'edge_2',
      sourceId: 'father_2',
      targetId: 'child_1',
      relationCategory: RelationCategory.BLOOD_LINEAGE,
      isMahram: true
    });

    const report = validateGraph(graph, context);
    expect(report.isValid).toBe(false);
    expect(report.errors.some(e => e.errorCode === 'ERR_BIOLOGICAL_MULTIPLE_FATHERS')).toBe(true);
  });
});

