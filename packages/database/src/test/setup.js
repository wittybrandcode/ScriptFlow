import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { initDb } from '../client';
class MockDatabaseClient {
    db;
    constructor() {
        this.db = new Database(':memory:');
        // Load all migrations in order
        const migrationsDir = join(__dirname, '..', '..', '..', '..', 'apps', 'desktop', 'src-tauri', 'migrations');
        try {
            const files = readdirSync(migrationsDir)
                .filter(f => f.endsWith('.sql'))
                .sort(); // Sorts them alphabetically (e.g. 001, 002, 003, 004)
            for (const file of files) {
                const filePath = join(migrationsDir, file);
                const sql = readFileSync(filePath, 'utf-8');
                this.db.exec(sql);
            }
        }
        catch (error) {
            console.error('Failed to load migrations for tests:', error);
            throw error;
        }
    }
    mapBindValues(query, bindValues) {
        const sqliteQuery = query.replace(/\$(\d+)/g, '?');
        const matches = [...query.matchAll(/\$(\d+)/g)];
        if (matches.length > 0) {
            const mappedValues = matches.map(m => bindValues[parseInt(m[1]) - 1]);
            return { sqliteQuery, finalValues: mappedValues };
        }
        return { sqliteQuery, finalValues: bindValues };
    }
    async execute(query, bindValues = []) {
        const { sqliteQuery, finalValues } = this.mapBindValues(query, bindValues);
        const stmt = this.db.prepare(sqliteQuery);
        const result = stmt.run(...finalValues);
        return {
            lastInsertId: result.lastInsertRowid,
            rowsAffected: result.changes,
        };
    }
    async select(query, bindValues = []) {
        const { sqliteQuery, finalValues } = this.mapBindValues(query, bindValues);
        const stmt = this.db.prepare(sqliteQuery);
        return stmt.all(...finalValues);
    }
    close() {
        this.db.close();
    }
}
let mockClient = null;
export async function setupTestDatabase() {
    mockClient = new MockDatabaseClient();
    await initDb(mockClient);
    return mockClient;
}
export function teardownTestDatabase() {
    if (mockClient) {
        mockClient.close();
        mockClient = null;
    }
}
//# sourceMappingURL=setup.js.map