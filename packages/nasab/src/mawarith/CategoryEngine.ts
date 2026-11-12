import { Person, Relation } from '../core/types';
import { RelationType, Gender } from '../core/enums';
import { getInverseRelation } from '../core/InverseMap';
import { MawarithContext } from './types';

/**
 * يُصنّف أقارب المتوفى إلى فئات شرعية (زوجات، أبناء، أخوة، أعمام...) ويبني سياق المواريث.
 */
export class CategoryEngine {
  /**
   * يبني سياق المواريث بتصنيف أقارب المتوفى وتحديد أعلام الفروع/الأصول.
   *
   * @param deceased - الشخص المتوفى
   * @param nodes - قائمة كل الأشخاص
   * @param allEdges - العلاقات (صريحة + مستنتجة)
   * @returns سياق مُهيكل جاهز لـ RulesEngine و MathEngine
   */
  static buildContext(deceased: Person, nodes: Person[], allEdges: Relation[]): MawarithContext {
    const isMale = deceased.gender === Gender.MALE;
    const nodeMap = new Map<string, Person>();
    for (const n of nodes) nodeMap.set(n.id, n);

    const getRelatives = (types: RelationType[]) => {
      const relatedIds = new Set<string>();
      for (const e of allEdges) {
        if (e.targetId === deceased.id && types.includes(e.type)) {
          relatedIds.add(e.sourceId);
        }
        if (e.sourceId === deceased.id) {
          const targetGender = nodeMap.get(e.targetId)?.gender;
          const inverseType = getInverseRelation(e.type, targetGender);
          if (inverseType && types.includes(inverseType as RelationType)) {
            relatedIds.add(e.targetId);
          }
        }
      }
      return nodes.filter(n => relatedIds.has(n.id) && !n.isDeceased);
    };

    const spouses = getRelatives(isMale ? [RelationType.SPOUSE_FEMALE] : [RelationType.SPOUSE_MALE]);
    const fathers = getRelatives([RelationType.PARENT_MALE]);
    const mothers = getRelatives([RelationType.PARENT_FEMALE]);
    const sons = getRelatives([RelationType.CHILD_MALE]);
    const daughters = getRelatives([RelationType.CHILD_FEMALE]);
    const fullBrothers = getRelatives([RelationType.SIBLING_MALE]);
    const fullSisters = getRelatives([RelationType.SIBLING_FEMALE]);
    const paternalBrothers = getRelatives([RelationType.SIBLING_PATERNAL_MALE]);
    const paternalSisters = getRelatives([RelationType.SIBLING_PATERNAL_FEMALE]);
    const maternalBrothers = getRelatives([RelationType.SIBLING_MATERNAL_MALE]);
    const maternalSisters = getRelatives([RelationType.SIBLING_MATERNAL_FEMALE]);
    
    const allGrandsons = getRelatives([RelationType.GRANDCHILD_MALE]); 
    const allGranddaughters = getRelatives([RelationType.GRANDCHILD_FEMALE]);
    const allGrandfathers = getRelatives([RelationType.GRANDPARENT_MALE]); 
    const grandmothers = getRelatives([RelationType.GRANDPARENT_FEMALE]);

    // عزل أولاد البنات عن فروع البنين (أولاد البنات من ذوي الأرحام لا يرثون بالفرض أو التعصيب)
    const daughterIds = new Set(daughters.map(d => d.id));
    const sonIds = new Set(sons.map(s => s.id));
    const uterineGrandchildIds = new Set<string>();

    for (const e of allEdges) {
      if (daughterIds.has(e.targetId) && (e.type === RelationType.CHILD_MALE || e.type === RelationType.CHILD_FEMALE)) {
        uterineGrandchildIds.add(e.sourceId);
      }
      if (daughterIds.has(e.sourceId) && (e.type === RelationType.PARENT_MALE || e.type === RelationType.PARENT_FEMALE)) {
        uterineGrandchildIds.add(e.targetId);
      }
    }

    const grandsons = allGrandsons.filter(g => !uterineGrandchildIds.has(g.id));
    const granddaughters = allGranddaughters.filter(g => !uterineGrandchildIds.has(g.id));
    const uterineGrandchildren = [...allGrandsons, ...allGranddaughters].filter(g => uterineGrandchildIds.has(g.id));

    // عزل الجد لأم (أبو الأم) عن الجد الصحيح (أبو الأب)
    const motherIds = new Set(mothers.map(m => m.id));
    const uterineGrandfatherIds = new Set<string>();
    for (const e of allEdges) {
      if (motherIds.has(e.targetId) && e.type === RelationType.PARENT_MALE) {
        uterineGrandfatherIds.add(e.sourceId);
      }
    }
    const grandfathers = allGrandfathers.filter(g => !uterineGrandfatherIds.has(g.id));
    const uterineGrandfathers = allGrandfathers.filter(g => uterineGrandfatherIds.has(g.id));
    
    // الأعمام وبنو الإخوة: العصبة بالنفس هم الأشقاء ولأب فقط، أما الأخوال وبنو الأخوات فذوو أرحام
    const uncles = getRelatives([RelationType.UNCLE_FULL_MALE, RelationType.UNCLE_PATERNAL_MALE]);
    const maternalUncles = getRelatives([RelationType.UNCLE_MATERNAL_MALE]);
    const aunts = getRelatives([RelationType.UNCLE_FULL_FEMALE, RelationType.UNCLE_PATERNAL_FEMALE, RelationType.UNCLE_MATERNAL_FEMALE]);
    const nephews = getRelatives([RelationType.NEPHEW_FULL_MALE, RelationType.NEPHEW_PATERNAL_MALE]);
    const maternalNephews = getRelatives([RelationType.NEPHEW_MATERNAL_MALE]);
    const nieces = getRelatives([RelationType.NEPHEW_FULL_FEMALE, RelationType.NEPHEW_PATERNAL_FEMALE, RelationType.NEPHEW_MATERNAL_FEMALE]);

    const hasMaleDescendant = sons.length > 0 || grandsons.length > 0;
    const hasFemaleDescendant = daughters.length > 0 || granddaughters.length > 0;
    const hasDescendant = hasMaleDescendant || hasFemaleDescendant;

    const siblingsCount = fullBrothers.length + fullSisters.length + paternalBrothers.length + paternalSisters.length + maternalBrothers.length + maternalSisters.length;

    const ctx: MawarithContext = {
      deceased,
      isMale,
      hasMaleDescendant,
      hasFemaleDescendant,
      hasDescendant,
      siblingsCount,
      relatives: {
        spouses, fathers, mothers, sons, daughters, fullBrothers, fullSisters,
        paternalBrothers, paternalSisters, maternalBrothers, maternalSisters,
        grandsons, granddaughters, grandfathers, grandmothers, uncles, aunts, nephews, nieces,
        maternalUncles, maternalNephews, uterineGrandchildren, uterineGrandfathers
      },
      heirs: [],
      fardShares: new Map(),
      asaba: null,
      blockedIds: new Set(),
      addFard: (person: Person, relation: string, fard: string, notes: string) => {
        ctx.fardShares.set(person.id, fard);
        ctx.heirs.push({ person, relation, share: fard, notes });
      },
      block: (persons: Person[], relation: string, notes: string) => {
        persons.forEach(p => {
          ctx.blockedIds.add(p.id);
          ctx.heirs.push({ person: p, relation, share: 'لا يرث', isBlocked: true, notes });
        });
      }
    };

    return ctx;
  }
}
