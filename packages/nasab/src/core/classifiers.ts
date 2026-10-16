import { RelationType } from './enums';
import { normalizeType } from './normalizer';

const MARRIAGE_TYPES = new Set<string>([
  RelationType.SPOUSE_MALE, RelationType.SPOUSE_FEMALE,
  RelationType.EX_SPOUSE_MALE, RelationType.EX_SPOUSE_FEMALE,
  RelationType.SPOUSES, RelationType.EX_SPOUSES,
  RelationType.DIVORCED_REVOCABLE_MALE, RelationType.DIVORCED_REVOCABLE_FEMALE,
  RelationType.DIVORCED_IRREVOCABLE_MALE, RelationType.DIVORCED_IRREVOCABLE_FEMALE,
]);

const SIBLING_TYPES = new Set<string>([
  RelationType.SIBLING_MALE, RelationType.SIBLING_FEMALE,
  RelationType.SIBLING_PATERNAL_MALE, RelationType.SIBLING_PATERNAL_FEMALE,
  RelationType.SIBLING_MATERNAL_MALE, RelationType.SIBLING_MATERNAL_FEMALE,
  RelationType.HALF_SIBLING_MALE, RelationType.HALF_SIBLING_FEMALE,
  RelationType.SIBLINGS,
]);

const PARENT_TYPES = new Set<string>([
  RelationType.PARENT_MALE, RelationType.PARENT_FEMALE,
]);

const CHILD_TYPES = new Set<string>([
  RelationType.CHILD_MALE, RelationType.CHILD_FEMALE,
]);

export function isMarriage(rawType: string): boolean {
  return MARRIAGE_TYPES.has(normalizeType(rawType));
}

export function isSibling(rawType: string): boolean {
  return SIBLING_TYPES.has(normalizeType(rawType));
}

export function isParentChild(rawType: string): boolean {
  const t = normalizeType(rawType);
  return PARENT_TYPES.has(t) || CHILD_TYPES.has(t);
}

export function isHorizontalRelation(rawType: string): boolean {
  return isMarriage(rawType) || isSibling(rawType);
}
