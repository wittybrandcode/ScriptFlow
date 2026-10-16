import { describe, expect, it } from 'vitest';
import { NasabAPI } from '../src/index';
import { Gender } from '../../../src/index';

describe('Nasab Fluent Builder API', () => {
  it('should evaluate estate cleanly', () => {
    const report = NasabAPI.buildEstate()
      .deceased('Ahmed', Gender.MALE)
      .addNode('MOTHER', { isAlive: true, gender: Gender.FEMALE })
      .addNode('CHILD', { count: 1, gender: Gender.MALE })
      .evaluate()
      .explainStr();

    expect(report).toContain('نتائج الميراث');
    expect(report).toContain('MOTHER_1');
    expect(report).toContain('CHILD_2');

  });
});
