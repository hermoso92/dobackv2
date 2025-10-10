import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Organización y usuario admin
    const org = await prisma.organization.upsert({
        where: { apiKey: 'demo-key' },
        update: {},
        create: { name: 'Bomberos Madrid', apiKey: 'demo-key' },
    });
    const password = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            email: 'admin@demo.com',
            name: 'Super Admin',
            password,
            role: UserRole.ADMIN,
            organizationId: org.id,
        },
    });

    // Parques y taller
    const lozoyuela = await prisma.park.upsert({
        where: { identifier: '13' },
        update: {},
        create: {
            name: 'Lozoyuela PB',
            identifier: '13',
            geometry: { type: 'Point', coordinates: [-3.634, 40.950], radius: 100 },
            organizationId: org.id,
        },
    });
    const mostoles = await prisma.park.upsert({
        where: { identifier: '38' },
        update: {},
        create: {
            name: 'Móstoles',
            identifier: '38',
            geometry: { type: 'Point', coordinates: [-3.864, 40.322], radius: 100 },
            organizationId: org.id,
        },
    });
    await prisma.zone.upsert({
        where: { id: 'taller-central' },
        update: {},
        create: {
            id: 'taller-central',
            name: 'Taller Central',
            type: 'taller',
            geometry: { type: 'Point', coordinates: [-3.700, 40.400], radius: 80 },
            organizationId: org.id,
        },
    });

    // Vehículos
    await prisma.vehicle.upsert({
        where: { identifier: '13.11' },
        update: {},
        create: {
            name: 'Vehículo Primario 13',
            identifier: '13.11',
            model: 'BOMBERO',
            licensePlate: 'MAT1311',
            type: 'TRUCK',
            status: 'ACTIVE',
            organizationId: org.id,
            parkId: lozoyuela.id,
        },
    });
    await prisma.vehicle.upsert({
        where: { identifier: '13.30' },
        update: {},
        create: {
            name: 'Vehículo Secundario 13',
            identifier: '13.30',
            model: 'BOMBERO',
            licensePlate: 'MAT1330',
            type: 'TRUCK',
            status: 'ACTIVE',
            organizationId: org.id,
            parkId: lozoyuela.id,
        },
    });
    await prisma.vehicle.upsert({
        where: { identifier: '38.11' },
        update: {},
        create: {
            name: 'Vehículo Primario 38',
            identifier: '38.11',
            model: 'BOMBERO',
            licensePlate: 'MAT3811',
            type: 'TRUCK',
            status: 'ACTIVE',
            organizationId: org.id,
            parkId: mostoles.id,
        },
    });
    await prisma.vehicle.upsert({
        where: { identifier: '38.30' },
        update: {},
        create: {
            name: 'Vehículo Secundario 38',
            identifier: '38.30',
            model: 'BOMBERO',
            licensePlate: 'MAT3830',
            type: 'TRUCK',
            status: 'ACTIVE',
            organizationId: org.id,
            parkId: mostoles.id,
        },
    });
}

main().catch(console.error).finally(() => prisma.$disconnect()); 