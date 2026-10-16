import { Animal, InbreedingResult, LineageResult } from './types';

export class AnimalBreedingEngine {
  
  /**
   * Traces the direct sire line and dam line for an animal.
   * Also computes whether the animal is purebred based on a target breed.
   */
  public static traceLineage(animalId: string, animals: Animal[], targetBreed?: string): LineageResult {
    const animalMap = new Map(animals.map(a => [a.id, a]));
    const target = animalMap.get(animalId);
    
    if (!target) {
      throw new Error(`Animal with id ${animalId} not found.`);
    }

    const breedToMatch = targetBreed || target.breed;

    const getLine = (startId: string | null | undefined, type: 'sire' | 'dam'): Animal[] => {
      const line: Animal[] = [];
      let currentId = startId;
      while (currentId) {
        const current = animalMap.get(currentId);
        if (!current) break;
        line.push(current);
        currentId = type === 'sire' ? current.sireId : current.damId;
      }
      return line;
    };

    const sireLine = getLine(target.sireId, 'sire');
    const damLine = getLine(target.damId, 'dam');

    // Calculate purebred percentage recursively
    const memo = new Map<string, number>();

    const calculatePurebredPercentage = (id: string, expectedBreed?: string): number => {
      if (memo.has(id)) return memo.get(id)!;

      const a = animalMap.get(id);
      if (!a) return 0; // unknown ancestor reduces purebred percentage? Or maybe 0?

      if (!a.sireId && !a.damId) {
        // Founder
        const pct = a.breed === expectedBreed ? 1.0 : 0.0;
        memo.set(id, pct);
        return pct;
      }

      const sirePct = a.sireId ? calculatePurebredPercentage(a.sireId, expectedBreed) : 0;
      const damPct = a.damId ? calculatePurebredPercentage(a.damId, expectedBreed) : 0;
      
      const pct = (sirePct + damPct) / 2.0;
      memo.set(id, pct);
      return pct;
    };

    let purebredPercentage = 1.0;
    if (breedToMatch) {
        purebredPercentage = calculatePurebredPercentage(animalId, breedToMatch);
    }

    return {
      animalId,
      sireLine,
      damLine,
      isPurebred: purebredPercentage === 1.0,
      purebredPercentage
    };
  }

  /**
   * Calculates the Coefficient of Inbreeding (COI) using Wright's Path Method.
   * COI = Sum [ (1/2)^(n1 + n2 + 1) * (1 + Fa) ]
   */
  public static calculateInbreeding(animalId: string, animals: Animal[]): InbreedingResult {
    const animalMap = new Map(animals.map(a => [a.id, a]));
    const target = animalMap.get(animalId);

    if (!target) {
      throw new Error(`Animal with id ${animalId} not found.`);
    }

    if (!target.sireId || !target.damId) {
      return { animalId, coi: 0, commonAncestors: [] };
    }

    const { coi, commonAncestors } = this.computeCOI(target.sireId, target.damId, animalMap);

    return {
      animalId,
      coi,
      commonAncestors
    };
  }

  /**
   * DFS to find all paths from a starting animal to all its ancestors.
   * Returns a Map<ancestorId, number[][]> where each number[] is the genders (or just lengths) of paths
   */
  private static getAncestorPaths(startId: string, animalMap: Map<string, Animal>): Map<string, number[]> {
      const paths = new Map<string, number[]>();
      
      // DFS function
      // pathLength is number of generations
      const dfs = (currentId: string, pathLength: number) => {
          if (!paths.has(currentId)) {
              paths.set(currentId, []);
          }
          paths.get(currentId)!.push(pathLength);

          const animal = animalMap.get(currentId);
          if (animal) {
              if (animal.sireId) dfs(animal.sireId, pathLength + 1);
              if (animal.damId) dfs(animal.damId, pathLength + 1);
          }
      };

      dfs(startId, 0);
      return paths;
  }

  private static computeCOI(sireId: string, damId: string, animalMap: Map<string, Animal>): { coi: number, commonAncestors: string[] } {
      const sirePaths = this.getAncestorPaths(sireId, animalMap);
      const damPaths = this.getAncestorPaths(damId, animalMap);

      // Find common ancestors
      const commonAncestors = new Set<string>();
      for (const id of sirePaths.keys()) {
          if (damPaths.has(id)) {
              commonAncestors.add(id);
          }
      }

      // Filter out ancestors, keep only the top ones?
      // Actually Wright's equation sums over paths that go through a common ancestor but DO NOT go through another common ancestor in the same path.
      // Easiest true calculation: compute kinship between sire and dam.
      // COI(Target) = Kinship(Sire, Dam)
      // Kinship(A, B): expected fraction of identical by descent alleles
      // Using tabular method (much simpler and correct for complex pedigrees).
      return this.computeTabularCOI(sireId, damId, animalMap);
  }

  private static computeTabularCOI(sireId: string, damId: string, animalMap: Map<string, Animal>): { coi: number, commonAncestors: string[] } {
      // 1. Topologically sort the ancestors of sire and dam
      const relevantAnimals = this.getAncestors([sireId, damId], animalMap);
      const sortedIds = this.topologicalSort(relevantAnimals, animalMap);

      const n = sortedIds.length;
      const idToIndex = new Map<string, number>();
      for (let i = 0; i < n; i++) {
          idToIndex.set(sortedIds[i], i);
      }

      // 2. Build the numerator relationship matrix A (size n x n)
      const A: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

      for (let i = 0; i < n; i++) {
          const p = animalMap.get(sortedIds[i]);
          if (!p) continue;
          
          const sireIdx = p.sireId !== undefined && p.sireId !== null ? idToIndex.get(p.sireId) : -1;
          const damIdx = p.damId !== undefined && p.damId !== null ? idToIndex.get(p.damId) : -1;

          // Diagonal A[i][i] = 1 + 0.5 * A[sire][dam]
          if (sireIdx !== -1 && sireIdx !== undefined && damIdx !== -1 && damIdx !== undefined) {
              A[i][i] = 1 + 0.5 * A[sireIdx][damIdx];
          } else {
              A[i][i] = 1.0;
          }

          // Off-diagonal A[i][j] = A[j][i] = 0.5 * A[j][sire] + 0.5 * A[j][dam]
          for (let j = 0; j < i; j++) {
              const rSire = sireIdx !== -1 && sireIdx !== undefined ? A[j][sireIdx] : 0;
              const rDam = damIdx !== -1 && damIdx !== undefined ? A[j][damIdx] : 0;
              A[i][j] = 0.5 * (rSire + rDam);
              A[j][i] = A[i][j];
          }
      }

      // COI of child is half the relationship between sire and dam
      const sIdx = idToIndex.get(sireId);
      const dIdx = idToIndex.get(damId);

      let coi = 0;
      if (sIdx !== undefined && dIdx !== undefined) {
          coi = 0.5 * A[sIdx][dIdx];
      }

      // We still want common ancestors
      const sirePaths = this.getAncestorPaths(sireId, animalMap);
      const damPaths = this.getAncestorPaths(damId, animalMap);
      const commonAncestors = [];
      for (const id of sirePaths.keys()) {
          if (damPaths.has(id)) {
              commonAncestors.push(id);
          }
      }

      return { coi, commonAncestors };
  }

  private static getAncestors(startIds: string[], animalMap: Map<string, Animal>): Set<string> {
      const visited = new Set<string>();
      
      const visit = (id: string) => {
          if (visited.has(id)) return;
          visited.add(id);
          const a = animalMap.get(id);
          if (a) {
              if (a.sireId) visit(a.sireId);
              if (a.damId) visit(a.damId);
          }
      };

      for (const id of startIds) {
          visit(id);
      }
      return visited;
  }

  private static topologicalSort(ids: Set<string>, animalMap: Map<string, Animal>): string[] {
      const sorted: string[] = [];
      const visited = new Set<string>();

      const visit = (id: string) => {
          if (visited.has(id)) return;
          const a = animalMap.get(id);
          if (a) {
              if (a.sireId && ids.has(a.sireId)) visit(a.sireId);
              if (a.damId && ids.has(a.damId)) visit(a.damId);
          }
          visited.add(id);
          sorted.push(id);
      };

      for (const id of ids) {
          visit(id);
      }
      return sorted;
  }
}
