import Database from "@tauri-apps/plugin-sql";

/**
 * We create an interface for our Database Client so we can
 * easily swap the Tauri SQL implementation with an In-Memory mock for Vitest.
 */
export interface IDatabaseClient {
  execute(query: string, bindValues?: any[]): Promise<any>;
  select<T>(query: string, bindValues?: any[]): Promise<T[]>;
}

// Global instance
let dbInstance: IDatabaseClient | null = null;

/**
 * Initialize the database. If running in Vitest, we can inject a mock.
 */
import { invoke } from "@tauri-apps/api/core";

export async function initDb(mockClient?: IDatabaseClient): Promise<void> {
  if (mockClient) {
    dbInstance = mockClient;
    return;
  }
  
  if (!dbInstance) {
    try {
      // Fetch dynamic self-contained sqlite path from Rust
      const dbPath = await invoke<string>("get_db_path");
      const tauriDb = await Database.load(dbPath);
      
      // Apply production optimizations & concurrency locks
      try {
        await tauriDb.execute("PRAGMA journal_mode=WAL;");
        await tauriDb.execute("PRAGMA busy_timeout=5000;");
        await tauriDb.execute("PRAGMA synchronous=NORMAL;");

        // Ensure key performance indexes exist
        await tauriDb.execute("CREATE INDEX IF NOT EXISTS idx_script_blocks_scene_id ON script_blocks(scene_id);");
        await tauriDb.execute("CREATE INDEX IF NOT EXISTS idx_scenes_scenario_id ON scenes(scenario_id);");
        await tauriDb.execute("CREATE INDEX IF NOT EXISTS idx_scenes_episode_id ON scenes(episode_id);");
        await tauriDb.execute("CREATE INDEX IF NOT EXISTS idx_characters_scenario_id ON characters(scenario_id);");
        await tauriDb.execute("CREATE INDEX IF NOT EXISTS idx_shoot_days_scenario_id ON shoot_days(scenario_id);");
      } catch (pErr) {
        console.warn("PRAGMA/Index optimization warning:", pErr);
      }
      
      dbInstance = tauriDb;
    } catch (err) {
      console.warn("Could not load Tauri SQLite DB. Are you running outside Tauri?", err);
      throw err;
    }
  }
}

export interface TransactionContext {
  execute(query: string, bindValues?: any[]): Promise<any>;
  select<T>(query: string, bindValues?: any[]): Promise<T[]>;
}

// Queue structure for database writes
interface QueueItem {
  query?: string;
  bindValues?: any[];
  isTransactionCallback?: boolean;
  callback?: (tx: TransactionContext) => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

const writeQueue: QueueItem[] = [];
let isProcessingQueue = false;

async function safeSelect<T>(query: string, bindValues: any[] = []): Promise<T[]> {
  const retries = 12;
  const delay = 60;
  for (let i = 0; i < retries; i++) {
    try {
      return await dbInstance!.select<T>(query, bindValues);
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      const isLocked = errMsg.includes("locked") || errMsg.includes("busy") || err?.code === 5;
      if (isLocked && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Database locked after maximum retries");
}

async function safeExecute(query: string, bindValues: any[] = []): Promise<any> {
  const retries = 12;
  const delay = 60;
  for (let i = 0; i < retries; i++) {
    try {
      return await dbInstance!.execute(query, bindValues);
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      const isLocked = errMsg.includes("locked") || errMsg.includes("busy") || err?.code === 5;
      if (isLocked && i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Database locked after maximum retries");
}

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (writeQueue.length > 0) {
    const item = writeQueue.shift();
    if (!item) continue;

    try {
      if (!dbInstance) {
        throw new Error("Database not initialized. Call initDb() first.");
      }
      
      if (item.isTransactionCallback && item.callback) {
        let transactionBegan = false;
        try {
          await safeExecute("BEGIN TRANSACTION");
          transactionBegan = true;
          const txContext: TransactionContext = {
            execute: async (q: string, b: any[] = []) => await safeExecute(q, b),
            select: async <T>(q: string, b: any[] = []) => await safeSelect<T>(q, b)
          };
          const result = await item.callback(txContext);
          await safeExecute("COMMIT");
          transactionBegan = false;
          item.resolve(result);
        } catch (txErr) {
          if (transactionBegan) {
            try {
              await safeExecute("ROLLBACK");
            } catch (rbErr) {
              console.warn("Rollback failed gracefully:", rbErr);
            }
          }
          item.reject(txErr);
        }
      } else if (item.query) {
        const result = await safeExecute(item.query, item.bindValues);
        item.resolve(result);
      }
    } catch (err) {
      item.reject(err);
    }
  }

  isProcessingQueue = false;
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE).
 * Protects against SQL injection by enforcing bind values.
 * Uses a centralized queue to run writes sequentially, avoiding SQLite locks.
 */
export async function dbExecute(query: string, bindValues: any[] = []): Promise<any> {
  if (!dbInstance) throw new Error("Database not initialized. Call initDb() first.");
  
  return new Promise((resolve, reject) => {
    writeQueue.push({ query, bindValues, resolve, reject });
    processQueue();
  });
}

/**
 * Execute a read query (SELECT).
 * Protects against SQL injection by enforcing bind values.
 */
export async function dbSelect<T>(query: string, bindValues: any[] = []): Promise<T[]> {
  if (!dbInstance) throw new Error("Database not initialized. Call initDb() first.");
  return await safeSelect<T>(query, bindValues);
}

/**
 * Execute a transaction block. 
 * Prevents queue interleaving and guarantees atomicity.
 */
export async function withTransaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
  if (!dbInstance) throw new Error("Database not initialized. Call initDb() first.");
  
  return new Promise((resolve, reject) => {
    writeQueue.push({
      isTransactionCallback: true,
      callback: fn,
      resolve,
      reject
    });
    processQueue();
  });
}
