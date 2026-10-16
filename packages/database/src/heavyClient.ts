import { dbSelect, dbExecute } from './client.js';

/**
 * Executes a heavy SQL query using automatic chunking/pagination in JavaScript.
 * This prevents the Tauri IPC bridge and UI thread from freezing on massive datasets.
 * 
 * NOTE: The query MUST support LIMIT and OFFSET, or you should provide a simple SELECT query.
 */
export async function executeHeavyQueryChunked<T>(baseQuery: string, bindValues: any[] = [], chunkSize: number = 500): Promise<T[]> {
  const collectedRows: T[] = [];
  let offset = 0;
  
  // Ensure the query doesn't already have LIMIT/OFFSET to prevent syntax errors
  const cleanQuery = baseQuery.replace(/LIMIT\s+\d+/i, '').replace(/OFFSET\s+\d+/i, '').trim();

  while (true) {
    const chunkQuery = `${cleanQuery} LIMIT ${chunkSize} OFFSET ${offset}`;
    
    try {
      const rows = await dbSelect<T>(chunkQuery, bindValues);
      
      if (rows && rows.length > 0) {
        collectedRows.push(...rows);
      }
      
      // If we got fewer rows than chunkSize, we've reached the end
      if (!rows || rows.length < chunkSize) {
        break;
      }
      
      offset += chunkSize;
      
      // Optional: Yield to the main event loop to keep the UI completely fluid
      // during extremely large multi-chunk operations
      await new Promise(resolve => setTimeout(resolve, 0));
    } catch (err) {
      console.error("[HeavyClient] Chunk execution failed at offset", offset, err);
      throw err;
    }
  }

  return collectedRows;
}

/**
 * Triggers a database optimization routine (VACUUM/ANALYZE) via standard DB execution.
 */
export async function optimizeDatabaseInBackground(): Promise<boolean> {
  try {
    // Run optimization in a non-blocking way using the existing queue
    await dbExecute("ANALYZE;");
    return true;
  } catch (e) {
    console.error("[HeavyClient] DB optimization failed:", e);
    return false;
  }
}
