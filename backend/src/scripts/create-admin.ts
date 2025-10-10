import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const user = await prisma.user.create({
            data: {
                email: 'admin@cosigein.com',
                name: 'Administrador',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });
        console.log('Usuario administrador creado:', user);
    } catch (error) {
        console.error('Error al crear usuario administrador:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
