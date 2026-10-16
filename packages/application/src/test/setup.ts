import { setupTestDatabase as dbSetup, teardownTestDatabase as dbTeardown } from '@scriptflow/database/test';

export async function setupTestDatabase() {
  return await dbSetup();
}

export function teardownTestDatabase() {
  dbTeardown();
}
