import { Person, Relation, ValidationMode, ValidationResult, ValidationOptions } from '../core/types';
import { RelationType, Gender } from '../core/enums';
import { NasabError, ErrorCode } from '../core/errors';
import { normalizeType } from '../core/normalizer';
import { FosterEngine } from './FosterEngine';

/**
 * محرك التحقق من صحة العلاقات قبل إضافتها.
 * يفحص: الجنس، الزمن، التعدد، الدورات، المحارم، والأبوين المكررين.
 * يدعم 3 أوضاع: ISLAMIC_LAW، CIVIL_LAW_WESTERN، DRAMATIC (للسيناريوهات).
 */
export class KinshipValidator {
  /**
   * يتحقق من صحة علاقة مقترحة قبل إضافتها للشجرة.
   *
   * @param sourceId - معرّف الشخص المصدر
   * @param targetId - معرّف الشخص الهدف
   * @param rawType - نوع العلاقة (نص عربي أو RelationType)
   * @param nodes - قائمة الأشخاص
   * @param existingEdges - العلاقات الموجودة حالياً
   * @param mode - وضع التحقق (افتراضي: ISLAMIC_LAW)
   * @param options - خيارات إضافية (maxWives, allowPolygamy, ...)
   * @returns `{ status: 'SUCCESS' }` أو `{ status: 'ERROR', error: NasabError }`
   */
  static validate(
    sourceId: string,
    targetId: string,
    rawType: string | RelationType,
    nodes: Person[],
    existingEdges: Relation[],
    mode: ValidationMode = 'ISLAMIC_LAW',
    options: ValidationOptions = {},
    fosterRelations: import('./FosterEngine').FosterRelation[] = []
  ): ValidationResult {
    const type = normalizeType(rawType);

    const handleError = (error: NasabError): ValidationResult => {
      if (mode === 'DRAMATIC') {
        if (error.code === ErrorCode.INCEST_VIOLATION || error.code === ErrorCode.TIME_PARADOX) {
           return { status: 'WARNING', error };
        }
      }
      return { status: 'ERROR', error };
    };

    if (sourceId === targetId) {
      return handleError(new NasabError(ErrorCode.SELF_RELATION, 'لا يمكن ربط الشخص بنفسه.', [sourceId]));
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const sourceNode = nodeMap.get(sourceId);
    const targetNode = nodeMap.get(targetId);

    if (!sourceNode || !targetNode) {
      return handleError(new NasabError(ErrorCode.INVALID_NODE, 'لم يتم العثور على الشخصية.', [sourceId, targetId]));
    }

    const sourceName = sourceNode.name;
    const targetName = targetNode.name;
    const sourceGender = sourceNode.gender || Gender.MALE;
    const targetGender = targetNode.gender || Gender.FEMALE;

    // Skip validation for Co-Parents (they are inferred or explicitly set, no marriage rules apply)
    const coParentTypes = [RelationType.CO_PARENT_MALE, RelationType.CO_PARENT_FEMALE, 'CO_PARENTS'];
    if (coParentTypes.includes(type as string | RelationType)) {
      return { status: 'SUCCESS' };
    }

    const marriageTypes = [
      RelationType.SPOUSE_MALE, RelationType.SPOUSE_FEMALE, 
      RelationType.EX_SPOUSE_MALE, RelationType.EX_SPOUSE_FEMALE, 
      RelationType.DIVORCED_REVOCABLE_MALE, RelationType.DIVORCED_REVOCABLE_FEMALE,
      RelationType.DIVORCED_IRREVOCABLE_MALE, RelationType.DIVORCED_IRREVOCABLE_FEMALE,
      RelationType.SPOUSES, RelationType.EX_SPOUSES
    ];
    const currentMarriageTypes = [RelationType.SPOUSE_MALE, RelationType.SPOUSE_FEMALE, RelationType.SPOUSES, RelationType.DIVORCED_REVOCABLE_MALE, RelationType.DIVORCED_REVOCABLE_FEMALE];
    const isMarriage = marriageTypes.includes(type);
    const isCurrentMarriage = currentMarriageTypes.includes(type);

    const parseYear = (dateStr?: string | number) => {
      if (!dateStr) return null;
      const parsed = parseInt(String(dateStr), 10);
      return isNaN(parsed) ? (new Date(String(dateStr)).getFullYear() || null) : parsed;
    };

    const sourceBirth = parseYear(sourceNode.birthDate);
    const sourceDeath = parseYear(sourceNode.deathDate);
    const targetBirth = parseYear(targetNode.birthDate);
    const targetDeath = parseYear(targetNode.deathDate);

    // 1. Gender-Role Alignment
    const MALE_ROLES = [RelationType.PARENT_MALE, RelationType.GRANDPARENT_MALE, RelationType.UNCLE_PATERNAL_MALE, RelationType.UNCLE_MATERNAL_MALE, RelationType.SIBLING_MALE, RelationType.SIBLING_PATERNAL_MALE, RelationType.SIBLING_MATERNAL_MALE, RelationType.CHILD_MALE];
    const FEMALE_ROLES = [RelationType.PARENT_FEMALE, RelationType.GRANDPARENT_FEMALE, RelationType.UNCLE_PATERNAL_FEMALE, RelationType.UNCLE_MATERNAL_FEMALE, RelationType.SIBLING_FEMALE, RelationType.SIBLING_PATERNAL_FEMALE, RelationType.SIBLING_MATERNAL_FEMALE, RelationType.CHILD_FEMALE];

    if (MALE_ROLES.includes(type) && sourceGender === Gender.FEMALE) {
      return handleError(new NasabError(ErrorCode.GENDER_ROLE_MISMATCH, `لا يمكن تعيين (${sourceName}) بدور ذكر لأنها أنثى.`, [sourceId]));
    }
    if (FEMALE_ROLES.includes(type) && sourceGender === Gender.MALE) {
      return handleError(new NasabError(ErrorCode.GENDER_ROLE_MISMATCH, `لا يمكن تعيين (${sourceName}) بدور أنثى لأنه ذكر.`, [sourceId]));
    }

    // 2. Temporal Constraints
    const minAgeGap = options?.minParentAgeGap !== undefined ? options.minParentAgeGap : 12;
    const maxPregnancyYears = options?.maxPregnancyYears !== undefined ? options.maxPregnancyYears : 1; 

    if (sourceBirth && targetBirth) {
      if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE) {
        if (sourceBirth > targetBirth) {
          return handleError(new NasabError(ErrorCode.TIME_PARADOX, `تناقض زمني: الوالد (${sourceName}) لا يمكن أن يكون مولوداً بعد ابنه (${targetName}).`, [sourceId, targetId]));
        } else if (targetBirth - sourceBirth < minAgeGap) {
          return handleError(new NasabError(ErrorCode.TIME_PARADOX, `فرق العمر غير منطقي: الوالد (${sourceName}) لا يمكن أن ينجب (${targetName}) وهو أصغر من ${minAgeGap} سنة.`, [sourceId, targetId]));
        }
      }
      if (type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE) {
        if (sourceBirth < targetBirth) {
          return handleError(new NasabError(ErrorCode.TIME_PARADOX, `تناقض زمني: الابن (${sourceName}) لا يمكن أن يكون مولوداً قبل والده (${targetName}).`, [sourceId, targetId]));
        } else if (sourceBirth - targetBirth < minAgeGap) {
          return handleError(new NasabError(ErrorCode.TIME_PARADOX, `فرق العمر غير منطقي: الابن (${sourceName}) لا يمكن أن يولد ووالده (${targetName}) أصغر من ${minAgeGap} سنة.`, [sourceId, targetId]));
        }
      }
    }
    
    // حد الحمل بعد الوفاة (أو الطلاق لو توفرت تواريخ أدق، نكتفي بالوفاة هنا)
    if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE) {
      const parentDeath = sourceDeath;
      const childBirth = targetBirth;
      if (parentDeath && childBirth) {
        if (childBirth - parentDeath > maxPregnancyYears) {
          return handleError(new NasabError(ErrorCode.TIME_PARADOX, `مدة حمل مستحيلة: لا يمكن أن يولد الابن (${targetName}) بعد وفاة والده/والدته (${sourceName}) بأكثر من ${maxPregnancyYears} سنة.`, [sourceId, targetId]));
        }
      }
    }
    if (type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE) {
      const parentDeath = targetDeath;
      const childBirth = sourceBirth;
      if (parentDeath && childBirth) {
        if (childBirth - parentDeath > maxPregnancyYears) {
          return handleError(new NasabError(ErrorCode.TIME_PARADOX, `مدة حمل مستحيلة: لا يمكن أن يولد الابن (${sourceName}) بعد وفاة والده/والدته (${targetName}) بأكثر من ${maxPregnancyYears} سنة.`, [sourceId, targetId]));
        }
      }
    }

    if (isMarriage) {
      if ((sourceDeath && targetBirth && sourceDeath < targetBirth) || (targetDeath && sourceBirth && targetDeath < sourceBirth)) {
        return handleError(new NasabError(ErrorCode.TIME_PARADOX, `تناقض زمني: لا يمكن الزواج بين (${sourceName}) و (${targetName}) لأنهما لم يتعاصرا (أحدهما توفي قبل ولادة الآخر).`, [sourceId, targetId]));
      }
    }

    // 3. Gender Alignment and Polygamy for Marriage
    if (isMarriage) {
      if (sourceGender === targetGender && options?.allowSameSexMarriage !== true) {
        return handleError(new NasabError(ErrorCode.GENDER_MISMATCH, `لا يمكن ربط (${sourceName}) و (${targetName}) بعلاقة زواج أو طلاق لأنهما من نفس الجنس.`, [sourceId, targetId]));
      }

      if (isCurrentMarriage) {
        const husbandId = sourceGender === Gender.MALE ? sourceId : targetId;
        const husbandName = sourceGender === Gender.MALE ? sourceName : targetName;
        const wifeId = sourceGender === Gender.FEMALE ? sourceId : targetId;
        const wifeName = sourceGender === Gender.FEMALE ? sourceName : targetName;

        const husbandWives = existingEdges.filter(e => {
            const eType = normalizeType(e.type);
            const isSpouse = currentMarriageTypes.includes(eType);
            return isSpouse && (e.sourceId === husbandId || e.targetId === husbandId);
        });

        const wifeHusbands = existingEdges.filter(e => {
            const eType = normalizeType(e.type);
            const isSpouse = currentMarriageTypes.includes(eType);
            return isSpouse && (e.sourceId === wifeId || e.targetId === wifeId);
        });

        if (options?.allowPolygamy !== true && wifeHusbands.length >= 1) {
            return handleError(new NasabError(ErrorCode.POLYGAMY_VIOLATION, `لا يمكن لـ (${wifeName}) أن تتزوج بأكثر من رجل في نفس الوقت.`, [wifeId]));
        }

        let maxWives = options?.maxWives !== undefined ? options.maxWives : undefined;
        if (maxWives === undefined) {
           maxWives = mode === 'ISLAMIC_LAW' ? 4 : (mode === 'CIVIL_LAW_WESTERN' ? 1 : Infinity);
        }

        if (options?.allowPolygamy !== true && husbandWives.length >= maxWives) {
            return handleError(new NasabError(ErrorCode.POLYGAMY_VIOLATION, `تجاوز الحد المسموح به من الزوجات لـ (${husbandName}) وهو ${maxWives}.`, [husbandId]));
        }
      }
    }

    // 4. Biological Uniqueness (One Father, One Mother)
    if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE) {
      const childId = targetId;
      
      const existingSameParents = existingEdges.filter(e => {
        const eType = normalizeType(e.type);
        return e.targetId === childId && eType === type && e.sourceId !== sourceId;
      });

      if (existingSameParents.length >= 1) {
        const parentTypeStr = type === RelationType.PARENT_MALE ? 'أب بيولوجي واحد' : 'أم بيولوجية واحدة';
        return handleError(new NasabError(ErrorCode.DUPLICATE_BIOLOGICAL_PARENT, `لا يمكن لـ (${targetName}) أن يكون له أكثر من ${parentTypeStr}.`, [childId]));
      }
    }

    // 5. Direct Cycle Check (A is parent of B, B cannot be parent of A)
    if (type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE || type === RelationType.CHILD_MALE || type === RelationType.CHILD_FEMALE) {
      const checkCycle = (currentId: string, targetToFind: string, isLookingForDescendant: boolean, visited: Set<string> = new Set()): boolean => {
        if (visited.has(currentId)) return false; // Prevent Stack Overflow on pre-existing cycles
        visited.add(currentId);

        const childrenEdges = existingEdges.filter(e => {
          const eType = normalizeType(e.type);
          const isParentType = eType === RelationType.PARENT_MALE || eType === RelationType.PARENT_FEMALE;
          return (isLookingForDescendant && e.sourceId === currentId && isParentType) ||
                 (!isLookingForDescendant && e.targetId === currentId && isParentType);
        });
        
        for (const edge of childrenEdges) {
          const nextId = isLookingForDescendant ? edge.targetId : edge.sourceId;
          if (nextId === targetToFind) return true;
          if (checkCycle(nextId, targetToFind, isLookingForDescendant, visited)) return true;
        }
        return false;
      };

      const isParentType = type === RelationType.PARENT_MALE || type === RelationType.PARENT_FEMALE;
      const parentId = isParentType ? sourceId : targetId;
      const childId = isParentType ? targetId : sourceId;

      if (checkCycle(childId, parentId, true)) {
        return handleError(new NasabError(ErrorCode.CYCLE_DETECTED, `دورة لا نهائية: لا يمكن لـ (${sourceNode.name}) أن يكون من أصول وفروع (${targetNode.name}) في نفس الوقت.`, [sourceId, targetId]));
      }
    }

    // 6. Incest Safeguards (No marriage between close relatives)
    if (isMarriage) {
      const parentChildTypes = [RelationType.PARENT_MALE, RelationType.PARENT_FEMALE, RelationType.CHILD_MALE, RelationType.CHILD_FEMALE];
      const isParentChild = existingEdges.some(e => {
        const eType = normalizeType(e.type);
        return ((e.sourceId === sourceId && e.targetId === targetId) || (e.sourceId === targetId && e.targetId === sourceId)) &&
               parentChildTypes.includes(eType);
      });
      if (isParentChild) {
        return handleError(new NasabError(ErrorCode.INCEST_VIOLATION, `لا يمكن الزواج بين الأصول والفروع (${sourceName} و ${targetName}).`, [sourceId, targetId]));
      }

      const siblingTypes = [RelationType.SIBLING_MALE, RelationType.SIBLING_FEMALE, RelationType.SIBLING_PATERNAL_MALE, RelationType.SIBLING_PATERNAL_FEMALE, RelationType.SIBLING_MATERNAL_MALE, RelationType.SIBLING_MATERNAL_FEMALE, RelationType.HALF_SIBLING_MALE, RelationType.HALF_SIBLING_FEMALE, RelationType.SIBLINGS];
      const isSibling = existingEdges.some(e => {
        const eType = normalizeType(e.type);
        return ((e.sourceId === sourceId && e.targetId === targetId) || (e.sourceId === targetId && e.targetId === sourceId)) &&
               siblingTypes.includes(eType);
      });
      if (isSibling) {
        return handleError(new NasabError(ErrorCode.INCEST_VIOLATION, `لا يمكن الزواج بين الإخوة والأخوات (${sourceName} و ${targetName}).`, [sourceId, targetId]));
      }

      const auntUncleTypes = [RelationType.UNCLE_PATERNAL_MALE, RelationType.UNCLE_PATERNAL_FEMALE, RelationType.UNCLE_MATERNAL_MALE, RelationType.UNCLE_MATERNAL_FEMALE, RelationType.NEPHEW_PATERNAL_MALE, RelationType.NEPHEW_PATERNAL_FEMALE, RelationType.NEPHEW_MATERNAL_MALE, RelationType.NEPHEW_MATERNAL_FEMALE];
      const isAuntOrUncle = existingEdges.some(e => {
        const eType = normalizeType(e.type);
        return ((e.sourceId === sourceId && e.targetId === targetId) || (e.sourceId === targetId && e.targetId === sourceId)) &&
               auntUncleTypes.includes(eType);
      });
      if (isAuntOrUncle) {
        return handleError(new NasabError(ErrorCode.INCEST_VIOLATION, `لا يمكن الزواج بين الأعمام/العمات أو الأخوال/الخالات وأبناء الإخوة/الأخوات (${sourceName} و ${targetName}).`, [sourceId, targetId]));
      }

      const fosterProhibited = FosterEngine.getProhibitedMarriages(sourceId, targetId, fosterRelations, existingEdges);
      if (fosterProhibited) {
        return handleError(new NasabError(ErrorCode.FOSTER_MARRIAGE_VIOLATION, `محرم من الرضاع: لا يمكن الزواج بين (${sourceName} و ${targetName}) لأنهما مرتبطان بالرضاع.`, [sourceId, targetId]));
      }

      const maleId = sourceGender === Gender.MALE ? sourceId : targetId;
      const femaleId = sourceGender === Gender.FEMALE ? sourceId : targetId;

      if (maleId && femaleId && mode !== 'MEDICAL_GENETICS') {
        const parentTypes = [RelationType.PARENT_MALE, RelationType.PARENT_FEMALE, RelationType.GRANDPARENT_MALE, RelationType.GRANDPARENT_FEMALE];

        const maleAllWivesIds = existingEdges
          .filter(e => marriageTypes.includes(normalizeType(e.type)) && (e.sourceId === maleId || e.targetId === maleId))
          .map(e => e.sourceId === maleId ? e.targetId : e.sourceId);

        for (const wifeId of maleAllWivesIds) {
          const isDaughterOfWife = existingEdges.some(e => 
            parentTypes.includes(normalizeType(e.type)) && e.sourceId === wifeId && e.targetId === femaleId
          );
          if (isDaughterOfWife) {
            return handleError(new NasabError(ErrorCode.INCEST_VIOLATION, `لا يمكن لـ (${nodes.find(n => n.id === maleId)?.name}) الزواج من (${nodes.find(n => n.id === femaleId)?.name}) لأنها من فروع زوجته/طليقته (ربيبة أو ابنتها).`, [maleId, femaleId]));
          }

          const isMotherOfWife = existingEdges.some(e => {
            const eType = normalizeType(e.type);
            return (eType === RelationType.PARENT_FEMALE || eType === RelationType.GRANDPARENT_FEMALE) && e.sourceId === femaleId && e.targetId === wifeId;
          });
          if (isMotherOfWife) {
            return handleError(new NasabError(ErrorCode.INCEST_VIOLATION, `لا يمكن لـ (${nodes.find(n => n.id === maleId)?.name}) الزواج من (${nodes.find(n => n.id === femaleId)?.name}) لأنها من أصول زوجته/طليقته (حماة أو جدتها).`, [maleId, femaleId]));
          }
        }
        
        if (isCurrentMarriage) {
          const maleCurrentWivesIds = existingEdges
            .filter(e => currentMarriageTypes.includes(normalizeType(e.type)) && (e.sourceId === maleId || e.targetId === maleId))
            .map(e => e.sourceId === maleId ? e.targetId : e.sourceId);

          for (const wifeId of maleCurrentWivesIds) {
            const areSisters = existingEdges.some(e => {
              const eType = normalizeType(e.type);
              return ((e.sourceId === femaleId && e.targetId === wifeId) || (e.sourceId === wifeId && e.targetId === femaleId)) &&
                     [RelationType.SIBLING_FEMALE, RelationType.SIBLING_PATERNAL_FEMALE, RelationType.SIBLING_MATERNAL_FEMALE, RelationType.SIBLINGS].includes(eType);
            });
            if (areSisters) {
              return handleError(new NasabError(ErrorCode.INCEST_VIOLATION, `لا يجوز الجمع بين الأختين (${nodes.find(n => n.id === femaleId)?.name} و ${nodes.find(n => n.id === wifeId)?.name}).`, [maleId, femaleId, wifeId]));
            }
          }
        }

        const femaleAllHusbandsIds = existingEdges
          .filter(e => marriageTypes.includes(normalizeType(e.type)) && (e.sourceId === femaleId || e.targetId === femaleId))
          .map(e => e.sourceId === femaleId ? e.targetId : e.sourceId);

        for (const husbId of femaleAllHusbandsIds) {
          const isSonOfHusb = existingEdges.some(e => 
            parentTypes.includes(normalizeType(e.type)) && e.sourceId === husbId && e.targetId === maleId
          );
          if (isSonOfHusb) {
             return handleError(new NasabError(ErrorCode.INCEST_VIOLATION, `لا يمكن الزواج لأنه من فروع زوجها/طليقها (ربيب أو حفيده).`, [femaleId, maleId]));
          }

          const isFatherOfHusb = existingEdges.some(e => 
            [RelationType.PARENT_MALE, RelationType.GRANDPARENT_MALE].includes(normalizeType(e.type)) && e.sourceId === maleId && e.targetId === husbId
          );
          if (isFatherOfHusb) {
            return handleError(new NasabError(ErrorCode.INCEST_VIOLATION, `لا يمكن الزواج لأنه من أصول زوجها/طليقها (أبو الزوج أو جده).`, [femaleId, maleId]));
          }
        }
      }
    }

    return { status: 'SUCCESS' };
  }
}
