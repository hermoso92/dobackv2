import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@cosigein.com';
    const newPasswordHash = '$2b$10$YQ8NEpi8bBPNOqvBnlLhCeI1eTsjDmNhTROwfTfaSqyhQVe1mQXfq';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('Usuario admin no encontrado');
        process.exit(1);
    }

    await prisma.user.update({
        where: { email },
        data: { password: newPasswordHash }
    });

    console.log('Contraseña del admin actualizada correctamente.');
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
