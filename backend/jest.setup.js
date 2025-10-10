import { setupTestDatabase, teardownTestDatabase } from './src/config/testDatabase';

beforeAll(async () => {
    await setupTestDatabase();
});

afterAll(async () => {
    await teardownTestDatabase();
});

// Limpiar la base de datos después de cada test
afterEach(async () => {
    const { testDbManager } = await import('./src/config/testDatabase');
    await testDbManager.reset();
}); 