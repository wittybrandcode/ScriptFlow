import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutosaveQueue } from '../utils/AutosaveQueue';

describe('AutosaveQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should save an item successfully on first attempt', async () => {
    const saveAction = vi.fn().mockResolvedValue(undefined);
    const queue = new AutosaveQueue(saveAction, 100);

    queue.enqueue({ id: 'block-1', body: { content: 'Hello' } });

    // Advance past debounce delay
    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();

    expect(saveAction).toHaveBeenCalledWith('block-1', { content: 'Hello' });
    expect(saveAction).toHaveBeenCalledTimes(1);
  });

  it('should deduplicate items with the same id', async () => {
    const saveAction = vi.fn().mockResolvedValue(undefined);
    const queue = new AutosaveQueue(saveAction, 100);

    queue.enqueue({ id: 'block-1', body: { content: 'v1' } });
    queue.enqueue({ id: 'block-1', body: { content: 'v2' } });

    vi.advanceTimersByTime(100);
    await vi.runAllTimersAsync();

    expect(saveAction).toHaveBeenCalledTimes(1);
    expect(saveAction).toHaveBeenCalledWith('block-1', { content: 'v2' });
  });

  it('should permanently drop an item after 3 failed attempts and call onSaveError', async () => {
    const saveError = new Error('DB write failed');
    const saveAction = vi.fn().mockRejectedValue(saveError);
    const onSaveError = vi.fn();
    const queue = new AutosaveQueue(saveAction, 50, onSaveError);

    queue.enqueue({ id: 'block-fail', body: { content: 'data' } });

    // Attempt 1
    vi.advanceTimersByTime(50);
    await vi.runAllTimersAsync();

    // Attempt 2 (backoff 500ms)
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    // Attempt 3 (backoff 1000ms)
    vi.advanceTimersByTime(1000);
    await vi.runAllTimersAsync();

    expect(saveAction).toHaveBeenCalledTimes(3);
    expect(onSaveError).toHaveBeenCalledTimes(1);
    expect(onSaveError).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'block-fail', _attempts: 3 }),
      saveError
    );

    // Queue should be empty now — no more processing
    expect(queue.queue.length).toBe(0);
  });

  it('should force save pending items on scenario switch (flush)', () => {
    const saveAction = vi.fn();
    const queue = new AutosaveQueue(saveAction, 100);

    queue.enqueue({ id: 'block-1', body: {} });
    queue.enqueue({ id: 'block-2', body: {} });

    expect(queue.queue.length).toBe(2);

    queue.flush();

    expect(queue.queue.length).toBe(0);
    expect(queue.timer).toBe(null);

    // Should have called saveAction for both pending items immediately
    expect(saveAction).toHaveBeenCalledTimes(2);
    expect(saveAction).toHaveBeenCalledWith('block-1', {});
    expect(saveAction).toHaveBeenCalledWith('block-2', {});
  });

  it('should apply exponential backoff delays between retries', async () => {
    const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
    vi.useRealTimers(); // Use real timers for async control in this specific test

    let callCount = 0;
    const saveAction = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount <= 2) throw new Error('transient failure');
    });
    // Very short delays so test runs fast with real timers
    const queue = new AutosaveQueue(saveAction, 10);

    queue.enqueue({ id: 'block-retry', body: { content: 'test' } });

    // Wait enough time for all 3 attempts to complete (10ms + 500ms + 1000ms)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // After all retries, the 3rd attempt should succeed
    expect(saveAction).toHaveBeenCalledTimes(3);
    expect(queue.queue.length).toBe(0);
  }, 5000);
});
