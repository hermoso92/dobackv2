import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@cosigein.com' },
        include: { organization: true }
    });
    console.log('Usuario:', user);

    if (!user?.organizationId) {
        console.log('El usuario no tiene organización asignada.');
        return;
    }

    const vehicles = await prisma.vehicle.findMany({
        where: { organizationId: user.organizationId }
    });
    console.log('Vehículos:', vehicles);

    const events = await prisma.event.findMany({
        where: {
            vehicles: {
                some: {
                    organizationId: user.organizationId
                }
            }
        },
        include: {
            vehicles: true
        }
    });
    console.log('Eventos:', events);

    await prisma.$disconnect();
}

checkData();
