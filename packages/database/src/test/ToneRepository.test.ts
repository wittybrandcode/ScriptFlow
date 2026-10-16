import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase } from './setup';
import { ToneRepository } from '../ToneRepository';
import { dbExecute } from '../client';

describe('ToneRepository', () => {
  let repo: ToneRepository;

  beforeAll(async () => {
    await setupTestDatabase();
    repo = new ToneRepository();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  beforeEach(async () => {
    await dbExecute('DELETE FROM tones');
  });

  it('should create and retrieve tones sorted by name', async () => {
    await repo.insert({ id: 'ton-1', name: 'Dramatic' } as any);
    await repo.insert({ id: 'ton-2', name: 'Comic' } as any);

    const tones = await repo.findAll();
    expect(tones.length).toBe(2);
    expect(tones[0].name).toBe('Comic'); // Alphabetical order
    expect(tones[1].name).toBe('Dramatic');
  });

  it('should find tone by name', async () => {
    await repo.insert({ id: 'ton-3', name: 'Suspense' } as any);

    const found = await repo.findByName('Suspense');
    expect(found).not.toBeNull();
    expect(found?.id).toBe('ton-3');

    const notFound = await repo.findByName('NonExistent');
    expect(notFound).toBeNull();
  });
});
