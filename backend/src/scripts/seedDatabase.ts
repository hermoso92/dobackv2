import { prisma } from '../lib/prisma';

// Script de seedDatabase adaptado: solo borra/crea datos en modelos válidos de Prisma
// Secciones que usan modelos/campos inexistentes han sido deshabilitadas




async function main() {
    // Ejemplo: borrar datos de modelos válidos
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    // ...
    // Deshabilitado: deleteMany en measurement, stabilitySession, canGpsSession, maintenanceRequest, alarm, etc.
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
