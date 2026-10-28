import biologicalTypesLegacy from '../../../data/biologicalRelationships.json';
import dramaticTypesRaw from '../../../data/dramaticRelationships.json';
import { RELATION_CATEGORIES } from 'nasab';

export interface RelationshipTypeDefinition {
  id: string;
  label: string;
  edgeLabel?: string;
  category?: string;
  sourceGender?: string | null;
  inverseId?: string | null;
  edgeLabelMale?: string;
  edgeLabelFemale?: string;
  [key: string]: any;
}

// Export dramaticTypes for consistency
export const dramaticTypes: RelationshipTypeDefinition[] = (dramaticTypesRaw as any[]).map(t => ({
  category: 'DRAMATIC',
  ...t
}));

// Build biological types from NASAB
export const biologicalTypes: RelationshipTypeDefinition[] = Object.entries(RELATION_CATEGORIES).flatMap(([_, categoryObj]: [string, any]) => 
  categoryObj.options.map((opt: any) => ({
    id: opt.value,
    label: opt.label,
    edgeLabel: opt.label,
    category: 'BIOLOGICAL',
    sourceGender: opt.gender ? opt.gender.toUpperCase() : null
  }))
);

// Merge legacy types
(biologicalTypesLegacy as any[]).forEach(legacy => {
  const existing = biologicalTypes.find(t => t.id === legacy.id);
  if (existing) {
    if (legacy.inverseId) existing.inverseId = legacy.inverseId;
    if (legacy.edgeLabelMale) existing.edgeLabelMale = legacy.edgeLabelMale;
    if (legacy.edgeLabelFemale) existing.edgeLabelFemale = legacy.edgeLabelFemale;
  } else {
    biologicalTypes.push({ ...legacy });
  }
});

// Build a fast lookup map from all types
export const ALL_TYPES: RelationshipTypeDefinition[] = [...biologicalTypes, ...dramaticTypes];
export const TYPE_MAP: Record<string, RelationshipTypeDefinition> = {};
ALL_TYPES.forEach(t => { TYPE_MAP[t.id] = t; });

// Aliases
TYPE_MAP['FATHER'] = TYPE_MAP['PARENT_MALE'] || TYPE_MAP['FATHER_OF'];
TYPE_MAP['MOTHER'] = TYPE_MAP['PARENT_FEMALE'] || TYPE_MAP['MOTHER_OF'];

export const getAllTypesByViewMode = (viewMode: string): RelationshipTypeDefinition[] => {
  return viewMode === 'BIOLOGICAL' ? biologicalTypes : dramaticTypes;
};
