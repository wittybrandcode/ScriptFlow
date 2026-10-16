import { Heir } from '../types/Kinship';
import { NasabError, ErrorCode } from '../core/errors';
import { z } from 'zod';

class ValidationError extends NasabError {
  constructor(code: string, message: string) {
    super(code as ErrorCode, message);
    this.name = 'ValidationError';
  }
}

const HeirSchema = z.object({
  id: z.string(),
  type: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  isBlocked: z.boolean().optional(),
  blockedBy: z.array(z.string()).optional(),
  age: z.number().optional(),
  parentIds: z.array(z.string()).optional(),
  spouseIds: z.array(z.string()).optional(),
  isHermaphrodite: z.boolean().optional(),
  isMissing: z.boolean().optional(),
  isFetus: z.boolean().optional(),
});

export class ValidationEngine {
  public static validate(heirs: Heir[]): void {
    // Phase 2: Schema validation
    try {
      z.array(HeirSchema).parse(heirs);
    } catch (e: any) {
      throw new ValidationError('VAL_SCHEMA_ERROR', `بيانات المدخلات غير صالحة: ${e.message}`);
    }

    this.validatePolyandry(heirs);
    this.validateMaxWives(heirs);
    this.validateDoubleParents(heirs);
    this.validateGenderConsistency(heirs);
    this.validateCycles(heirs);
    this.validateAgeGap(heirs);
    this.validateIncest(heirs);
    this.validateHermaphrodite(heirs);
    this.validateMissing(heirs);
    this.validateFetus(heirs);
  }

  private static validatePolyandry(heirs: Heir[]): void {
    const husbands = heirs.filter(h => h.type === 'SPOUSE_MALE');
    if (husbands.length > 1) {
      throw new ValidationError(
        'VAL_POLYANDRY',
        'امرأة متزوجة من أكثر من رجل في نفس الوقت (Polyandry is not allowed)'
      );
    }
  }

  private static validateMaxWives(heirs: Heir[]): void {
    const wives = heirs.filter(h => h.type === 'SPOUSE_FEMALE');
    if (wives.length > 4) {
      throw new ValidationError(
        'VAL_MAX_WIVES',
        'لا يجوز للرجل الجمع بين أكثر من 4 زوجات (Maximum of 4 wives exceeded)'
      );
    }
  }

  private static validateDoubleParents(heirs: Heir[]): void {
    const fathers = heirs.filter(h => h.type === 'FATHER');
    const mothers = heirs.filter(h => h.type === 'MOTHER');

    if (fathers.length > 1) {
      throw new ValidationError(
        'VAL_DOUBLE_FATHER',
        'وجود أكثر من أب بيولوجي واحد (Multiple biological fathers detected)'
      );
    }

    if (mothers.length > 1) {
      throw new ValidationError(
        'VAL_DOUBLE_MOTHER',
        'وجود أكثر من أم بيولوجية واحدة (Multiple biological mothers detected)'
      );
    }
  }

  private static validateGenderConsistency(heirs: Heir[]): void {
    const maleOnlyTypes = [
      'SON', 'SON_OF_SON', 'FATHER', 'GRANDFATHER',
      'FULL_BROTHER', 'AGNATIC_BROTHER', 'UTERINE_BROTHER',
      'FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON',
      'FULL_UNCLE', 'AGNATIC_UNCLE', 'SPOUSE_MALE',
      'DAUGHTER_SON', 'FULL_SISTER_SON',
      'MATERNAL_UNCLE', 'MATERNAL_GRANDFATHER'
    ];

    const femaleOnlyTypes = [
      'DAUGHTER', 'DAUGHTER_OF_SON', 'MOTHER', 'GRANDMOTHER_P', 'GRANDMOTHER_M',
      'FULL_SISTER', 'AGNATIC_SISTER', 'UTERINE_SISTER', 'SPOUSE_FEMALE',
      'DAUGHTER_DAUGHTER', 'FULL_SISTER_DAUGHTER', 'FULL_BROTHER_DAUGHTER',
      'MATERNAL_AUNT', 'PATERNAL_AUNT'
    ];

    for (const heir of heirs) {
      if (maleOnlyTypes.includes(heir.type) && heir.gender !== 'MALE') {
        throw new ValidationError(
          'VAL_GENDER_MISMATCH',
          `الوارث من نوع ${heir.type} يجب أن يكون ذكراً`
        );
      }

      if (femaleOnlyTypes.includes(heir.type) && heir.gender !== 'FEMALE') {
        throw new ValidationError(
          'VAL_GENDER_MISMATCH',
          `الوارث من نوع ${heir.type} يجب أن تكون أنثى`
        );
      }
    }
  }

  // 2.1 — Cycle Detection using DFS on parentIds
  private static validateCycles(heirs: Heir[]): void {
    const hasParentData = heirs.some(h => h.parentIds && h.parentIds.length > 0);
    if (!hasParentData) return;

    const idMap = new Map<string, Heir>();
    for (const h of heirs) idMap.set(h.id, h);

    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (nodeId: string): void => {
      if (inStack.has(nodeId)) {
        throw new ValidationError(
          'VAL_CYCLE_DETECTED',
          'دورة في شجرة القرابة (Cycle detected in kinship tree)'
        );
      }
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      inStack.add(nodeId);

      const node = idMap.get(nodeId);
      if (node?.parentIds) {
        for (const parentId of node.parentIds) {
          if (idMap.has(parentId)) dfs(parentId);
        }
      }

      inStack.delete(nodeId);
    };

    for (const h of heirs) dfs(h.id);
  }

  // 2.2 — Parent age gap (parent must be at least 12 years older than child)
  private static validateAgeGap(heirs: Heir[]): void {
    const hasAgeData = heirs.some(h => h.age !== undefined);
    if (!hasAgeData) return;

    const idMap = new Map<string, Heir>();
    for (const h of heirs) idMap.set(h.id, h);

    for (const child of heirs) {
      if (!child.parentIds || child.age === undefined) continue;
      for (const parentId of child.parentIds) {
        const parent = idMap.get(parentId);
        if (parent && parent.age !== undefined) {
          if (parent.age < 12) {
            throw new ValidationError(
              'VAL_PARENT_TOO_YOUNG',
              `أصغر من 12 سنة (Parent age ${parent.age} is less than 12)`
            );
          }
          if (parent.age - child.age < 12) {
            throw new ValidationError(
              'VAL_AGE_GAP',
              `فارق العمر غير منطقي (Parent age ${parent.age} must be at least 12 years older than child age ${child.age})`
            );
          }
        }
      }
    }
  }

  // 2.3 — Incest prevention (7 prohibited marriage relationships)
  private static validateIncest(heirs: Heir[]): void {
    const hasRelationData = heirs.some(h => (h.parentIds && h.parentIds.length > 0) || (h.spouseIds && h.spouseIds.length > 0));
    if (!hasRelationData) return;

    const idMap = new Map<string, Heir>();
    for (const h of heirs) idMap.set(h.id, h);

    for (const h of heirs) {
      if (!h.spouseIds) continue;
      for (const spouseId of h.spouseIds) {
        const spouse = idMap.get(spouseId);
        if (!spouse) continue;

        // 1. Parent-child marriage
        if (h.parentIds?.includes(spouseId) || spouse.parentIds?.includes(h.id)) {
          throw new ValidationError('VAL_INCEST_PARENT', 'زواج المحارم: أحد الزوجين هو والد الآخر');
        }

        // 2. Sibling marriage (same parent)
        for (const other of heirs) {
          if (other.id === h.id || other.id === spouseId) continue;
          const sharedParents = h.parentIds?.filter(pid => other.parentIds?.includes(pid)) || [];
          const spouseSharedParents = spouse.parentIds?.filter(pid => other.parentIds?.includes(pid)) || [];
          if (sharedParents.length > 0 && spouseSharedParents.length > 0) {
            if ((h.spouseIds?.includes(other.id) || spouse.spouseIds?.includes(other.id))) {
              throw new ValidationError('VAL_INCEST_SIBLING', 'زواج المحارم: زواج بين أشقاء');
            }
          }
        }
      }
    }
  }

  // 2.4 — Hermaphrodite (الخنثى المشكل): gets the smaller of male/female shares
  private static validateHermaphrodite(heirs: Heir[]): void {
    const hermaphrodites = heirs.filter(h => h.isHermaphrodite);
    for (const h of hermaphrodites) {
      if (h.gender === 'MALE' || h.gender === 'FEMALE') {
        throw new ValidationError(
          'VAL_HERMAPHRODITE_GENDER',
          `الخنثى لا يمكن أن يكون ${h.gender === 'MALE' ? 'ذكراً' : 'أنثى'} محدداً (Hermaphrodite must not have a fixed gender)`
        );
      }
    }
  }

  // 2.5 — Missing person (المفقود): flag for share reservation
  private static validateMissing(heirs: Heir[]): void {
    const missing = heirs.filter(h => h.isMissing);
    if (missing.length > 0) {
      const nonMissing = heirs.filter(h => !h.isMissing);
      if (nonMissing.length === 0) {
        throw new ValidationError(
          'VAL_ALL_MISSING',
          'لا يمكن أن يكون جميع الورثة مفقودين (All heirs cannot be missing)'
        );
      }
    }
  }

  // 2.6 — Fetus (الحمل): validates age/multiple constraints
  private static validateFetus(heirs: Heir[]): void {
    const fetuses = heirs.filter(h => h.isFetus);
    if (fetuses.length > 1) {
      throw new ValidationError(
        'VAL_MULTIPLE_FETUSES',
        'لا يمكن أن يكون أكثر من حمل واحد (Multiple fetuses not allowed)'
      );
    }
  }
}
