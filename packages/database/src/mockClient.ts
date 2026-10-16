import { IDatabaseClient } from './client.js';

export class MockDatabaseClient implements IDatabaseClient {
  public executedQueries: { query: string; bindValues: any[] }[] = [];
  public mockSelectData: any[] = [];

  async execute(query: string, bindValues?: any[]): Promise<any> {
    this.executedQueries.push({ query, bindValues: bindValues || [] });
    return { rowsAffected: 1 };
  }

  async select<T>(query: string, bindValues?: any[]): Promise<T[]> {
    this.executedQueries.push({ query, bindValues: bindValues || [] });
    return this.mockSelectData as T[];
  }

  reset() {
    this.executedQueries = [];
    this.mockSelectData = [];
  }
}
