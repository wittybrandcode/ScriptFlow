import { Person, Relation } from '../core/types';
import { RelationType, Gender } from '../core/enums';
import { normalizeType } from '../core/normalizer';
import { KunyaEngine } from './KunyaEngine';

/**
 * محرك النسب الأبوي.
 * يُعيّن معرّف السلالة (lineageId) لكل شخص بناءً على الأب الأعلى (patriarch).
 */
export class LineageEngine {
  /**
   * يُعيّن lineageId لكل شخص بناءً على سلسلة النسب الأبوي.
   *
   * @param nodes - قائمة الأشخاص
   * @param edges - العلاقات
   * @returns نسخة محدثة من nodes مع lineageId مُعيّن
   */
  static propagate(nodes: Person[], edges: Relation[]): Person[] {
    // FIX-14: Deep copy — كل كائن Person يُنسخ مستقلاً لمنع تعديل المدخلات
    const updatedNodes = nodes.map(n => ({ ...n }));
    const nodeMap = new Map<string, Person>();
    updatedNodes.forEach(n => nodeMap.set(n.id, n));
    
    // Map to find children by father
    const childrenByFather = new Map<string, string[]>();
    edges.forEach(e => {
      const type = normalizeType(e.type);
      if (type === RelationType.PARENT_MALE) {
        if (!childrenByFather.has(e.sourceId)) childrenByFather.set(e.sourceId, []);
        childrenByFather.get(e.sourceId)!.push(e.targetId);
      } else if (type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE) {
        const targetPerson = nodeMap.get(e.targetId);
        if (targetPerson?.gender === Gender.MALE) {
           if (!childrenByFather.has(e.targetId)) childrenByFather.set(e.targetId, []);
           childrenByFather.get(e.targetId)!.push(e.sourceId);
        }
      }
    });

    // Helper to propagate lineage recursively
    const propagateToChildren = (fatherId: string, lineageId: string) => {
      const children = childrenByFather.get(fatherId) || [];
      children.forEach(childId => {
        const childNode = nodeMap.get(childId);
        if (childNode && !childNode.lineageId) {
          childNode.lineageId = lineageId;
          if (childNode.gender === Gender.MALE) {
            propagateToChildren(childId, lineageId);
          }
        }
      });
    };

    // Find patriarchs (males with no known father)
    const patriarchs = updatedNodes.filter(n => {
      if (n.gender !== Gender.MALE) return false;
      const hasFather = edges.some(e => {
        const type = normalizeType(e.type);
        return (e.targetId === n.id && type === RelationType.PARENT_MALE) ||
               (e.sourceId === n.id && (type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE) && nodeMap.get(e.targetId)?.gender === Gender.MALE);
      });
      return !hasFather;
    });

    // Assign lineages
    patriarchs.forEach((patriarch, index) => {
      const kunya = KunyaEngine.extractKunya(patriarch);
      const lineageId = kunya || `L${index + 1}`;
      patriarch.lineageId = lineageId;
      propagateToChildren(patriarch.id, lineageId);
    });

    return updatedNodes;
  }
}
