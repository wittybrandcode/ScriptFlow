import { setupTestDatabase as dbSetup, teardownTestDatabase as dbTeardown } from '../../../database/src/test/setup.js';

export async function setupTestDatabase() {
  return await dbSetup();
}

export function teardownTestDatabase() {
  dbTeardown();
}
