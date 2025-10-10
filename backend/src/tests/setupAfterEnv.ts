import { prisma } from '../config/database';

// Limpiar la base de datos después de cada prueba
afterEach(async () => {
    const tables = ['Evento', 'User', 'Vehicle', 'Session'];
    for (const table of tables) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }
});

// Cerrar la conexión a la base de datos después de todas las pruebas
afterAll(async () => {
    await prisma.$disconnect();
}); 