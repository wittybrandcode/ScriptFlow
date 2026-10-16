import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';
import { normalizeType } from '../../core/normalizer';

export interface SemanticMetadata {
    [personId: string]: any;
}

export class JsonLDEngine {
  static generate(nodes: Person[], edges: Relation[], extraData?: SemanticMetadata): any {
    // Generate JSON-LD using Schema.org ontology
    const context = "https://schema.org/";
    
    const elements: any[] = [];
    
    // Group relations for direct parenting
    const childrenMap = new Map<string, string[]>();
    const parentsMap = new Map<string, string[]>();
    const spouseMap = new Map<string, string[]>();

    edges.forEach(e => {
        const type = normalizeType(e.type);
        if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE) {
            if (!childrenMap.has(e.sourceId)) childrenMap.set(e.sourceId, []);
            childrenMap.get(e.sourceId)!.push(e.targetId);
            
            if (!parentsMap.has(e.targetId)) parentsMap.set(e.targetId, []);
            parentsMap.get(e.targetId)!.push(e.sourceId);
        } else if ([RelationType.SPOUSE_MALE, RelationType.SPOUSE_FEMALE].includes(type)) {
            if (!spouseMap.has(e.sourceId)) spouseMap.set(e.sourceId, []);
            spouseMap.get(e.sourceId)!.push(e.targetId);
            
            if (!spouseMap.has(e.targetId)) spouseMap.set(e.targetId, []);
            spouseMap.get(e.targetId)!.push(e.sourceId);
        }
    });

    for (const node of nodes) {
        const personObj: any = {
            "@context": context,
            "@type": "Person",
            "@id": `#person_${node.id}`,
            "identifier": node.id,
            "name": node.name,
            "gender": node.gender === Gender.MALE ? "Male" : "Female",
        };

        if (node.isDeceased) {
            personObj.deathStatus = "dead";
        }
        
        if (node.birthDate) personObj.birthDate = node.birthDate;
        if (node.deathDate) personObj.deathDate = node.deathDate;
        
        const children = childrenMap.get(node.id);
        if (children && children.length > 0) {
            personObj.children = children.map(c => ({"@id": `#person_${c}`}));
        }
        
        const parents = parentsMap.get(node.id);
        if (parents && parents.length > 0) {
            personObj.parent = parents.map(c => ({"@id": `#person_${c}`}));
        }
        
        const spouses = spouseMap.get(node.id);
        if (spouses && spouses.length > 0) {
            personObj.spouse = spouses.map(c => ({"@id": `#person_${c}`}));
        }
        
        // Attach extra semantic metadata
        if (extraData && extraData[node.id]) {
            personObj.additionalProperty = [];
            const data = extraData[node.id];
            for (const key in data) {
                 personObj.additionalProperty.push({
                     "@type": "PropertyValue",
                     "name": key,
                     "value": JSON.stringify(data[key])
                 });
            }
        }
        
        elements.push(personObj);
    }
    
    return {
        "@graph": elements
    };
  }
}
