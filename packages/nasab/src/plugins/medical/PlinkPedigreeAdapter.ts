import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';
import { normalizeType } from '../../core/normalizer';

/**
 * محوّل (Adapter) لتصدير واستيراد البيانات بصيغة تتوافق مع الأنظمة الطبية والمتخصصة
 * في تتبع الأمراض الوراثية مثل PLINK (صيغة PED/MAP).
 * صيغة PED:
 * FamilyID IndividualID PaternalID MaternalID Sex(1=Male, 2=Female, 0=Unknown) Phenotype(1=Control, 2=Case, 0=Missing)
 */
export class PlinkPedigreeAdapter {
  
  /**
   * تصدير بيانات الشجرة بصيغة PED للتحليل الجيني.
   * تفترض أن كل الأشخاص يتبعون لعائلة واحدة إذا لم يحدد FamilyID.
   */
  public static exportToPED(nodes: Person[], edges: Relation[], familyId: string = 'FAM-01'): string {
    const parentMap = new Map<string, { father: string; mother: string }>();

    for (const e of edges) {
      const type = normalizeType(e.type);
      if (type === RelationType.PARENT_MALE) {
        const entry = parentMap.get(e.targetId) || { father: '0', mother: '0' };
        entry.father = e.sourceId;
        parentMap.set(e.targetId, entry);
      }
      if (type === RelationType.PARENT_FEMALE) {
        const entry = parentMap.get(e.targetId) || { father: '0', mother: '0' };
        entry.mother = e.sourceId;
        parentMap.set(e.targetId, entry);
      }
    }

    const lines: string[] = [];

    for (const node of nodes) {
      const iid = node.id;
      const parents = parentMap.get(iid) || { father: '0', mother: '0' };
      const sex = node.gender === Gender.MALE ? '1' : node.gender === Gender.FEMALE ? '2' : '0';
      
      // Default phenotype to missing (0), as we don't store phenotypic traits by default in core.
      // Medical plugin can map actual traits.
      const phenotype = node.isDeceased ? '0' : '1'; 

      const line = `${familyId} ${iid} ${parents.father} ${parents.mother} ${sex} ${phenotype}`;
      lines.push(line);
    }

    return lines.join('\n');
  }

}
