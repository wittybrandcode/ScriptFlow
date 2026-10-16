import { KinshipGraph } from '@nasab/graph';
import { RelationCategory, Gender, ValidationError, ValidationWarning } from '@nasab/model';

export function checkBiologicalConsistency(graph: KinshipGraph): { errors: ValidationError[], warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const allNodes = graph.getAllNodes();

  for (const person of allNodes.values()) {
    const incomingEdges = graph.getIncomingEdges(person.id);
    
    // Check multiple biological fathers/mothers
    let biologicalFathers = 0;
    let biologicalMothers = 0;

    for (const edge of incomingEdges) {
      if (edge.relationCategory === RelationCategory.BIOLOGICAL) {
        const parent = graph.getNode(edge.sourceId);
        if (parent) {
           if (parent.biometrics.gender === Gender.MALE) {
             biologicalFathers++;
           } else if (parent.biometrics.gender === Gender.FEMALE) {
             biologicalMothers++;
           }
        }
      }
    }

    if (biologicalFathers > 1) {
       errors.push({
          errorCode: 'ERR_BIOLOGICAL_MULTIPLE_FATHERS',
          message: `Person ${person.id} has ${biologicalFathers} biological fathers.`,
          involvedNodes: [person.id]
       });
    }

    if (biologicalMothers > 1) {
       errors.push({
          errorCode: 'ERR_BIOLOGICAL_MULTIPLE_MOTHERS',
          message: `Person ${person.id} has ${biologicalMothers} biological mothers.`,
          involvedNodes: [person.id]
       });
    }
  }

  return { errors, warnings };
}
