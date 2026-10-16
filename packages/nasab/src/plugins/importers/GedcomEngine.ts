import { Person, Relation } from '../../core/types';
import { RelationType, Gender } from '../../core/enums';
import { KunyaEngine } from '../../kinship/KunyaEngine';
import { normalizeType } from '../../core/normalizer';
import { NasabPlugin, PluginType } from '../core/NasabPlugin';

/**
 * محرك استيراد وتصدير ملفات GEDCOM (المعيار الدولي لشجرات العائلات).
 */
export class GedcomEngine implements NasabPlugin {
  public readonly metadata = {
    id: 'gedcom-plugin',
    name: 'GEDCOM Import/Export',
    version: '1.0.0',
    description: 'محرك استيراد وتصدير ملفات GEDCOM المعيارية'
  };
  public readonly type = PluginType.IMPORTER;

  /**
   * يُحلل نص GEDCOM ويُرجع قائمة أشخاص وعلاقات.
   *
   * @param gedcomText - محتوى ملف GEDCOM كنص
   * @returns `{ nodes, edges }` جاهزة للاستخدام مع باقي المحركات
   */
  static parse(gedcomText: string): { nodes: Person[], edges: Relation[] } {
    const lines = gedcomText.split(/\r?\n/).filter(line => line.trim() !== '');
    const persons: Record<string, Person> = {};
    const edges: Relation[] = [];

    let currentEntity: { type: 'INDI' | 'FAM' | null, id: string | null } = { type: null, id: null };
    const famFamilies: Record<string, { husb?: string, wife?: string, children: string[] }> = {};

    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\s+(@\S+@|\S+)(?:\s+(.*))?$/);
      if (!match) continue;

      const level = parseInt(match[1], 10);
      const tagOrId = match[2];
      const value = match[3] || '';

      if (level === 0) {
        if (value === 'INDI') {
          currentEntity = { type: 'INDI', id: tagOrId };
          persons[tagOrId] = {
            id: tagOrId,
            name: 'مجهول', // Unknown
            gender: Gender.MALE, // default
            isDeceased: false
          };
        } else if (value === 'FAM') {
          currentEntity = { type: 'FAM', id: tagOrId };
          famFamilies[tagOrId] = { children: [] };
        } else {
          currentEntity = { type: null, id: null };
        }
      } else if (currentEntity.type === 'INDI' && currentEntity.id) {
        const p = persons[currentEntity.id];
        if (level === 1) {
          if (tagOrId === 'NAME') p.name = value.replace(/\//g, '').trim();
          else if (tagOrId === 'SEX') p.gender = value === 'F' ? Gender.FEMALE : Gender.MALE;
          if (tagOrId === 'DEAT') p.isDeceased = true;
        }
      } else if (currentEntity.type === 'FAM' && currentEntity.id) {
        const f = famFamilies[currentEntity.id];
        if (level === 1) {
          if (tagOrId === 'HUSB') f.husb = value;
          else if (tagOrId === 'WIFE') f.wife = value;
          else if (tagOrId === 'CHIL') f.children.push(value);
        }
      }
    }

    // Process families into edges
    for (const famId in famFamilies) {
      const f = famFamilies[famId];
      if (f.husb && f.wife) {
        edges.push({
          sourceId: f.husb,
          targetId: f.wife,
          type: RelationType.SPOUSE_MALE // Will be bi-directionally resolved by InferenceEngine
        });
      }

      if (f.husb) {
        for (const child of f.children) {
          edges.push({ sourceId: f.husb, targetId: child, type: RelationType.PARENT_MALE });
        }
      }
      if (f.wife) {
        for (const child of f.children) {
          edges.push({ sourceId: f.wife, targetId: child, type: RelationType.PARENT_FEMALE });
        }
      }
    }

    return {
      nodes: Object.values(persons),
      edges
    };
  }

  static generate(nodes: Person[], edges: Relation[], extraData?: Record<string, any>): string {
    let gedcom = '0 HEAD\n1 CHAR UTF-8\n';

    for (const node of nodes) {
      gedcom += `0 @${node.id}@ INDI\n`;
      const kunya = KunyaEngine.extractKunya(node);
      const firstName = KunyaEngine.getFirstName(node.name);
      gedcom += `1 NAME ${firstName} /${kunya || ''}/\n`;
      gedcom += `1 SEX ${node.gender === Gender.MALE ? 'M' : 'F'}\n`;
      if (node.isDeceased) {
        gedcom += `1 DEAT\n`;
      }
      if (extraData && extraData[node.id]) {
          const mData = extraData[node.id];
          if (mData.rpg) {
              gedcom += `1 NOTE RPG Data: ${JSON.stringify(mData.rpg)}\n`;
          }
          if (mData.medical) {
              gedcom += `1 NOTE Medical Data: ${JSON.stringify(mData.medical)}\n`;
          }
      }
    }

    const families: Record<string, { husb?: string, wife?: string, children: string[] }> = {};
    let famIndex = 1;

    const parentMap: Record<string, { fathers: string[], mothers: string[] }> = {};
    nodes.forEach(n => parentMap[n.id] = { fathers: [], mothers: [] });

    edges.forEach(e => {
      const nType = normalizeType(e.type);
      if (nType === RelationType.PARENT_MALE) parentMap[e.targetId]?.fathers.push(e.sourceId);
      if (nType === RelationType.PARENT_FEMALE) parentMap[e.targetId]?.mothers.push(e.sourceId);
    });

    edges.forEach(e => {
      const nType = normalizeType(e.type);
      const isMarriage = [RelationType.SPOUSE_MALE, RelationType.SPOUSE_FEMALE, RelationType.EX_SPOUSE_MALE, RelationType.EX_SPOUSE_FEMALE].includes(nType);
      
      if (isMarriage) {
        const id = `F${famIndex++}`;
        const sourceGender = nodes.find(n => n.id === e.sourceId)?.gender;
        
        const husb = (sourceGender === Gender.MALE) ? e.sourceId : e.targetId;
        const wife = (sourceGender === Gender.FEMALE) ? e.sourceId : e.targetId;
        
        families[id] = { husb, wife, children: [] };
        
        nodes.forEach(child => {
          const pm = parentMap[child.id];
          if (pm) {
            const matchesFather = !husb || pm.fathers.includes(husb);
            const matchesMother = !wife || pm.mothers.includes(wife);
            // Must have at least one valid parent in this family and match both (or ignore if missing)
            if ((husb || wife) && matchesFather && matchesMother) {
              families[id].children.push(child.id);
            }
          }
        });
      }
    });

    // Handle single parents who don't have a SPOUSE edge but have children
    const handledChildren = new Set(Object.values(families).flatMap(f => f.children));
    nodes.forEach(child => {
      if (handledChildren.has(child.id)) return;
      const pm = parentMap[child.id];
      if (pm && (pm.fathers.length > 0 || pm.mothers.length > 0)) {
        const husb = pm.fathers[0];
        const wife = pm.mothers[0];
        const id = `F${famIndex++}`;
        families[id] = { husb, wife, children: [child.id] };
        handledChildren.add(child.id);
      }
    });

    for (const famId in families) {
      const f = families[famId];
      gedcom += `0 @${famId}@ FAM\n`;
      if (f.husb) gedcom += `1 HUSB @${f.husb}@\n`;
      if (f.wife) gedcom += `1 WIFE @${f.wife}@\n`;
      for (const child of f.children) {
        gedcom += `1 CHIL @${child}@\n`;
      }
    }

    gedcom += '0 TRLR\n';
    return gedcom;
  }
}
