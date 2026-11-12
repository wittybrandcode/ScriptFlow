import { Madhab } from '../types/FiqhAST';
import { MawarithContext } from './types';
import { PluginManager, PluginType, MadhabPlugin } from '../plugins';
import { Heir, HeirType } from '../types/Kinship';

function mapRelationToHeirType(relation: string, gender: string): HeirType {
  const isMale = gender === 'MALE';
  if (relation === 'زوج') return 'SPOUSE_MALE';
  if (relation === 'زوجة') return 'SPOUSE_FEMALE';
  if (relation === 'أب') return 'FATHER';
  if (relation === 'أم') return 'MOTHER';
  if (relation === 'ابن') return 'SON';
  if (relation === 'ابنة') return 'DAUGHTER';
  if (relation === 'أبناء وبنات') return isMale ? 'SON' : 'DAUGHTER';
  if (relation === 'جد' || relation === 'جد صحيح') return 'GRANDFATHER';
  if (relation === 'جدة') return 'GRANDMOTHER_M';
  if (relation === 'أخ شقيق') return 'FULL_BROTHER';
  if (relation === 'أخت شقيقة') return 'FULL_SISTER';
  if (relation === 'إخوة أشقاء') return isMale ? 'FULL_BROTHER' : 'FULL_SISTER';
  if (relation === 'أخ لأب') return 'AGNATIC_BROTHER';
  if (relation === 'أخت لأب') return 'AGNATIC_SISTER';
  if (relation === 'إخوة لأب') return isMale ? 'AGNATIC_BROTHER' : 'AGNATIC_SISTER';
  if (relation === 'أخ لأم') return 'UTERINE_BROTHER';
  if (relation === 'أخت لأم') return 'UTERINE_SISTER';
  if (relation === 'إخوة لأم') return isMale ? 'UTERINE_BROTHER' : 'UTERINE_SISTER';
  if (relation.includes('حفيد') || relation.includes('ابن ابن')) return 'SON_OF_SON';
  if (relation.includes('حفيدة') || relation.includes('بنت ابن')) return 'DAUGHTER_OF_SON';
  if (relation.includes('ابن أخ') || relation.includes('أبناء الإخوة')) return 'FULL_BROTHER_SON';
  if (relation.includes('عم') && !relation.includes('عمة')) return 'FULL_UNCLE';
  if (relation === 'خال') return 'MATERNAL_UNCLE';
  if (relation === 'خالة' || relation === 'عمة') return 'PATERNAL_AUNT';
  return relation as any;
}

export class MadhabOverrides {
  static apply(ctx: MawarithContext, madhab: Madhab = 'COMMON'): void {
    if (madhab === 'COMMON') {
      return;
    }

    const plugins = PluginManager.getByType(PluginType.MADHAB) as MadhabPlugin[];
    const madhabPlugin = plugins.find(p => p.madhab === madhab);

    if (madhabPlugin) {
      try {
        // Build Heir[] from ctx using standard HeirType ontology
        const heirs: Heir[] = ctx.heirs.map(h => ({
          id: h.person.id,
          type: mapRelationToHeirType(h.relation, h.person.gender),
          gender: h.person.gender as any,
          isBlocked: ctx.blockedIds.has(h.person.id)
        }));

        // Build CalculationResult
        const shares: Record<string, { fraction: string; type: string }> = {};
        ctx.fardShares.forEach((val, key) => {
          shares[key] = { fraction: val, type: 'fard' };
        });

        const initialResult = {
          baseOrigin: 0,
          shares,
          awlApplied: false,
          raddApplied: false,
          notes: {},
          steps: []
        };

        const overrideResult = madhabPlugin.applyOverrides(heirs, initialResult);

        // Update blockedIds on ctx
        heirs.forEach(h => {
          if (h.isBlocked) {
            ctx.blockedIds.add(h.id);
            const heirShare = ctx.heirs.find(hs => hs.person.id === h.id);
            if (heirShare) heirShare.isBlocked = true;
          } else {
            ctx.blockedIds.delete(h.id);
            const heirShare = ctx.heirs.find(hs => hs.person.id === h.id);
            if (heirShare) heirShare.isBlocked = false;
          }
        });

        // Update fardShares on ctx
        ctx.fardShares.clear();
        for (const [id, shareObj] of Object.entries(overrideResult.shares)) {
          const fractionStr = shareObj.fraction;
          ctx.fardShares.set(id, fractionStr);
          const heirShare = ctx.heirs.find(hs => hs.person.id === id);
          if (heirShare) {
            heirShare.share = fractionStr;
            heirShare.exactShare = fractionStr;
          }
        }
      } catch (err: any) {
        console.error("[Nasab] Error applying madhab overrides:", err.message);
      }
    } else {
      // Fallback behavior or warning if plugin not loaded?
      console.warn(`[Nasab] No plugin found for Madhab: ${madhab}. Using default/COMMON rules.`);
    }
  }
}

