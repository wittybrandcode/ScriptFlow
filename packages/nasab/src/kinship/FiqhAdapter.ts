import { Person, Relation } from '../core/types';
import { RelationType, Gender } from '../core/enums';
import { Heir, HeirType } from '../types/Kinship';
import { GraphAdapter } from '../core/GraphAdapter';

/**
 * FiqhAdapter
 * 
 * This is the ultimate bridge that transforms a raw Family Graph into strict
 * Fiqh-compliant 'HeirType' entities required by the Phase 8 BaseEngine.
 * 
 * Crucially, it DEDUCES precise Fiqh Roles (Full vs Agnatic variants for Siblings/Uncles)
 * from fundamental Parent-Child and Marriage edges, eliminating the "simulation"
 * flaw in previous systems.
 */
export class FiqhAdapter {
  
  /**
   * Traverses fundamental graphs to extract Heirs with mathematically exact Fiqh Roles.
   */
  static extractHeirsFromGraph(deceasedId: string, nodes: Person[], edges: Relation[]): Heir[] {
    const graph = new GraphAdapter(nodes, edges);
    const deceased = graph.getNode(deceasedId);
    
    if (!deceased) return [];
    
    const heirs: Heir[] = [];
    const addedIds = new Set<string>();

    const safeAdd = (id: string, type: HeirType, gender: string) => {
      if (!addedIds.has(id)) {
        heirs.push({ id, type, gender: gender as 'MALE' | 'FEMALE' });
        addedIds.add(id);
      }
    };

    // 1. Direct Parentage Maps
    const getParents = (id: string) => {
      const parents = graph.getRelatives(id, [RelationType.PARENT_MALE, RelationType.PARENT_FEMALE]);
      const father = parents.find(p => p.gender === Gender.MALE);
      const mother = parents.find(p => p.gender === Gender.FEMALE);
      return { father, mother };
    };

    const getChildren = (id: string) => 
      graph.getRelatives(id, [RelationType.CHILD_MALE, RelationType.CHILD_FEMALE]);

    const parents = getParents(deceased.id);
    const children = getChildren(deceased.id);
    const spouses = graph.getRelatives(deceased.id, [RelationType.SPOUSE_MALE, RelationType.SPOUSE_FEMALE]);

    // Add Spouses
    for (const sp of spouses) {
      if (sp.isDeceased) continue;
      safeAdd(sp.id, sp.gender === Gender.MALE ? 'SPOUSE_MALE' : 'SPOUSE_FEMALE', sp.gender);
    }

    // Add Parents
    if (parents.father && !parents.father.isDeceased) safeAdd(parents.father.id, 'FATHER', 'MALE');
    if (parents.mother && !parents.mother.isDeceased) safeAdd(parents.mother.id, 'MOTHER', 'FEMALE');

    // Add Children
    for (const ch of children) {
      if (ch.isDeceased) continue;
      safeAdd(ch.id, ch.gender === Gender.MALE ? 'SON' : 'DAUGHTER', ch.gender);
    }

    // Grandchildren (Sons of sons, Daughters of sons only for primary Fiqh)
    const sons = children.filter(c => c.gender === Gender.MALE);
    for (const son of sons) {
      const grandchildren = getChildren(son.id);
      for (const gc of grandchildren) {
        if (gc.isDeceased) continue;
        safeAdd(gc.id, gc.gender === Gender.MALE ? 'SON_OF_SON' : 'DAUGHTER_OF_SON', gc.gender);
      }
    }

    // Grandparents
    if (parents.father) {
      const fathersParents = getParents(parents.father.id);
      if (fathersParents.father && !fathersParents.father.isDeceased) safeAdd(fathersParents.father.id, 'GRANDFATHER', 'MALE');
      if (fathersParents.mother && !fathersParents.mother.isDeceased) safeAdd(fathersParents.mother.id, 'GRANDMOTHER_P', 'FEMALE');
    }
    if (parents.mother) {
      const mothersParents = getParents(parents.mother.id);
      if (mothersParents.mother && !mothersParents.mother.isDeceased) safeAdd(mothersParents.mother.id, 'GRANDMOTHER_M', 'FEMALE');
      // Maternal Grandfather is Zawil Arham (MATERNAL_GRANDFATHER)
      if (mothersParents.father && !mothersParents.father.isDeceased) safeAdd(mothersParents.father.id, 'MATERNAL_GRANDFATHER', 'MALE');
    }

    // Siblings (Logic: Check shared parents)
    const allSiblingsRaw = new Map<string, Person>();
    if (parents.father) getChildren(parents.father.id).forEach(c => allSiblingsRaw.set(c.id, c));
    if (parents.mother) getChildren(parents.mother.id).forEach(c => allSiblingsRaw.set(c.id, c));
    allSiblingsRaw.delete(deceased.id); // Remove self

    for (const [sibId, sib] of allSiblingsRaw) {
      if (sib.isDeceased) continue;
      const sibParents = getParents(sibId);
      const isPaternal = parents.father && sibParents.father && parents.father.id === sibParents.father.id;
      const isMaternal = parents.mother && sibParents.mother && parents.mother.id === sibParents.mother.id;

      if (isPaternal && isMaternal) {
        safeAdd(sib.id, sib.gender === Gender.MALE ? 'FULL_BROTHER' : 'FULL_SISTER', sib.gender);
      } else if (isPaternal) {
        safeAdd(sib.id, sib.gender === Gender.MALE ? 'AGNATIC_BROTHER' : 'AGNATIC_SISTER', sib.gender);
      } else if (isMaternal) {
        safeAdd(sib.id, sib.gender === Gender.MALE ? 'UTERINE_BROTHER' : 'UTERINE_SISTER', sib.gender);
      }
    }

    // Uncles/Aunts (Siblings of Father/Mother)
    if (parents.father) {
      const fatherParents = getParents(parents.father.id);
      if (fatherParents.father || fatherParents.mother) {
        const fatherSiblings = new Map<string, Person>();
        if (fatherParents.father) getChildren(fatherParents.father.id).forEach(c => fatherSiblings.set(c.id, c));
        if (fatherParents.mother) getChildren(fatherParents.mother.id).forEach(c => fatherSiblings.set(c.id, c));
        fatherSiblings.delete(parents.father.id); // Remove father

        for (const [, uncle] of fatherSiblings) {
          if (uncle.isDeceased) continue;
          const uParents = getParents(uncle.id);
          const isPaternal = fatherParents.father && uParents.father && fatherParents.father.id === uParents.father.id;
          const isMaternal = fatherParents.mother && uParents.mother && fatherParents.mother.id === uParents.mother.id;

          if (isPaternal && isMaternal) {
            safeAdd(uncle.id, uncle.gender === Gender.MALE ? 'FULL_UNCLE' : 'PATERNAL_AUNT', uncle.gender);
          } else if (isPaternal) {
            safeAdd(uncle.id, uncle.gender === Gender.MALE ? 'AGNATIC_UNCLE' : 'PATERNAL_AUNT', uncle.gender);
          } else if (isMaternal) { // Uterine brother of father -> Maternal Uncle (equivalent)
             // This is technically Zawil Arham
          }
        }
      }
    }

    if (parents.mother) {
      const motherParents = getParents(parents.mother.id);
      if (motherParents.father || motherParents.mother) {
         const motherSiblings = new Map<string, Person>();
         if (motherParents.father) getChildren(motherParents.father.id).forEach(c => motherSiblings.set(c.id, c));
         if (motherParents.mother) getChildren(motherParents.mother.id).forEach(c => motherSiblings.set(c.id, c));
         motherSiblings.delete(parents.mother.id);

         for (const [, uncle] of motherSiblings) {
            if (uncle.isDeceased) continue;
            // Mother's brothers are MATERNAL_UNCLE, sisters MATERNAL_AUNT regardless of full/agnatic
            safeAdd(uncle.id, uncle.gender === Gender.MALE ? 'MATERNAL_UNCLE' : 'MATERNAL_AUNT', uncle.gender);
         }
      }
    }

    // Fallback: Check explicitly defined inferred relations to bridge gaps
    const inferred = graph.getOutboundEdges(deceased.id);
    for (const inf of inferred) {
      if (addedIds.has(inf.targetId)) continue;
      const t = graph.getNode(inf.targetId);
      if (!t || t.isDeceased) continue;

      switch(inf.type) {
        case RelationType.NEPHEW_FULL_MALE:
          safeAdd(t.id, 'FULL_BROTHER_SON', 'MALE'); // Son of full brother
          break;
        case RelationType.NEPHEW_PATERNAL_MALE:
          safeAdd(t.id, 'AGNATIC_BROTHER_SON', 'MALE'); 
          break;
      }
    }

    return heirs;
  }
}

