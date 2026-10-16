import { describe, it, expect } from 'vitest';
import classicCases from './fixtures/classic_cases.json';
// import { BaseEngine } from '../src/engine/BaseEngine'; // Uncomment when engine is ready

describe('NASAB Engine - Classical Cases', () => {
  it('should load classic cases correctly', () => {
    expect(classicCases.length).toBeGreaterThan(0);
    expect(classicCases[0].id).toBe('CASE_AKDARIYA');
  });

  // TODO: Add actual engine tests once BaseEngine is implemented.
  /*
  it('should solve Al-Akdariya correctly', () => {
    const engine = new BaseEngine();
    const result = engine.solve(classicCases[0].heirs);
    expect(result.shares).toEqual(classicCases[0].expected.shares);
  });
  */
});
