import biologicalTypesLegacy from '../../../data/biologicalRelationships.json';
import dramaticTypesRaw from '../../../data/dramaticRelationships.json';
import { RELATION_CATEGORIES } from 'nasab';

// Export dramaticTypes for consistency
export const dramaticTypes = dramaticTypesRaw;

// Build biological types from NASAB
export const biologicalTypes = Object.entries(RELATION_CATEGORIES).flatMap(([categoryLabel, categoryObj]) => 
  categoryObj.options.map(opt => ({
    id: opt.value,
    label: opt.label,
    edgeLabel: opt.label,
    category: 'BIOLOGICAL',
    sourceGender: opt.gender ? opt.gender.toUpperCase() : null
  }))
);

// Merge legacy types
biologicalTypesLegacy.forEach(legacy => {
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
export const ALL_TYPES = [...biologicalTypes, ...dramaticTypes];
export const TYPE_MAP = {};
ALL_TYPES.forEach(t => { TYPE_MAP[t.id] = t; });

// Aliases
TYPE_MAP['FATHER'] = TYPE_MAP['PARENT_MALE'] || TYPE_MAP['FATHER_OF'];
TYPE_MAP['MOTHER'] = TYPE_MAP['PARENT_FEMALE'] || TYPE_MAP['MOTHER_OF'];

export const getAllTypesByViewMode = (viewMode) => {
  return viewMode === 'BIOLOGICAL' ? biologicalTypes : dramaticTypes;
};
