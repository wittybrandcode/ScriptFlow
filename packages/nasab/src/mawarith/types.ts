import { Person } from '../core/types';
import { EvidenceCitation } from '../../packages/nasab-rule-engine/src/types';

export interface HeirShare {
  person: Person;
  share: string;
  exactShare?: string;
  isBlocked?: boolean;
  notes?: string;
  relation: string;
  evidence?: EvidenceCitation[];
}

export interface InheritanceResult {
  base: number;
  shares: { heirId: string; share: number; relationAr: string; notes?: string; isBlocked?: boolean }[];
  awlApplied: boolean;
  raddApplied: boolean;
  totalFard: string;
}

interface AsabaGroup {
  persons: Person[];
  relation: string;
  asabaType: string;
  maleWeight: number;
  femaleWeight: number;
}

export interface MawarithContext {
  deceased: Person;
  isMale: boolean;
  hasMaleDescendant: boolean;
  hasFemaleDescendant: boolean;
  hasDescendant: boolean;
  siblingsCount: number;

  relatives: {
    spouses: Person[];
    fathers: Person[];
    mothers: Person[];
    sons: Person[];
    daughters: Person[];
    fullBrothers: Person[];
    fullSisters: Person[];
    paternalBrothers: Person[];
    paternalSisters: Person[];
    maternalBrothers: Person[];
    maternalSisters: Person[];
    grandsons: Person[];
    granddaughters: Person[];
    grandfathers: Person[];
    grandmothers: Person[];
    uncles: Person[];
    aunts: Person[];
    nephews: Person[];
    nieces: Person[];
  };

  // State
  heirs: HeirShare[];
  fardShares: Map<string, string>;
  asaba: AsabaGroup | null;
  blockedIds: Set<string>;

  // Context Helpers
  addFard: (person: Person, relation: string, fard: string, notes: string) => void;
  block: (persons: Person[], relation: string, notes: string) => void;
}
