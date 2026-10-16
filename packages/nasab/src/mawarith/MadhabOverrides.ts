import { Madhab } from '../types/FiqhAST';
import { MawarithContext } from './types';
import { PluginManager, PluginType, MadhabPlugin } from '../plugins';
import { Heir } from '../types/Kinship';

export class MadhabOverrides {
  static apply(ctx: MawarithContext, madhab: Madhab = 'COMMON'): void {
    if (madhab === 'COMMON') {
      return;
    }

    const plugins = PluginManager.getByType(PluginType.MADHAB) as MadhabPlugin[];
    const madhabPlugin = plugins.find(p => p.madhab === madhab);

    if (madhabPlugin) {
      try {
        // Build Heir[] from ctx
        const heirs: Heir[] = ctx.heirs.map(h => ({
          id: h.person.id,
          type: h.relation as any,
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

