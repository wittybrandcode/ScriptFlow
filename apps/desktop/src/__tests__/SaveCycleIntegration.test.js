import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutosaveQueue } from '../utils/AutosaveQueue';

// Mock DB client
const mockDb = new Map();

const mockSaveToDb = vi.fn(async (id, item) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockDb.set(id, item);
      resolve();
    }, 10);
  });
});

describe('Save Cycle Integration', () => {
  beforeEach(() => {
    mockDb.clear();
    mockSaveToDb.mockClear();
  });

  it('should successfully save written blocks to the database mock', async () => {
    const queue = new AutosaveQueue(mockSaveToDb, 50);

    const block1 = { id: 'block-1', body: { content: 'Hello World', type: 'DIALOGUE' } };
    const block2 = { id: 'block-2', body: { content: 'Action happens', type: 'ACTION' } };

    queue.enqueue(block1);
    queue.enqueue(block2);

    // Wait for debounce and processing
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(mockSaveToDb).toHaveBeenCalledTimes(2);
    expect(mockDb.get('block-1')).toEqual(block1.body);
    expect(mockDb.get('block-2')).toEqual(block2.body);
  });
  
  it('should merge rapid updates to the same block before saving', async () => {
    const queue = new AutosaveQueue(mockSaveToDb, 50);

    queue.enqueue({ id: 'block-1', body: { content: 'A', type: 'DIALOGUE' } });
    queue.enqueue({ id: 'block-1', body: { content: 'AB', type: 'DIALOGUE' } });
    queue.enqueue({ id: 'block-1', body: { content: 'ABC', type: 'DIALOGUE' } });

    // Wait for debounce and processing
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(mockSaveToDb).toHaveBeenCalledTimes(1);
    // The final state should be 'ABC'
    expect(mockDb.get('block-1')).toEqual({ content: 'ABC', type: 'DIALOGUE' });
  });
});
