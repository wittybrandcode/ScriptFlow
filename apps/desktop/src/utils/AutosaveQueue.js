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

export class AutosaveQueue {
  /**
   * @param {Function} saveAction  — async (id, body) => void
   * @param {number}   delayMs    — debounce delay before processing (default 1500ms)
   * @param {Function} [onSaveError] — optional callback(item, error) when an item is permanently dropped
   */
  constructor(saveAction, delayMs = 1500, onSaveError = null) {
    this.saveAction = saveAction;
    this.delayMs = delayMs;
    this.onSaveError = onSaveError;
    this.queue = [];
    this.timer = null;
    this.isSaving = false;
  }

  /**
   * إضافة تحديث جديد للطابور وتأجيل الحفظ
   */
  enqueue(data) {
    // الاحتفاظ بالتحديث الأحدث فقط لنفس الكيان لمنع تكرار الإرسال
    this.queue = this.queue.filter(item => item.id !== data.id);
    this.queue.push({ ...data, _attempts: 0 });

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.processQueue();
    }, this.delayMs);
  }

  /**
   * مسح الطابور بالكامل وإلغاء أي مؤقتات معلقة.
   * يُستدعى عند تبديل السيناريو النشط (حدود TTL).
   */
  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    const pendingItems = [...this.queue];
    this.queue = [];
    
    if (pendingItems.length > 0) {
      console.warn(`⚠️ AutosaveQueue: جاري إنقاذ وحفظ ${pendingItems.length} عنصر(عناصر) معلقة بسبب تبديل السيناريو`);
      // إجبار الحفظ فوراً لتجنب ضياع البيانات
      pendingItems.forEach(item => {
        try {
          this.saveAction(item.id, item.body);
        } catch (err) {
          console.error('Flush save error:', err);
        }
      });
    }
  }

  /**
   * معالجة وحفظ البيانات المتراكمة بالتسلسل الصحيح
   */
  async processQueue() {
    if (this.queue.length === 0 || this.isSaving) return;

    this.isSaving = true;
    const itemToSave = this.queue.shift();

    try {
      if (typeof this.saveAction === 'function') {
        await this.saveAction(itemToSave.id, itemToSave.body);
      }

      console.log(`✅ تم الحفظ التلقائي بنجاح للكيان: ${itemToSave.id}`);

    } catch (err) {
      itemToSave._attempts = (itemToSave._attempts || 0) + 1;

      if (itemToSave._attempts >= MAX_RETRIES) {
        // تجاوز الحد الأقصى — حذف العنصر نهائياً وتنبيه المستخدم
        console.error(
          `❌ فشل الحفظ التلقائي نهائياً للكيان ${itemToSave.id} بعد ${MAX_RETRIES} محاولات`,
          err
        );
        if (typeof this.onSaveError === 'function') {
          try {
            this.onSaveError(itemToSave, err);
          } catch (_) {
            // تجنب أخطاء الإشعار من كسر الحلقة
          }
        }
      } else {
        // إعادة إدراج العنصر مع تأخير تراجع أسي
        const backoffMs = BASE_BACKOFF_MS * Math.pow(2, itemToSave._attempts - 1);
        console.warn(
          `⚠️ محاولة ${itemToSave._attempts}/${MAX_RETRIES} فشلت للكيان ${itemToSave.id}. إعادة المحاولة بعد ${backoffMs}ms`
        );
        this.queue.unshift(itemToSave);

        // تأجيل المعالجة التالية بنسبة التراجع الأسي
        this.isSaving = false;
        this.timer = setTimeout(() => this.processQueue(), backoffMs);
        return; // الخروج مبكراً لتجنب المعالجة الفورية في finally
      }
    } finally {
      this.isSaving = false;
    }

    // إذا كان هناك عناصر متبقية في الطابور، نعالجها فقط إذا لم يكن هناك مؤقت انتظار قيد التشغيل (Debounce)
    if (this.queue.length > 0 && !this.timer) {
      this.processQueue();
    }
  }
}
