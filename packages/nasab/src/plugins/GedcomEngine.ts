import { Person, Relation } from '../core/types';
import { RelationType, Gender } from '../core/enums';
import { KunyaEngine } from '../kinship/KunyaEngine';
import { normalizeType } from '../core/normalizer';

export interface GedcomLine {
  level: number;
  tagOrId: string;
  value: string;
  children: GedcomLine[];
}

/**
 * محرك استيراد وتصدير ملفات GEDCOM (المعيار الدولي لشجرات العائلات).
 */
export class GedcomEngine {
  /**
   * يُحلل نص GEDCOM ويُرجع قائمة أشخاص وعلاقات.
   *
   * @param gedcomText - محتوى ملف GEDCOM كنص
   * @returns `{ nodes, edges }` جاهزة للاستخدام مع باقي المحركات
   */
  static parse(gedcomText: string): { nodes: Person[], edges: Relation[] } {
    let processedText = gedcomText;

    // 1. Detect and normalize ANSEL encoding
    if (gedcomText.includes('1 CHAR ANSEL') || gedcomText.includes('1 CHAR ansel')) {
      processedText = GedcomEngine.decodeAnsel(gedcomText);
    }

    const lines = processedText.split(/\r?\n/).filter(line => line.trim() !== '');
    const persons: Record<string, Person> = {};
    const edges: Relation[] = [];

    const root: GedcomLine[] = [];
    const stack: GedcomLine[] = [];

    // 2. Tokenize and build hierarchical tree structure
    for (const line of lines) {
      const match = line.match(/^\s*(\d+)\s+(@\S+@|\S+)(?:\s+(.*))?$/);
      if (!match) continue;

      const level = parseInt(match[1], 10);
      const tagOrId = match[2];
      const value = (match[3] || '').trim();

      const currentLine: GedcomLine = {
        level,
        tagOrId,
        value,
        children: []
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(currentLine);
      } else {
        root.push(currentLine);
      }

      stack.push(currentLine);
    }

    const famFamilies: Record<string, { husb?: string, wife?: string, children: string[] }> = {};

    // 3. Process the hierarchical tree
    for (const line of root) {
      if (line.value === 'INDI') {
        const id = line.tagOrId;
        const p: Person = {
          id,
          name: 'مجهول',
          gender: Gender.MALE,
          isDeceased: false
        };

        for (const child of line.children) {
          if (child.tagOrId === 'NAME') {
            p.name = child.value.replace(/\//g, '').trim();
          } else if (child.tagOrId === 'SEX') {
            p.gender = child.value === 'F' ? Gender.FEMALE : Gender.MALE;
          } else if (child.tagOrId === 'DEAT') {
            p.isDeceased = true;
            const dateChild = child.children.find(c => c.tagOrId === 'DATE');
            if (dateChild) {
              p.deathDate = dateChild.value;
            }
          } else if (child.tagOrId === 'BIRT') {
            const dateChild = child.children.find(c => c.tagOrId === 'DATE');
            if (dateChild) {
              p.birthDate = dateChild.value;
            }
          }
        }
        persons[id] = p;
      } else if (line.value === 'FAM') {
        const id = line.tagOrId;
        const f: { husb?: string, wife?: string, children: string[] } = { children: [] };
        
        for (const child of line.children) {
          if (child.tagOrId === 'HUSB') {
            f.husb = child.value;
          } else if (child.tagOrId === 'WIFE') {
            f.wife = child.value;
          } else if (child.tagOrId === 'CHIL') {
            f.children.push(child.value);
          }
        }
        famFamilies[id] = f;
      }
    }

    // Process families into edges
    for (const famId in famFamilies) {
      const f = famFamilies[famId];
      if (f.husb && f.wife) {
        edges.push({
          sourceId: f.husb,
          targetId: f.wife,
          type: RelationType.SPOUSE_MALE
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

  private static decodeAnsel(str: string): string {
    const anselToUnicodeMap: Record<number, string> = {
      0xA1: 'Ł', 0xA2: 'Ø', 0xA3: 'Đ', 0xA4: 'Þ', 0xA5: 'Æ', 0xA6: 'Œ', 0xA7: 'ʻ',
      0xA8: '·', 0xA9: '♭', 0xAA: '®', 0xAB: '±', 0xB1: 'ł', 0xB2: 'ø',
      0xB3: 'đ', 0xB4: 'þ', 0xB5: 'æ', 0xB6: 'œ', 0xB7: 'ß',
      0xE0: '\u0309', 0xE1: '\u0300', 0xE2: '\u0301', 0xE3: '\u0302', 0xE4: '\u0303',
      0xE5: '\u0304', 0xE6: '\u0306', 0xE7: '\u0307', 0xE8: '\u0308', 0xE9: '\u030C',
      0xEA: '\u030A', 0xEB: '\u0327', 0xEC: '\u0328', 0xED: '\u0323', 0xEE: '\u0324',
      0xEF: '\u0330', 0xF0: '\u0326', 0xF1: '\u0310', 0xF2: '\u0311', 0xF6: '\u035C',
    };

    let result = '';
    let pendingDiacritic = '';

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code >= 0xE0 && code <= 0xFE) {
        pendingDiacritic = anselToUnicodeMap[code] || '';
      } else {
        const baseChar = anselToUnicodeMap[code] || str[i];
        result += baseChar;
        if (pendingDiacritic) {
          result += pendingDiacritic;
          pendingDiacritic = '';
        }
      }
    }

    return result.normalize('NFC');
  }

  static generate(nodes: Person[], edges: Relation[]): string {
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
