import { IDatabaseClient } from '../client';
declare class MockDatabaseClient implements IDatabaseClient {
    private db;
    constructor();
    private mapBindValues;
    execute(query: string, bindValues?: any[]): Promise<any>;
    select<T>(query: string, bindValues?: any[]): Promise<T[]>;
    close(): void;
}
export declare function setupTestDatabase(): Promise<MockDatabaseClient>;
export declare function teardownTestDatabase(): void;
export {};
