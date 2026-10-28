/**
 * AutosaveQueue — Resilient autosave with exponential backoff and TTL safety.
 *
 * Design decisions:
 *  - Each queued item tracks its own `_attempts` counter.
 *  - After MAX_RETRIES (3) consecutive failures, the item is permanently
 *    discarded and the optional `onSaveError` callback fires so the UI
 *    can display a user-visible notification.
 *  - Retry delays follow exponential backoff: BASE_BACKOFF × 2^(attempt-1).
 *  - `flush()` clears the entire queue and cancels pending timers, intended
 *    to be called when the active scenario changes (TTL boundary).
 */

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

export interface AutosaveItem {
  id: string | number;
  body: any;
  _attempts?: number;
  [key: string]: any;
}

export type SaveActionFn = (id: any, body?: any) => Promise<any> | any;
export type SaveErrorCallback = (item: AutosaveItem, error: any) => void;

export class AutosaveQueue {
  public saveAction: SaveActionFn;
  public delayMs: number;
  public onSaveError: SaveErrorCallback | null;
  public queue: AutosaveItem[];
  public timer: any;
  public isSaving: boolean;

  constructor(
    saveAction: SaveActionFn, 
    delayMs: number = 1500, 
    onSaveError: SaveErrorCallback | null = null
  ) {
    this.saveAction = saveAction;
    this.delayMs = delayMs;
    this.onSaveError = onSaveError;
    this.queue = [];
    this.timer = null;
    this.isSaving = false;
  }

  /**
   * Enqueues a new update and debounces saving.
   */
  enqueue(data: AutosaveItem): void {
    // Keep only latest update for the same entity to deduplicate
    this.queue = this.queue.filter(item => item.id !== data.id);
    this.queue.push({ ...data, _attempts: 0 });

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.processQueue();
    }, this.delayMs);
  }

  /**
   * Flushes entire queue immediately and cancels pending timers.
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const pendingItems = [...this.queue];
    this.queue = [];
    
    if (pendingItems.length > 0) {
      console.warn(`⚠️ AutosaveQueue: جاري إنقاذ وحفظ ${pendingItems.length} عنصر(عناصر) معلقة بسبب تبديل السيناريو`);
      const results = await Promise.allSettled(
        pendingItems.map(item => Promise.resolve(this.saveAction(item.id, item.body)))
      );
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          console.error(`Flush save error for item ${pendingItems[idx]?.id}:`, res.reason);
        }
      });
    }
  }

  /**
   * Processes and saves accumulated items sequentially.
   */
  async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.isSaving) return;

    this.isSaving = true;
    const itemToSave = this.queue.shift();
    if (!itemToSave) {
      this.isSaving = false;
      return;
    }

    try {
      if (typeof this.saveAction === 'function') {
        await this.saveAction(itemToSave.id, itemToSave.body);
      }

      console.log(`✅ تم الحفظ التلقائي بنجاح للكيان: ${itemToSave.id}`);

    } catch (err: any) {
      itemToSave._attempts = (itemToSave._attempts || 0) + 1;

      if (itemToSave._attempts >= MAX_RETRIES) {
        console.error(
          `❌ فشل الحفظ التلقائي نهائياً للكيان ${itemToSave.id} بعد ${MAX_RETRIES} محاولات`,
          err
        );
        if (typeof this.onSaveError === 'function') {
          try {
            this.onSaveError(itemToSave, err);
          } catch (_) {
            // Prevent notification error from breaking flow
          }
        }
      } else {
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, itemToSave._attempts - 1);
        console.warn(
          `⚠️ محاولة ${itemToSave._attempts}/${MAX_RETRIES} فشلت للكيان ${itemToSave.id}. إعادة المحاولة بعد ${backoffMs}ms`
        );
        this.queue.unshift(itemToSave);

        this.isSaving = false;
        this.timer = setTimeout(() => this.processQueue(), backoffMs);
        return;
      }
    } finally {
      this.isSaving = false;
    }

    if (this.queue.length > 0 && !this.timer) {
      this.processQueue();
    }
  }
}
