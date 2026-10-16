import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RuleParser } from '../src/parser';

describe('Nasab Rule Engine Parser', () => {
  it('should parse mother_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/mother_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);

    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('MOTHER');
    expect(ruleGroup.rules).toHaveLength(3);
    
    expect(ruleGroup.rules[0].rule_id).toBe('MOTHER_GETS_ONE_SIXTH');
    expect(ruleGroup.rules[1].rule_id).toBe('MOTHER_GETS_ONE_THIRD');
    expect(ruleGroup.rules[2].rule_id).toBe('MOTHER_GETS_ONE_THIRD_OF_REMAINDER');
  });

  it('should parse father_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/father_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);

    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('FATHER');
    expect(ruleGroup.rules).toHaveLength(3);
  });

  it('should parse husband_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/husband_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);

    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('SPOUSE_MALE');
    expect(ruleGroup.rules).toHaveLength(2);
  });

  it('should parse wife_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/wife_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);

    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('SPOUSE_FEMALE');
    expect(ruleGroup.rules).toHaveLength(2);
  });

  it('should parse daughter_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/daughter_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);

    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('CHILD');
    expect(ruleGroup.rules).toHaveLength(3);
  });

  it('should parse son_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/son_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);
    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('CHILD');
    expect(ruleGroup.rules).toHaveLength(1);
  });

  it('should parse granddaughter_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/granddaughter_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);
    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('GRANDCHILD_MALE_LINE');
    expect(ruleGroup.rules).toHaveLength(4);
  });

  it('should parse full_sister_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/full_sister_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);
    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('SIBLING_FULL');
    expect(ruleGroup.rules).toHaveLength(4);
  });

  it('should parse maternal_sibling_share.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/maternal_sibling_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);
    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('SIBLING_MATERNAL');
    expect(ruleGroup.rules).toHaveLength(2);
  });

  it('should parse grandfather_blocking.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/blocking/grandfather_blocking.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);
    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('GRANDFATHER_PATERNAL');
  });

  it('should parse full_sibling_blocking.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/blocking/full_sibling_blocking.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);
    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('SIBLING_FULL');
  });

  it('should parse grandchild_blocking.yaml successfully', () => {
    const yamlPath = path.join(__dirname, '../rules/blocking/grandchild_blocking.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);
    expect(ruleGroup).toBeDefined();
    expect(ruleGroup.target_node).toBe('GRANDCHILD_MALE_LINE');
    expect(ruleGroup.rules).toHaveLength(2);
  });

  it('should generate pre-parsed rules_bundled.ts successfully', () => {
    const rulesDir = path.join(__dirname, '../rules');
    const parser = new RuleParser();
    
    const inheritanceDir = path.join(rulesDir, 'inheritance');
    const inheritanceRules: any[] = [];
    if (fs.existsSync(inheritanceDir)) {
      const files = fs.readdirSync(inheritanceDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(inheritanceDir, file), 'utf8');
        inheritanceRules.push(parser.parseAndValidate(content));
      }
    }

    const blockingDir = path.join(rulesDir, 'blocking');
    const blockingRules: any[] = [];
    if (fs.existsSync(blockingDir)) {
      const files = fs.readdirSync(blockingDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(blockingDir, file), 'utf8');
        blockingRules.push(parser.parseAndValidate(content));
      }
    }

    const bundledCode = `// THIS FILE IS AUTO-GENERATED BY parser.test.ts. DO NOT EDIT DIRECTLY.
export const BUNDLED_INHERITANCE_RULES = ${JSON.stringify(inheritanceRules, null, 2)};
export const BUNDLED_BLOCKING_RULES = ${JSON.stringify(blockingRules, null, 2)};
`;

    const destPath = path.join(__dirname, '../src/rules_bundled.ts');
    fs.writeFileSync(destPath, bundledCode, 'utf8');
    expect(fs.existsSync(destPath)).toBe(true);
  });
});