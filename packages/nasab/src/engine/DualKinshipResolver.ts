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

      // In Islamic jurisprudence, a person can inherit through two distinct kinships
      // (e.g. Fard + Asaba: Husband + Cousin, Uterine Brother + Cousin)
      const isMaritalOrUterine = existing.type === 'SPOUSE_MALE' || existing.type === 'SPOUSE_FEMALE' || existing.type === 'UTERINE_BROTHER' || existing.type === 'UTERINE_SISTER';
      const isNewMaritalOrUterine = heir.type === 'SPOUSE_MALE' || heir.type === 'SPOUSE_FEMALE' || heir.type === 'UTERINE_BROTHER' || heir.type === 'UTERINE_SISTER';

      if (isMaritalOrUterine && !isNewMaritalOrUterine) {
        existing.secondaryType = heir.type;
      } else if (!isMaritalOrUterine && isNewMaritalOrUterine) {
        heir.secondaryType = existing.type;
        heirMap.set(heir.id, heir);
      } else {
        const newWeight = KinshipOntology[heir.type]?.weight || 0;
        const existingWeight = KinshipOntology[existing.type]?.weight || 0;

        if (newWeight > existingWeight) {
          heir.secondaryType = existing.type;
          heirMap.set(heir.id, heir);
        } else {
          existing.secondaryType = heir.type;
        }
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
