import { RelationType } from '../core/enums';
import { Person, Relation } from '../core/types';

export interface FosterRecord {
  childId: string;
  nurseId: string;
  husbandId?: string;
  numberOfFeedings: number;
  childAgeAtNursing: number;
}

export interface FosterRelation {
  type: RelationType;
  sourceId: string;
  targetId: string;
}

export class FosterEngine {
  private static readonly MIN_FEEDINGS = 5;
  private static readonly MAX_AGE_MONTHS = 24;

  public static validateFosterConditions(record: FosterRecord): string[] {
    const errors: string[] = [];
    if (record.numberOfFeedings < this.MIN_FEEDINGS) {
      errors.push(`عدد الرضعات (${record.numberOfFeedings}) أقل من الحد الأدنى (${this.MIN_FEEDINGS})`);
    }
    if (record.childAgeAtNursing > this.MAX_AGE_MONTHS) {
      errors.push(`عمر الرضيع (${record.childAgeAtNursing} شهراً) يتجاوز سن الرضاعة (${this.MAX_AGE_MONTHS} شهراً)`);
    }
    if (record.childAgeAtNursing < 0) {
      errors.push('عمر الرضيع غير منطقي (قيمة سالبة)');
    }
    return errors;
  }

  public static inferFosterRelationships(
    records: FosterRecord[],
    people: Person[],
    existingRelations: Relation[]
  ): FosterRelation[] {
    const relations: FosterRelation[] = [];
    const idMap = new Map(people.map(p => [p.id, p]));

    for (const record of records) {
      const errors = this.validateFosterConditions(record);
      if (errors.length > 0) continue;

      // 1. Foster mother ↔ child
      relations.push({ type: RelationType.FOSTER_MOTHER, sourceId: record.nurseId, targetId: record.childId });
      relations.push({ type: RelationType.FOSTER_SON, sourceId: record.childId, targetId: record.nurseId });

      // 2. Foster father (husband of nurse) ↔ child
      if (record.husbandId) {
        relations.push({ type: RelationType.FOSTER_FATHER, sourceId: record.husbandId, targetId: record.childId });
        relations.push({ type: RelationType.FOSTER_SON, sourceId: record.childId, targetId: record.husbandId });
      }

      // 3. Foster siblings — children of the same nurse (biological + other foster)
      const nurseChildren = this.findNurseChildren(record.nurseId, record.husbandId, people, existingRelations, records);
      for (const siblingId of nurseChildren) {
        if (siblingId === record.childId) continue;
        const siblingPerson = idMap.get(siblingId);
        if (!siblingPerson) continue;
        const fosterType = siblingPerson.gender === 'MALE' ? RelationType.FOSTER_BROTHER : RelationType.FOSTER_SISTER;
        const childPerson = idMap.get(record.childId);
        const childGender = childPerson?.gender === 'MALE' ? RelationType.FOSTER_BROTHER : RelationType.FOSTER_SISTER;
        relations.push({ type: fosterType, sourceId: siblingId, targetId: record.childId });
        relations.push({ type: childGender, sourceId: record.childId, targetId: siblingId });
      }
    }

    return relations;
  }

  private static findNurseChildren(
    nurseId: string,
    husbandId: string | undefined,
    people: Person[],
    existingRelations: Relation[],
    records: FosterRecord[]
  ): string[] {
    const children = new Set<string>();

    // Biological children of nurse
    for (const rel of existingRelations) {
      if (rel.type === RelationType.PARENT_MALE || rel.type === RelationType.PARENT_FEMALE) {
        if (rel.sourceId === nurseId) children.add(rel.targetId);
      }
    }

    // Other foster children of same nurse
    for (const rec of records) {
      if (rec.nurseId === nurseId) children.add(rec.childId);
    }

    // Children from nurse + husband
    if (husbandId) {
      for (const rel of existingRelations) {
        if ((rel.type === RelationType.PARENT_MALE && rel.sourceId === husbandId) ||
            (rel.type === RelationType.PARENT_FEMALE && rel.sourceId === nurseId)) {
          children.add(rel.targetId);
        }
      }
    }

    return Array.from(children);
  }

  public static getProhibitedMarriages(
    personA: string,
    personB: string,
    fosterRelations: FosterRelation[],
    existingRelations: Relation[] = []
  ): boolean {
    const parentTypes = [RelationType.PARENT_MALE, RelationType.PARENT_FEMALE];
    const fosterParentTypes = [RelationType.FOSTER_MOTHER, RelationType.FOSTER_FATHER];
    const siblingTypes = [RelationType.SIBLING_MALE, RelationType.SIBLING_FEMALE, RelationType.SIBLING_PATERNAL_MALE, RelationType.SIBLING_PATERNAL_FEMALE, RelationType.SIBLING_MATERNAL_MALE, RelationType.SIBLING_MATERNAL_FEMALE, RelationType.SIBLINGS];

    // Helper: Find all ancestors recursively
    const getAncestors = (startId: string, edges: (Relation | FosterRelation)[], validParentTypes: string[]): Set<string> => {
      const ancestors = new Set<string>();
      const queue = [startId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const e of edges) {
          if (validParentTypes.includes(e.type) && e.targetId === curr) {
            if (!ancestors.has(e.sourceId)) {
              ancestors.add(e.sourceId);
              queue.push(e.sourceId);
            }
          }
        }
      }
      return ancestors;
    };

    // Helper: Find all descendants recursively
    const getDescendants = (startId: string, edges: (Relation | FosterRelation)[], validParentTypes: string[]): Set<string> => {
      const descendants = new Set<string>();
      const queue = [startId];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const e of edges) {
           if (validParentTypes.includes(e.type) && e.sourceId === curr) {
            if (!descendants.has(e.targetId)) {
              descendants.add(e.targetId);
              queue.push(e.targetId);
            }
          }
        }
      }
      return descendants;
    };

    // All relations
    const combinedEdges = [...existingRelations, ...fosterRelations];

    // 1. Check direct foster parents / children
    for (const rel of fosterRelations) {
      if (fosterParentTypes.includes(rel.type as RelationType)) {
        if ((rel.sourceId === personA && rel.targetId === personB) ||
            (rel.sourceId === personB && rel.targetId === personA)) {
          return true;
        }
      }
      if (rel.type === RelationType.FOSTER_BROTHER || rel.type === RelationType.FOSTER_SISTER) {
        if ((rel.sourceId === personA && rel.targetId === personB) ||
            (rel.sourceId === personB && rel.targetId === personA)) {
          return true;
        }
      }
    }

    // A person's foster ancestors
    const fosterAncestorsA = getAncestors(personA, combinedEdges, [...parentTypes, ...fosterParentTypes]);
    if (fosterAncestorsA.has(personB)) return true;
    
    const fosterAncestorsB = getAncestors(personB, combinedEdges, [...parentTypes, ...fosterParentTypes]);
    if (fosterAncestorsB.has(personA)) return true;

    // Siblings of foster ancestors (Foster Uncles/Aunts)
    for (const ancA of fosterAncestorsA) {
      const ancASiblings = combinedEdges
        .filter(e => siblingTypes.includes(e.type as RelationType) && (e.sourceId === ancA || e.targetId === ancA))
        .map(e => e.sourceId === ancA ? e.targetId : e.sourceId);
      if (ancASiblings.includes(personB)) return true;
    }

    // Children of foster ancestors (Foster Siblings, if not already caught)
    // "يحرم من الرضاع ما يحرم من النسب" - The foster child cannot marry the nurse's biological descendants
    // We get descendants of the foster parents of PersonA and see if PersonB is one.
    const directFosterParentsA = fosterRelations.filter(e => fosterParentTypes.includes(e.type as RelationType) && e.targetId === personA).map(e => e.sourceId);
    for (const fpa of directFosterParentsA) {
      const descendantsOfNurse = getDescendants(fpa, existingRelations, parentTypes);
      if (descendantsOfNurse.has(personB)) return true;
    }
    
    const directFosterParentsB = fosterRelations.filter(e => fosterParentTypes.includes(e.type as RelationType) && e.targetId === personB).map(e => e.sourceId);
    for (const fpb of directFosterParentsB) {
      const descendantsOfNurse = getDescendants(fpb, existingRelations, parentTypes);
      if (descendantsOfNurse.has(personA)) return true;
    }
    
    // Descendants of PersonA who are foster children cannot marry PersonA
    // Handled by the getAncestors logic (if PersonB is foster child of PersonA, PersonA is in fosterAncestorsB)

    // Nephews/Nieces of Foster Siblings
    const siblingsOfA = combinedEdges
      .filter(e => [...siblingTypes, RelationType.FOSTER_BROTHER, RelationType.FOSTER_SISTER].includes(e.type as RelationType) && (e.sourceId === personA || e.targetId === personA))
      .map(e => e.sourceId === personA ? e.targetId : e.sourceId);
    
    for (const sib of siblingsOfA) {
       const sibDescendants = getDescendants(sib, existingRelations, parentTypes);
       if (sibDescendants.has(personB)) return true;
    }

    const siblingsOfB = combinedEdges
      .filter(e => [...siblingTypes, RelationType.FOSTER_BROTHER, RelationType.FOSTER_SISTER].includes(e.type as RelationType) && (e.sourceId === personB || e.targetId === personB))
      .map(e => e.sourceId === personB ? e.targetId : e.sourceId);

    for (const sib of siblingsOfB) {
       const sibDescendants = getDescendants(sib, existingRelations, parentTypes);
       if (sibDescendants.has(personA)) return true;
    }

    return false;
  }
}
