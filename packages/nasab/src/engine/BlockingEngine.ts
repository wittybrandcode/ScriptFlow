import { Heir } from '../types/Kinship';

export class BlockingEngine {
  /**
   * Applies the blocking matrix (Hajb) rules to the heirs list.
   * Modifies the `isBlocked` and `blockedBy` properties of the heirs.
   */
  public static applyBlocking(heirs: Heir[]): Heir[] {
    const getByType = (type: string) => heirs.filter(h => h.type === type);

    const blockTarget = (targetType: string, blockerId: string) => {
      const targets = getByType(targetType);
      for (const target of targets) {
        target.isBlocked = true;
        if (!target.blockedBy) target.blockedBy = [];
        target.blockedBy.push(blockerId);
      }
    };

    // Rule 1: Son blocks Grandson, All Brothers/Sisters, All Nephews, All Uncles
    const sons = getByType('SON');
    if (sons.length > 0) {
      const blockerId = sons[0].id;
      ['SON_OF_SON', 'DAUGHTER_OF_SON', 'FULL_BROTHER', 'FULL_SISTER', 'AGNATIC_BROTHER', 'AGNATIC_SISTER', 'UTERINE_BROTHER', 'UTERINE_SISTER', 'FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 2: Son of Son blocks lower grandsons, blocks All Brothers, All Nephews, All Uncles
    const grandsons = getByType('SON_OF_SON');
    if (grandsons.length > 0 && sons.length === 0) {
      const blockerId = grandsons[0].id;
      ['FULL_BROTHER', 'FULL_SISTER', 'AGNATIC_BROTHER', 'AGNATIC_SISTER', 'UTERINE_BROTHER', 'UTERINE_SISTER', 'FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 3: Father blocks Grandfather, All Brothers/Sisters, All Nephews, All Uncles
    const fathers = getByType('FATHER');
    if (fathers.length > 0) {
      const blockerId = fathers[0].id;
      ['GRANDFATHER', 'FULL_BROTHER', 'FULL_SISTER', 'AGNATIC_BROTHER', 'AGNATIC_SISTER', 'UTERINE_BROTHER', 'UTERINE_SISTER', 'FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 4: Mother blocks All Grandmothers
    const mothers = getByType('MOTHER');
    if (mothers.length > 0) {
      const blockerId = mothers[0].id;
      ['GRANDMOTHER_P', 'GRANDMOTHER_M'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 5: 2+ Daughters block Daughter of Son (unless there is a Son of Son to make them Asaba)
    const daughters = getByType('DAUGHTER');
    if (daughters.length >= 2 && grandsons.length === 0) {
      const blockerId = daughters[0].id;
      blockTarget('DAUGHTER_OF_SON', blockerId);
    }

    // Rule 6: Full Brother blocks Agnatic Brother, Nephews, and Uncles
    const fullBrothers = getByType('FULL_BROTHER');
    if (fullBrothers.length > 0 && sons.length === 0 && fathers.length === 0 && grandsons.length === 0) {
      const blockerId = fullBrothers[0].id;
      ['AGNATIC_BROTHER', 'AGNATIC_SISTER', 'FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 7: Full Sister (if Asaba with daughters) blocks Agnatic Brother/Sister, Nephews, and Uncles
    const fullSisters = getByType('FULL_SISTER');
    if (fullSisters.length > 0 && daughters.length > 0) {
      const blockerId = fullSisters[0].id;
      ['AGNATIC_BROTHER', 'AGNATIC_SISTER', 'FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 7B: Agnatic Brother blocks Nephews and Uncles
    const agnaticBrothers = getByType('AGNATIC_BROTHER');
    if (agnaticBrothers.length > 0) {
      const blockerId = agnaticBrothers[0].id;
      ['FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 7C: Agnatic Sister (if Asaba with daughters) blocks Nephews and Uncles
    const agnaticSisters = getByType('AGNATIC_SISTER');
    if (agnaticSisters.length > 0 && daughters.length > 0) {
       const blockerId = agnaticSisters[0].id;
       ['FULL_BROTHER_SON', 'AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 7D: Full Brother's Son blocks Agnatic Brother's Son and Uncles
    const fullBrotherSons = getByType('FULL_BROTHER_SON');
    if (fullBrotherSons.length > 0) {
        const blockerId = fullBrotherSons[0].id;
        ['AGNATIC_BROTHER_SON', 'FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 7E: Agnatic Brother's Son blocks Uncles
    const agnaticBrotherSons = getByType('AGNATIC_BROTHER_SON');
    if (agnaticBrotherSons.length > 0) {
        const blockerId = agnaticBrotherSons[0].id;
        ['FULL_UNCLE', 'AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 7F: Full Uncle blocks Agnatic Uncle
    const fullUncles = getByType('FULL_UNCLE');
    if (fullUncles.length > 0) {
        const blockerId = fullUncles[0].id;
        ['AGNATIC_UNCLE'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 8: Any descendant blocks Uterine siblings (brothers and sisters)
    const descendants = [...sons, ...grandsons, ...daughters, ...getByType('DAUGHTER_OF_SON')];
    if (descendants.length > 0) {
      const blockerId = descendants[0].id;
      ['UTERINE_BROTHER', 'UTERINE_SISTER'].forEach(t => blockTarget(t, blockerId));
    }

    // Rule 9: Grandfather blocks Uterine siblings (when Father is absent)
    const grandfathers = getByType('GRANDFATHER');
    if (grandfathers.length > 0 && fathers.length === 0) {
      const blockerId = grandfathers[0].id;
      ['UTERINE_BROTHER', 'UTERINE_SISTER'].forEach(t => blockTarget(t, blockerId));
    }

    return heirs;
  }
}
