import { dbSelect, dbExecute, withTransaction, TransactionContext } from './client.js';

/**
 * BaseRepository defines the standard CRUD operations
 * mapping TypeScript models to the SQLite backend.
 * 
 * All domain repositories inherit from this class.
 * SQL is NEVER written outside this layer.
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected abstract readonly tableName: string;

  /**
   * قائمة الحقول المسموح بها فعلياً في الجدول.
   * كل Repository فرعي يجب أن يعرّف هذه القائمة لمنع حقن حقول وهمية.
   * إذا كانت فارغة (null)، يتم تمرير جميع الحقول بدون فلترة (سلوك قديم).
   */
  protected readonly allowedColumns: string[] | null = null;

  /**
   * فلترة الحقول المدخلة مقابل القائمة المسموح بها، والتحقق الصارم من صحة المعرّف.
   */
  private sanitizeEntries(entries: [string, any][]): [string, any][] {
    const validIdPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    const safeEntries = entries.filter(([key]) => validIdPattern.test(key));
    if (!this.allowedColumns || this.allowedColumns.length === 0) {
      return safeEntries;
    }
    return safeEntries.filter(([key]) => this.allowedColumns!.includes(key));
  }

  // ── READ ──────────────────────────────────────────

  /**
   * Find a record by its exact string ID.
   */
  async findById(id: string, tx?: TransactionContext): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
    const results = tx ? await tx.select<T>(query, [id]) : await dbSelect<T>(query, [id]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find multiple records by matching a specific column.
   */
  async findAllBy(column: string, value: any, tx?: TransactionContext): Promise<T[]> {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
      throw new Error(`Invalid column identifier: ${column}`);
    }
    const query = `SELECT * FROM ${this.tableName} WHERE ${column} = $1`;
    return tx ? await tx.select<T>(query, [value]) : await dbSelect<T>(query, [value]);
  }

  /**
   * Find active (non-deleted) records by a specific column, ordered.
   */
  async findActiveBy(column: string, value: any, orderBy: string = 'created_at DESC', tx?: TransactionContext): Promise<T[]> {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
      throw new Error(`Invalid column identifier: ${column}`);
    }
    const query = `SELECT * FROM ${this.tableName} WHERE ${column} = $1 AND deleted_at IS NULL ORDER BY ${orderBy}`;
    return tx ? await tx.select<T>(query, [value]) : await dbSelect<T>(query, [value]);
  }

  /**
   * Get all active (not deleted) records.
   */
  async findAllActive(tx?: TransactionContext): Promise<T[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`;
    return tx ? await tx.select<T>(query) : await dbSelect<T>(query);
  }

  /**
   * Get all records (including deleted), ordered.
   */
  async findAll(orderBy: string = 'created_at DESC', tx?: TransactionContext): Promise<T[]> {
    const query = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`;
    return tx ? await tx.select<T>(query) : await dbSelect<T>(query);
  }

  // ── WRITE ─────────────────────────────────────────

  /**
   * Generic insert. Accepts a partial record with at least an `id`.
   * Dynamically builds the INSERT query from the object's keys.
   */
  async insert(record: Partial<T> & { id: string }, tx?: TransactionContext): Promise<void> {
    const rawEntries = Object.entries(record).filter(([_, v]) => v !== undefined);
    const entries = this.sanitizeEntries(rawEntries);
    if (entries.length === 0) return;

    const columns = entries.map(([k]) => k).join(', ');
    const placeholders = entries.map((_, i) => `$${i + 1}`).join(', ');
    const values = entries.map(([_, v]) => v);

    const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    if (tx) {
      await tx.execute(query, values);
    } else {
      await dbExecute(query, values);
    }
  }

  /**
   * Bulk insert multiple records inside a single transaction.
   */
  async bulkInsert(records: Array<Partial<T> & { id: string }>, tx?: TransactionContext): Promise<void> {
    if (!records || records.length === 0) return;
    
    if (tx) {
      for (const record of records) {
        await this.insert(record, tx);
      }
    } else {
      await withTransaction(async (innerTx) => {
        for (const record of records) {
          await this.insert(record, innerTx);
        }
      });
    }
  }

  /**
   * Generic update. Accepts an ID and a partial record of fields to update.
   * Supports optional optimistic locking if expectedVersion is provided.
   */
  async update(id: string, fields: Partial<T>, tx?: TransactionContext, expectedVersion?: number): Promise<void> {
    const rawEntries = Object.entries(fields).filter(
      ([k, v]) => v !== undefined && k !== 'id'
    );
    const entries = this.sanitizeEntries(rawEntries);
    if (entries.length === 0) return;

    const setClauses = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
    const values = entries.map(([_, v]) => v);
    values.push(id); // param id

    let query: string;
    if (expectedVersion !== undefined) {
      values.push(expectedVersion);
      query = `UPDATE ${this.tableName} SET ${setClauses} WHERE id = $${values.length - 1} AND version = $${values.length}`;
    } else {
      query = `UPDATE ${this.tableName} SET ${setClauses} WHERE id = $${values.length}`;
    }

    const result = tx ? await tx.execute(query, values) : await dbExecute(query, values);
    if (expectedVersion !== undefined && result && result.rowsAffected === 0) {
      throw new Error(`CONFLICT: Version mismatch or record not found for id ${id}`);
    }
  }

  // ── DELETE ────────────────────────────────────────

  /**
   * Soft delete a record by ID (sets deleted_at timestamp).
   */
  async softDelete(id: string, tx?: TransactionContext): Promise<void> {
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`;
    if (tx) {
      await tx.execute(query, [id]);
    } else {
      await dbExecute(query, [id]);
    }
  }

  /**
   * Soft delete all records matching a specific column.
   */
  async softDeleteAllBy(column: string, value: any, tx?: TransactionContext): Promise<void> {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
      throw new Error(`Invalid column identifier: ${column}`);
    }
    const query = `UPDATE ${this.tableName} SET deleted_at = CURRENT_TIMESTAMP WHERE ${column} = $1`;
    if (tx) {
      await tx.execute(query, [value]);
    } else {
      await dbExecute(query, [value]);
    }
  }

  /**
   * Hard delete a record by ID (permanent removal).
   */
  async delete(id: string, tx?: TransactionContext): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    if (tx) {
      await tx.execute(query, [id]);
    } else {
      await dbExecute(query, [id]);
    }
  }

  /**
   * Hard delete all records matching a specific column.
   */
  async deleteAllBy(column: string, value: any, tx?: TransactionContext): Promise<void> {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
      throw new Error(`Invalid column identifier: ${column}`);
    }
    const query = `DELETE FROM ${this.tableName} WHERE ${column} = $1`;
    if (tx) {
      await tx.execute(query, [value]);
    } else {
      await dbExecute(query, [value]);
    }
  }
}
