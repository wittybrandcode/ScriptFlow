import * as fs from 'fs';
import * as path from 'path';
import { RuleParser } from './parser';
import { RuleGroup } from './types';
import { BUNDLED_INHERITANCE_RULES, BUNDLED_BLOCKING_RULES } from './rules_bundled';

export class RulesRegistry {
  private parser = new RuleParser();
  public inheritanceRules: RuleGroup[] = [];
  public blockingRules: RuleGroup[] = [];

  constructor() {
    // Pre-populate with bundled static rules for browser comparability
    this.inheritanceRules = [...(BUNDLED_INHERITANCE_RULES as unknown as RuleGroup[])];
    this.blockingRules = [...(BUNDLED_BLOCKING_RULES as unknown as RuleGroup[])];
  }

  public loadRulesFromDirectory(rulesDir: string) {
    try {
      const inheritanceDir = path.join(rulesDir, 'inheritance');
      if (fs && fs.existsSync && fs.existsSync(inheritanceDir)) {
        const files = fs.readdirSync(inheritanceDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
        this.inheritanceRules = []; // override with fresh files if they exist
        for (const file of files) {
          const content = fs.readFileSync(path.join(inheritanceDir, file), 'utf8');
          this.inheritanceRules.push(this.parser.parseAndValidate(content));
        }
      }

      const blockingDir = path.join(rulesDir, 'blocking');
      if (fs && fs.existsSync && fs.existsSync(blockingDir)) {
        const files = fs.readdirSync(blockingDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
        this.blockingRules = []; // override with fresh files if they exist
        for (const file of files) {
          const content = fs.readFileSync(path.join(blockingDir, file), 'utf8');
          this.blockingRules.push(this.parser.parseAndValidate(content));
        }
      }
    } catch (e) {
      console.warn('Could not load rules from directory, using static fallback:', e);
    }
  }
}
