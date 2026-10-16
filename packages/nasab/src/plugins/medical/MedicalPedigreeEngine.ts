import { 
  Condition, 
  MedicalPerson, 
  MedicalResult, 
  ConditionProbability, 
  InheritancePattern,
  MedicalStatus
} from './types';

export class MedicalPedigreeEngine {
  
  /**
   * Calculates the probabilities of each condition for all persons in a pedigree.
   * Performs a forward-pass calculation from ancestors to descendants.
   */
  public static calculateRisks(persons: MedicalPerson[], conditions: Condition[]): MedicalResult[] {
    const results: MedicalResult[] = [];
    
    // 1. Topologically sort persons
    const sortedPersons = this.topologicalSort(persons);
    
    // 2. We will store calculated copies per person per condition
    // Map<personId, Map<conditionId, {0, 1, 2}>>
    const memo = new Map<string, Map<string, {0: number, 1: number, 2: number}>>();
    
    for (const person of sortedPersons) {
      memo.set(person.id, new Map());
      
      for (const condition of conditions) {
        const conditionStatus = person.conditions.find(c => c.conditionId === condition.id)?.status || 'UNKNOWN';
        
        let copies = { 0: 0, 1: 0, 2: 0 };
        
        if (conditionStatus !== 'UNKNOWN') {
          // Explicit status override
          copies = this.getExplicitCopies(conditionStatus, condition.inheritancePattern, person.gender);
        } else {
          // Calculate from parents
          if (!person.fatherId && !person.motherId) {
             copies = this.getFounderCopies(condition, person.gender);
          } else {
             const momCopies = person.motherId && memo.get(person.motherId)?.get(condition.id) 
                 ? memo.get(person.motherId)!.get(condition.id)! 
                 : this.getFounderCopies(condition, 'FEMALE');
                 
             const dadCopies = person.fatherId && memo.get(person.fatherId)?.get(condition.id) 
                 ? memo.get(person.fatherId)!.get(condition.id)! 
                 : this.getFounderCopies(condition, 'MALE');
                 
             copies = this.calculateChildCopies(momCopies, dadCopies, pattern(condition.inheritancePattern), person.gender);
          }
        }
        
        memo.get(person.id)!.set(condition.id, copies);
        
        // Convert to output probability
        results.push({
          personId: person.id,
          conditionId: condition.id,
          probability: this.toProbability(copies, condition.inheritancePattern, person.gender)
        });
      }
    }
    
    return results;
  }

  private static topologicalSort(persons: MedicalPerson[]): MedicalPerson[] {
    const personMap = new Map(persons.map(p => [p.id, p]));
    const visited = new Set<string>();
    const sorted: MedicalPerson[] = [];

    const visit = (id: string, path: Set<string> = new Set()) => {
      if (visited.has(id)) return;
      if (path.has(id)) {
        // Cycle detected, break it
        return;
      }
      path.add(id);
      const p = personMap.get(id);
      if (p) {
        if (p.fatherId) visit(p.fatherId, path);
        if (p.motherId) visit(p.motherId, path);
        sorted.push(p);
      }
      visited.add(id);
      path.delete(id);
    };

    persons.forEach(p => visit(p.id));
    return sorted;
  }

  private static getExplicitCopies(status: MedicalStatus, pattern: InheritancePattern, gender: 'MALE' | 'FEMALE'): {0: number, 1: number, 2: number} {
    if (status === 'UNAFFECTED') return { 0: 1, 1: 0, 2: 0 };
    
    const isMaleXY = gender === 'MALE' && ['X_LINKED_RECESSIVE', 'X_LINKED_DOMINANT', 'Y_LINKED'].includes(pattern);
    
    if (status === 'AFFECTED') {
      if (pattern === 'AUTOSOMAL_RECESSIVE' || (pattern === 'X_LINKED_RECESSIVE' && gender === 'FEMALE')) {
        return { 0: 0, 1: 0, 2: 1 };
      }
      if (isMaleXY) {
        return { 0: 0, 1: 1, 2: 0 }; 
      }
      // For AD, or XD female, assuming heterozygous by default for affected explicit status
      return { 0: 0, 1: 1, 2: 0 }; 
    }
    
    if (status === 'CARRIER') {
      return { 0: 0, 1: 1, 2: 0 };
    }
    
    return { 0: 1, 1: 0, 2: 0 }; // fallback
  }

  private static getFounderCopies(condition: Condition, gender: 'MALE' | 'FEMALE'): {0: number, 1: number, 2: number} {
    const f = condition.baselineAlleleFrequency || 0.0;
    
    const isMaleXY = gender === 'MALE' && ['X_LINKED_RECESSIVE', 'X_LINKED_DOMINANT', 'Y_LINKED'].includes(condition.inheritancePattern);
    
    if (isMaleXY) {
      return { 0: 1 - f, 1: f, 2: 0 };
    }
    
    return {
      0: (1 - f) * (1 - f),
      1: 2 * f * (1 - f),
      2: f * f
    };
  }

  private static calculateChildCopies(
    mom: {0: number, 1: number, 2: number}, 
    dad: {0: number, 1: number, 2: number}, 
    pattern: InheritancePattern, 
    childGender: 'MALE' | 'FEMALE'
  ): {0: number, 1: number, 2: number} {
    
    // Mom's pass prob
    let M = 0;
    if (pattern === 'Y_LINKED') {
      M = 0;
    } else {
      M = mom[2] + 0.5 * mom[1];
    }
    
    // Dad's pass prob
    let D = 0;
    if (pattern === 'AUTOSOMAL_RECESSIVE' || pattern === 'AUTOSOMAL_DOMINANT') {
      D = dad[2] + 0.5 * dad[1];
    } else if (pattern === 'X_LINKED_RECESSIVE' || pattern === 'X_LINKED_DOMINANT') {
      D = childGender === 'FEMALE' ? dad[1] : 0;
    } else if (pattern === 'Y_LINKED') {
      D = childGender === 'MALE' ? dad[1] : 0;
    }

    if (childGender === 'MALE' && ['X_LINKED_RECESSIVE', 'X_LINKED_DOMINANT', 'Y_LINKED'].includes(pattern)) {
       // Males only have 1 active allele from M or D
       const risk = M + D; // M will be 0 for Y-linked, D will be 0 for X-linked
       return { 0: 1 - risk, 1: risk, 2: 0 };
    }
    
    return {
      0: (1 - M) * (1 - D),
      1: M * (1 - D) + (1 - M) * D,
      2: M * D
    };
  }

  private static toProbability(copies: {0: number, 1: number, 2: number}, pattern: InheritancePattern, gender: 'MALE' | 'FEMALE'): ConditionProbability {
    let affected = 0;
    let carrier = 0;
    let unaffected = 0;

    const isMaleXY = gender === 'MALE' && ['X_LINKED_RECESSIVE', 'X_LINKED_DOMINANT', 'Y_LINKED'].includes(pattern);

    if (isMaleXY) {
       affected = copies[1];
       unaffected = copies[0];
    } else {
       if (pattern === 'AUTOSOMAL_RECESSIVE' || pattern === 'X_LINKED_RECESSIVE') {
         affected = copies[2];
         carrier = copies[1];
         unaffected = copies[0];
       } else if (pattern === 'AUTOSOMAL_DOMINANT' || pattern === 'X_LINKED_DOMINANT') {
         affected = copies[2] + copies[1];
         unaffected = copies[0];
       } else if (pattern === 'Y_LINKED' && gender === 'FEMALE') {
         unaffected = 1; // Females never get Y-linked
       }
    }

    return {
      affected, carrier, unaffected, copies
    };
  }
}
// Helper to fix TS finding pattern var
function pattern(p: InheritancePattern) { return p; }
