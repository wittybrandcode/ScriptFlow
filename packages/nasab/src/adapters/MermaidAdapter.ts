import { Person, Relation } from '../core/types';
import { RelationType } from '../core/enums';
import { normalizeType } from '../core/normalizer';

export class MermaidAdapter {
    /**
     * Converts NASAB graph into Mermaid.js format (flowchart TD)
     */
    static transform(persons: Person[], relations: Relation[]): string {
        let mermaidStr = 'graph TD\n';

        // Add nodes
        for (const p of persons) {
            // Styling based on gender
            const shapeOpen = p.gender === 'MALE' ? '[' : '((';
            const shapeClose = p.gender === 'MALE' ? ']' : '))';
            const deceasedStyle = p.isDeceased ? ':::deceased' : '';
            
            // Clean name for mermaid
            const cleanName = p.name.replace(/["\\]/g, '');
            mermaidStr += `    P_${p.id}${shapeOpen}"${cleanName}"${shapeClose}${deceasedStyle}\n`;
        }

        // Add relations
        const marriageEdges = new Set<string>();

        for (const r of relations) {
            const type = normalizeType(r.type);
            const source = `P_${r.sourceId}`;
            const target = `P_${r.targetId}`;

            if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE) {
                // Determine if we need to route through a marriage node (not strict for flowchart, we can do direct arrows)
                mermaidStr += `    ${source} -->|Parent| ${target}\n`;
            } else if ([RelationType.SPOUSE_MALE, RelationType.SPOUSE_FEMALE].includes(type)) {
                // Ensure we don't duplicate marriage links since graph is bi-directional usually
                const mKey = [r.sourceId, r.targetId].sort().join('-');
                if (!marriageEdges.has(mKey)) {
                    marriageEdges.add(mKey);
                    mermaidStr += `    ${source} ---|Spouse| ${target}\n`;
                }
            }
        }

        // Add class definitions at the end
        mermaidStr += `\n    classDef deceased fill:#d3d3d3,stroke:#333,stroke-width:1px;\n`;

        return mermaidStr;
    }
}
