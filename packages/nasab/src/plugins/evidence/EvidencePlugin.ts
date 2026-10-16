import { NasabPlugin, PluginType, PluginMetadata } from '../core/NasabPlugin';
import { RulesRegistry } from '../../../packages/nasab-rule-engine/src/registry';
import { InferenceEngine as EnterpriseInferenceEngine } from '../../../packages/nasab-inference/src/engine';
import { EvidenceKnowledgeBase } from './EvidenceKnowledgeBase';

export class EvidencePlugin implements NasabPlugin {
  readonly type = PluginType.HOOK;
  readonly metadata: PluginMetadata = {
    id: 'nasab.evidence.core',
    name: 'Jurisprudence & Evidence Enrichment',
    version: '1.0.0',
    description: 'Enriches inheritance results with Quranic, Hadith, and scholarly evidences.'
  };

  public onAfterInheritanceCalculation(ctx: any): void {
    try {
      const registry = new RulesRegistry(); // Fast pre-parsed static rules (browser proof)
      const infEngine = new EnterpriseInferenceEngine([], registry.inheritanceRules, registry.blockingRules);
      const yamlResults = infEngine.executeWithContext(ctx);
      
      for (const heir of ctx.heirs) {
        const yamlMatch = yamlResults.find((y: any) => y.nodeId === heir.person.id);
        if (yamlMatch) {
          if (yamlMatch.evidence && yamlMatch.evidence.length > 0) {
            heir.evidence = yamlMatch.evidence.map((ev: any) => {
              let parsedEv = { ...ev };
              
              // Try to find an enriched version in the knowledge base by source or id
              const kbMatch = Object.values(EvidenceKnowledgeBase).find(kb => kb.id === ev.id || kb.source === ev.source || kb.id === ev.source);
              if (kbMatch) {
                parsedEv = { ...parsedEv, ...kbMatch }; // Merge KB details
              }
              
              // Parse generic QURAN_X_Y strings if not already populated
              if (!parsedEv.suraName && parsedEv.source && parsedEv.source.startsWith('QURAN_')) {
                const parts = parsedEv.source.split('_');
                if (parts.length >= 3) {
                  parsedEv.type = 'QURAN';
                  const suraNum = parseInt(parts[1], 10);
                  const ayahNum = parseInt(parts[2], 10);
                  if (suraNum === 4) {
                    parsedEv.suraName = "سورة النساء";
                  }
                  if (!isNaN(ayahNum)) {
                    parsedEv.ayahNumber = ayahNum;
                  }
                }
              }
              
              return parsedEv;
            });
          } else if (yamlMatch.isBlocked && yamlMatch.notes) {
            if (heir.isBlocked && !heir.notes?.includes(yamlMatch.notes)) {
              heir.notes = `${heir.notes || ''} (${yamlMatch.notes})`;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Nasab] Evidence Plugin enrichment skipped: ', e);
    }
  }
}
