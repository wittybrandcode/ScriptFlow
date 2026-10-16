import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';
import { normalizeType } from '../../core/normalizer';
import { NasabPlugin, PluginType } from '../core/NasabPlugin';
import { InferenceEngine } from '../../kinship/InferenceEngine';

/**
 * محرك تصدير البيانات بصيغة JSON-LD والويب الدلالي (Semantic Web)
 * يدعم معيار Schema.org للأشخاص وعلاقاتهم
 */
export class JsonLDEngine implements NasabPlugin {
  public readonly metadata = {
    id: 'jsonld-exporter',
    name: 'JSON-LD Semantic Web Exporter',
    version: '1.0.0',
    description: 'تصدير شجرة العائلة كبيانات هيكلية لمحركات البحث'
  };
  public readonly type = PluginType.EXPORTER;

  /**
   * بناء كود JSON-LD الهيكلي لشجرة عائلة.
   * 
   * @param nodes - قائمة الأشخاص
   * @param edges - العلاقات الظاهرة والمستنتجة
   */
  static exportGraph(nodes: Person[], edges: Relation[]): any {
    const context = "https://schema.org/";
    const type = "ItemList";
    const elements: any[] = [];

    // نستنتج بقية العلاقات لتوفير تغطية كاملة (اختياري)
    const inferredEdges = InferenceEngine.infer(nodes, edges);
    const allEdges = [...edges, ...inferredEdges];

    for (const node of nodes) {
      const entity: any = {
        "@type": "Person",
        "identifier": node.id,
        "name": node.name,
        "gender": node.gender === Gender.MALE ? "Male" : "Female"
      };

      if (node.isDeceased) {
         entity["deathDate"] = node.deathDate || "Unknown";
      }
      if (node.birthDate) {
         entity["birthDate"] = node.birthDate;
      }

      // البحث عن الوالدين (الآباء والأمهات)
      const parents = allEdges.filter(e => e.targetId === node.id && (normalizeType(e.type) === RelationType.PARENT_MALE || normalizeType(e.type) === RelationType.PARENT_FEMALE));
      if (parents.length > 0) {
        entity["parent"] = parents.map(p => ({
          "@type": "Person",
          "identifier": p.sourceId
        }));
      }

      // البحث عن الأبناء
      const children = allEdges.filter(e => e.sourceId === node.id && (normalizeType(e.type) === RelationType.PARENT_MALE || normalizeType(e.type) === RelationType.PARENT_FEMALE));
      if (children.length > 0) {
        entity["children"] = children.map(c => ({
          "@type": "Person",
          "identifier": c.targetId
        }));
      }

      // البحث عن الإخوة
      const siblings = allEdges.filter(e => e.sourceId === node.id && (normalizeType(e.type) === RelationType.SIBLING_MALE || normalizeType(e.type) === RelationType.SIBLING_FEMALE));
      if (siblings.length > 0) {
        entity["sibling"] = siblings.map(s => ({
          "@type": "Person",
          "identifier": s.targetId
        }));
      }

      // البحث عن الأزواج
      const spouses = allEdges.filter(e => e.sourceId === node.id && (normalizeType(e.type) === RelationType.SPOUSE_MALE || normalizeType(e.type) === RelationType.SPOUSE_FEMALE));
      if (spouses.length > 0) {
        entity["spouse"] = spouses.map(s => ({
          "@type": "Person",
          "identifier": s.targetId
        }));
      }

      elements.push(entity);
    }

    return {
      "@context": context,
      "@type": type,
      "itemListElement": elements.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": item
      }))
    };
  }
}
