interface DNAInfo {
  genotype?: string;
  markers?: Record<string, string>;
  isVerified?: boolean;
}

export interface Animal {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  sireId?: string | null;  // father
  damId?: string | null;   // mother
  registrationNumber?: string;
  breed?: string;
  coatColor?: string;
  birthDate?: string;
  dna?: DNAInfo;
}

export interface InbreedingResult {
  animalId: string;
  coi: number; // Coefficient of Inbreeding (0.0 to 1.0)
  commonAncestors: string[];
}

export interface LineageResult {
  animalId: string;
  sireLine: Animal[]; // Direct paternal line (Sire -> Sire's Sire -> etc.)
  damLine: Animal[];  // Direct maternal line (Dam -> Dam's Dam -> etc.)
  isPurebred: boolean;
  purebredPercentage: number;
}
