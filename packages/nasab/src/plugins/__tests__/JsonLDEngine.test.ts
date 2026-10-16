import { describe, it, expect } from 'vitest';
import { JsonLDEngine } from '../../plugins/exporters/JsonLDEngine';
import { Person, Relation } from '../../core/types';
import { Gender, RelationType } from '../../core/enums';

describe('JsonLDEngine - تصدير JSON-LD الدلالي', () => {

  it('يصدّر شخص وحيد بشكل صحيح مع معلوماته', () => {
    const nodes: Person[] = [
      { id: '1', name: 'أحمد', gender: Gender.MALE, isDeceased: true, deathDate: '2020-01-01' }
    ];
    
    const result = JsonLDEngine.exportGraph(nodes, []);

    expect(result['@context']).toBe('https://schema.org/');
    expect(result['@type']).toBe('ItemList');
    expect(result.itemListElement).toHaveLength(1);

    const item = result.itemListElement[0].item;
    expect(item['@type']).toBe('Person');
    expect(item.identifier).toBe('1');
    expect(item.name).toBe('أحمد');
    expect(item.gender).toBe('Male');
    expect(item.deathDate).toBe('2020-01-01');
  });

  it('يستنتج ويصدّر علاقات الوالدين والأبناء', () => {
    const nodes: Person[] = [
      { id: 'father1', name: 'أب', gender: Gender.MALE, isDeceased: false },
      { id: 'son1', name: 'ابن', gender: Gender.MALE, isDeceased: false }
    ];
    const edges: Relation[] = [
      { sourceId: 'father1', targetId: 'son1', type: RelationType.PARENT_MALE }
    ];

    const result = JsonLDEngine.exportGraph(nodes, edges);
    
    const father = result.itemListElement[0].item;
    const son = result.itemListElement[1].item;

    expect(father.identifier).toBe('father1');
    expect(father.children).toBeDefined();
    expect(father.children[0].identifier).toBe('son1');

    expect(son.identifier).toBe('son1');
    expect(son.parent).toBeDefined();
    expect(son.parent[0].identifier).toBe('father1');
  });

  it('يصدر علاقات الإخوة الأزواج', () => {
     const nodes: Person[] = [
      { id: 'husband', name: 'زوج', gender: Gender.MALE, isDeceased: false },
      { id: 'wife', name: 'زوجة', gender: Gender.FEMALE, isDeceased: false }
    ];
    const edges: Relation[] = [
      { sourceId: 'husband', targetId: 'wife', type: RelationType.SPOUSE_MALE }
    ];

    const result = JsonLDEngine.exportGraph(nodes, edges);
    const husband = result.itemListElement[0].item;
    const wife = result.itemListElement[1].item;

    expect(husband.spouse[0].identifier).toBe('wife');
    expect(wife.spouse[0].identifier).toBe('husband');
  });
});
