import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
    try {
        // Buscar usuario de prueba
        const user = await prisma.user.findUnique({
            where: { email: 'admin@DobackSoft.com' },
            include: { organization: true }
        });
        if (!user || !user.organization) {
            throw new Error('Usuario o organización de prueba no encontrados');
        }

        // Crear vehículo de prueba
        const vehicle = await prisma.vehicle.create({
            data: {
                name: 'Vehículo de Prueba',
                model: 'Modelo X',
                licensePlate: 'TEST-123',
                brand: 'DobackSoft',
                type: 'SUV',
                status: 'ACTIVE',
                organizationId: user.organization.id,
                userId: user.id
            }
        });

        // Crear sesión de prueba
        const session = await prisma.session.create({
            data: {
                vehicleId: vehicle.id,
                userId: user.id,
                startTime: new Date(),
                endTime: null
            }
        });

        console.log('Vehículo y sesión de prueba creados:', {
            vehicleId: vehicle.id,
            sessionId: session.id
        });
        await prisma.$disconnect();
    } catch (error) {
        console.error('Error creando datos de prueba:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

createTestData();
