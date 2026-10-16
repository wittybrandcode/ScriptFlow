import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import { CharacterRepository } from '../CharacterRepository';
import type { ICharacter } from '@scriptflow/core';
import { dbExecute } from '../client';

describe('CharacterRepository', () => {
  let repo: CharacterRepository;

  beforeAll(async () => {
    await setupTestDatabase();
    repo = new CharacterRepository();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    await dbExecute('DELETE FROM characters');
    await dbExecute('DELETE FROM scenarios');
    // Insert a parent scenario required for foreign key constraints
    await dbExecute(`INSERT INTO scenarios (id, title) VALUES ('scen-char-test', 'Test Scenario')`);
  });

  it('should create a character', async () => {
    const newChar: ICharacter = {
      id: 'char-1',
      scenario_id: 'scen-char-test',
      name: 'John Doe',
      role: 'Protagonist'
    };

    await repo.insert(newChar);

    const retrieved = await repo.findById('char-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('John Doe');
  });

  it('should get characters by scenario id', async () => {
    await repo.insert({ id: 'char-2', scenario_id: 'scen-char-test', name: 'Alice' });
    await repo.insert({ id: 'char-3', scenario_id: 'scen-char-test', name: 'Bob' });

    const chars = await repo.getByScenarioId('scen-char-test');
    expect(chars.length).toBe(2);
    expect(chars.some(c => c.name === 'Alice')).toBe(true);
    expect(chars.some(c => c.name === 'Bob')).toBe(true);
  });
});
