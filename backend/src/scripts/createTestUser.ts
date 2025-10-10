import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
    try {
        // Primero crear una organización de prueba
        const organization = await prisma.organization.create({
            data: {
                name: 'Test Organization',
                apiKey: 'test-api-key-' + Date.now()
            }
        });

        // Crear el usuario de prueba
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const user = await prisma.user.create({
            data: {
                email: 'admin@DobackSoft.com',
                name: 'Admin User',
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
                organizationId: organization.id
            }
        });

        console.log('Usuario de prueba creado:', {
            id: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId
        });

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error creando usuario de prueba:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

createTestUser();
