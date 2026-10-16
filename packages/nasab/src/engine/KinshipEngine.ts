import { Heir, KinshipOntology } from '../types/Kinship';

export class KinshipEngine {
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
   * فلترة الورثة الذين ترتبط علاقتهم بالمتوفى عبر الرضاع فقط.
   * وفق الفقه الإسلامي: "الرضاع يحرّم ما يحرّم النسب" من حيث الزواج،
   * لكنه لا يمنح حق الميراث. هذه الدالة تزيل أي وارث مُعلّم كعلاقة رضاعية
   * فقط (أي ليس له صلة نسب حقيقية بالمتوفى).
   *
   * @param heirs - قائمة الورثة المحتملين
   * @param fosterOnlyIds - مجموعة معرّفات الأشخاص الذين ترتبط صلتهم بالمتوفى بالرضاع فقط
   * @returns قائمة الورثة بعد استبعاد ذوي القرابة الرضاعية فقط
   */
  public static filterNonInheritingKinship(
    heirs: Heir[],
    fosterOnlyIds: Set<string>
  ): Heir[] {
    if (!fosterOnlyIds || fosterOnlyIds.size === 0) {
      return heirs;
    }
    return heirs.filter(heir => !fosterOnlyIds.has(heir.id));
  }
}
