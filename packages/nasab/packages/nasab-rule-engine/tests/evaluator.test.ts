import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RuleParser } from '../src/parser';
import { RuleEvaluator, RuleContext } from '../src/evaluator';

describe('Nasab Rule Engine Evaluator', () => {
  it('should evaluate mother rules correctly (One Sixth)', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/mother_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);

    const evaluator = new RuleEvaluator();

    // Mock Context: يوجد فرع وارث
    const contextWithChild: RuleContext = {
      targetNodeId: 'mother_1',
      exists: (criteria) => {
        // criteria.relation includes "CHILD"
        if (criteria.relation?.includes('CHILD')) return true;
        return false;
      },
      count: () => 0,
      nodeHas: () => false,
    };

    const result = evaluator.evaluateGroup(ruleGroup, contextWithChild);
    
    expect(result).toBeDefined();
    expect(result?.ruleId).toBe('MOTHER_GETS_ONE_SIXTH');
    expect(result?.effect.value).toBe('1/6');
  });

  it('should evaluate mother rules correctly (One Third)', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/mother_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);

    const evaluator = new RuleEvaluator();

    // Mock Context: لا يوجد فرع وارث ولا جمع من الإخوة
    const contextWithoutChild: RuleContext = {
      targetNodeId: 'mother_1',
      exists: (criteria) => false,
      count: (criteria) => 0, // الإخوة = 0
      nodeHas: () => false,
    };

    const result = evaluator.evaluateGroup(ruleGroup, contextWithoutChild);
    
    expect(result).toBeDefined();
    expect(result?.ruleId).toBe('MOTHER_GETS_ONE_THIRD');
    expect(result?.effect.value).toBe('1/3');
  });

  it('should evaluate daughter rules correctly (Asabah / Ta\'seeb)', () => {
    const yamlPath = path.join(__dirname, '../rules/inheritance/daughter_share.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    const parser = new RuleParser();
    const ruleGroup = parser.parseAndValidate(yamlContent);

    const evaluator = new RuleEvaluator();

    // Mock Context: بنت ومعها ابن (MALE CHILD)
    const contextWithSon: RuleContext = {
      targetNodeId: 'daughter_1',
      exists: (criteria) => {
        if (criteria.relation?.includes('CHILD') && criteria.gender === 'MALE') return true;
        return false;
      },
      count: () => 0,
      nodeHas: (id, criteria) => {
        if (criteria.gender === 'FEMALE') return true; // العقدة الحالية أنثى
        return false;
      },
    };

    const result = evaluator.evaluateGroup(ruleGroup, contextWithSon);
    
    expect(result).toBeDefined();
    expect(result?.ruleId).toBe('DAUGHTER_IS_ASABAH');
    expect(result?.effect.type).toBe('ASSIGN_RESIDUARY_WITH_ANOTHER');
  });
});
