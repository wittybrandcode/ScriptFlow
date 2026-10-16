import { KinshipEngine, Person, Gender, RelationType } from '../../index';
import { RPGTrait, RPGCharacterData, SuccessionLaw } from './types';

export class RPGLineageEngine {
    private kinship: KinshipEngine;
    private characterData: Map<string, RPGCharacterData>;

    constructor(kinshipEngine?: KinshipEngine) {
        this.kinship = kinshipEngine || new KinshipEngine();
        this.characterData = new Map();
    }

    public getKinshipEngine(): KinshipEngine {
        return this.kinship;
    }

    public getPerson(personId: string): Person | undefined {
        return this.kinship.getNodes().find(n => n.id === personId);
    }

    public setCharacterData(personId: string, data: RPGCharacterData): void {
        if (!this.getPerson(personId)) {
            throw new Error(`Person ${personId} does not exist in KinshipEngine`);
        }
        this.characterData.set(personId, data);
    }

    public getCharacterData(personId: string): RPGCharacterData | undefined {
        return this.characterData.get(personId);
    }

    public addTrait(personId: string, trait: RPGTrait): void {
        let data = this.characterData.get(personId);
        if (!data) {
            data = { traits: [], titles: [] };
            this.characterData.set(personId, data);
        }
        // Avoid duplicate traits
        if (!data.traits.find(t => t.id === trait.id)) {
            data.traits.push(trait);
        }
    }

    /**
     * Find parents using the relations in KinshipEngine.
     */
    private getParents(personId: string): Person[] {
        const relations = this.kinship.getRelations();
        const nodes = this.kinship.getNodes();
        
        // PARENT relation indicates from Parent to Child.
        // CHILD relation indicates from Child to Parent.
        const parentIds = new Set<string>();

        relations.forEach(rel => {
            // If the relation is Parent -> Child and Target is our person
            if (rel.targetId === personId && (rel.type === RelationType.PARENT_MALE || rel.type === RelationType.PARENT_FEMALE)) {
                parentIds.add(rel.sourceId);
            }
            // If the relation is Child -> Parent and Source is our person
            if (rel.sourceId === personId && (rel.type === RelationType.CHILD_MALE || rel.type === RelationType.CHILD_FEMALE)) {
                parentIds.add(rel.targetId);
            }
        });

        return Array.from(parentIds)
            .map(id => nodes.find(n => n.id === id))
            .filter((p): p is Person => p !== undefined);
    }

    /**
     * Find children using the relations in KinshipEngine.
     */
    private getChildren(personId: string): Person[] {
        const relations = this.kinship.getRelations();
        const nodes = this.kinship.getNodes();
        
        const childIds = new Set<string>();

        relations.forEach(rel => {
            // Parent -> Child where Source is our person
            if (rel.sourceId === personId && (rel.type === RelationType.PARENT_MALE || rel.type === RelationType.PARENT_FEMALE)) {
                childIds.add(rel.targetId);
            }
            // Child -> Parent where Target is our person
            if (rel.targetId === personId && (rel.type === RelationType.CHILD_MALE || rel.type === RelationType.CHILD_FEMALE)) {
                childIds.add(rel.sourceId);
            }
        });

        return Array.from(childIds)
            .map(id => nodes.find(n => n.id === id))
            .filter((p): p is Person => p !== undefined);
    }

    /**
     * Calculates the offspring traits based on the traits of their parents
     */
    public calculateOffspringTraits(personId: string): RPGTrait[] {
        const parents = this.getParents(personId);
        if (parents.length === 0) return [];
        
        const offspringTraits: Map<string, RPGTrait> = new Map();
        
        parents.forEach(parent => {
            const data = this.characterData.get(parent.id);
            if (data) {
                data.traits.forEach(trait => {
                    const existingTrait = offspringTraits.get(trait.id);
                    if (existingTrait) {
                       if (trait.dominance > existingTrait.dominance) {
                           offspringTraits.set(trait.id, trait);
                       }
                    } else {
                        offspringTraits.set(trait.id, trait);
                    }
                });
            }
        });

        // Simple dominance rule: only inherit traits with dominance >= 0.5
        // Or traits where both parents have them
        return Array.from(offspringTraits.values()).filter(t => t.dominance >= 0.5);
    }

    /**
     * Finds the legal heir to a character's title based on strict succession law 
     */
    public findHeirToTitle(deceasedId: string, law: SuccessionLaw): Person | null {
        const children = this.getChildren(deceasedId);
        if (children.length === 0) return null;

        // In a real game we would sort by Age. 
        // For our abstract engine, we assume the first entered is oldest,
        // or we expect users to add custom age data in metadata.
        // Let's sort using a mock age parameter or default stable order.

        const sortedChildren = [...children].sort((a, b) => {
            const aData = this.characterData.get(a.id);
            const bData = this.characterData.get(b.id);
            const aAge = aData?.metadata?.age || 0;
            const bAge = bData?.metadata?.age || 0;
            // Higher age is older
            return bAge - aAge;
        });

        switch (law) {
            case 'Primogeniture':
                return sortedChildren[0];
            
            case 'Ultimogeniture':
                return sortedChildren[sortedChildren.length - 1];

            case 'Agnatic': {
                // Agnatic Primogeniture: Oldest male inherits.
                const sons = sortedChildren.filter(c => c.gender === Gender.MALE);
                return sons.length > 0 ? sons[0] : null;
            }

            case 'Cognatic':
                // Equal succession, behaves like Primogeniture
                return sortedChildren[0];

            case 'Seniority':
                // Simplest fallback for now - oldest child
                // True Seniority would check siblings too
                return sortedChildren[0];
                
            default:
                return null;
        }
    }
}
