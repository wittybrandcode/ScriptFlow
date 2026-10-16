import { Heir, KinshipOntology } from '../types/Kinship';

export class DualKinshipResolver {
  /**
   * Processes the heirs list to resolve any dual kinship issues.
   * If a person (same ID) is listed with multiple relationships, 
   * only the relationship with the highest KinshipWeight is kept.
   */
  public static resolveDualKinship(heirs: Heir[]): Heir[] {
    const heirMap = new Map<string, Heir>();

    for (const heir of heirs) {
      const existing = heirMap.get(heir.id);
      
      if (!existing) {
        heirMap.set(heir.id, heir);
        continue;
      }

      // If the same person has multiple relationships, compare weights
      const newWeight = KinshipOntology[heir.type]?.weight || 0;
      const existingWeight = KinshipOntology[existing.type]?.weight || 0;

      if (newWeight > existingWeight) {
        heirMap.set(heir.id, heir);
      }
    }

    return Array.from(heirMap.values());
  }

  /**
   * Filter out non-inheriting kinships like MILK relations
   */
  public static filterNonInheritingKinship(heirs: Heir[]): Heir[] {
    return heirs.filter(heir => !heir.type.includes('MILK'));
  }
}
