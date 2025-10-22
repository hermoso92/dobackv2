import { prisma } from '../lib/prisma';

// Script de seed adaptado: solo inserta datos en modelos válidos de Prisma
// Secciones que usan modelos/campos inexistentes han sido deshabilitadas





async function main() {
    // Ejemplo: crear organizaciones y usuarios válidos
    await prisma.organization.create({
        data: {
            name: 'Org Demo',
            apiKey: 'demo-key',
            description: 'Organización de prueba'
        }
    });
    // ...
    // Deshabilitado: seed de eventos, condiciones, mantenimientos, comentarios, etc.
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
