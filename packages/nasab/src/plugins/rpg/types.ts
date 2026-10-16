export interface RPGTrait {
    id: string;
    name: string;
    description?: string;
    type: 'species' | 'magic' | 'curse' | 'physical' | 'custom';
    dominance: number; // 0.0 to 1.0 (1.0 being highly dominant, 0.0 being recessive)
    value?: string | number | boolean;
}

export interface RPGCharacterData {
    traits: RPGTrait[];
    titles: string[];
    class?: string;
    species?: string;
    metadata?: Record<string, any>;
}

export type SuccessionLaw = 
    | 'Primogeniture' // Oldest child inherits
    | 'Ultimogeniture' // Youngest child inherits
    | 'Seniority' // Oldest member of the dynasty inherits
    | 'Agnatic' // Male-only succession
    | 'Cognatic'; // Equal succession regardless of gender
