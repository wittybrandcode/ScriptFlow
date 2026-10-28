export function generateGedcom(characters, edges) {
  let gedcom = '0 HEAD\n1 SOUR ScriptFlow Pro\n1 CHAR UTF-8\n';
  
  // 1. Individuals (INDI)
  characters.forEach(char => {
    gedcom += `0 @I${char.id}@ INDI\n`;
    const names = char.name.split(' ');
    const given = names[0] || '';
    const sur = names.slice(1).join(' ');
    gedcom += `1 NAME ${given} /${sur}/\n`;
    if (char.gender === 'FEMALE') gedcom += '1 SEX F\n';
    else if (char.gender === 'MALE') gedcom += '1 SEX M\n';
    else gedcom += '1 SEX U\n';
  });

  // 2. Families (FAM) based on marriages
  const marriages = edges.filter(e => e.relationship_type === 'MARRIAGE' || e.relationship_type === 'SPOUSE');
  let famId = 1;

  marriages.forEach(marriage => {
    gedcom += `0 @F${famId}@ FAM\n`;
    const char1 = characters.find(c => c.id === marriage.character_id);
    const char2 = characters.find(c => c.id === marriage.partner_id);
    
    // Assign HUSB and WIFE based on gender, default to HUSB for character_id if unknown
    if (char1?.gender === 'FEMALE') {
      gedcom += `1 WIFE @I${char1.id}@\n`;
      gedcom += `1 HUSB @I${char2?.id || marriage.partner_id}@\n`;
    } else {
      gedcom += `1 HUSB @I${char1?.id || marriage.character_id}@\n`;
      gedcom += `1 WIFE @I${char2?.id || marriage.partner_id}@\n`;
    }

    // Find children for this couple
    const children = edges.filter(e => 
      (e.relationship_type === 'CHILD' || e.relationship_type === 'SON' || e.relationship_type === 'DAUGHTER') &&
      ((e.partner_id === marriage.character_id) || (e.partner_id === marriage.partner_id))
    );
    
    // Add unique children
    const childIds = new Set(children.map(c => c.character_id));
    childIds.forEach(id => {
      gedcom += `1 CHIL @I${id}@\n`;
    });

    famId++;
  });

  gedcom += '0 TRLR\n';
  return gedcom;
}

export function parseGedcom(gedcomString) {
  // Simplified GEDCOM parser for the basic INDI and FAM records
  const lines = gedcomString.split('\n');
  const characters = [];
  const relationships = [];
  
  let currentIndi = null;
  let currentFam = null;

  lines.forEach(line => {
    const parts = line.trim().split(' ');
    if (parts.length < 2) return;
    
    const level = parts[0];
    const idOrTag = parts[1];
    const tagOrVal = parts[2];

    if (level === '0') {
      if (tagOrVal === 'INDI') {
        currentIndi = { id: idOrTag.replace(/@/g, ''), name: '' };
        characters.push(currentIndi);
        currentFam = null;
      } else if (tagOrVal === 'FAM') {
        currentFam = { id: idOrTag.replace(/@/g, ''), husb: null, wife: null, children: [] };
        relationships.push(currentFam);
        currentIndi = null;
      }
    } else if (level === '1' && currentIndi) {
      if (idOrTag === 'NAME') {
        currentIndi.name = parts.slice(2).join(' ').replace(/\//g, '').trim();
      } else if (idOrTag === 'SEX') {
        currentIndi.gender = tagOrVal === 'F' ? 'FEMALE' : (tagOrVal === 'M' ? 'MALE' : 'UNKNOWN');
      }
    } else if (level === '1' && currentFam) {
      if (idOrTag === 'HUSB') currentFam.husb = tagOrVal.replace(/@/g, '');
      if (idOrTag === 'WIFE') currentFam.wife = tagOrVal.replace(/@/g, '');
      if (idOrTag === 'CHIL') currentFam.children.push(tagOrVal.replace(/@/g, ''));
    }
  });

  return { characters, relationships };
}
