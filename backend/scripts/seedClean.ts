import { PrismaClient, ReportStatus, ReportType, SessionStatus, SessionType, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.organization.findFirst({
        where: { name: 'DobackSoft Demo' }
    });

    if (existing) {
        console.info('Demo data already present, nothing to seed.');
        return;
    }

    const organization = await prisma.organization.create({
        data: {
            id: 'org-demo',
            name: 'DobackSoft Demo'
        }
    });

    const passwordHash = await hash('admin123', 10);

    const adminUser = await prisma.user.create({
        data: {
            id: 'user-demo-admin',
            organization_id: organization.id,
            email: 'admin@dobacksoft.demo',
            name: 'Admin Demo',
            password_hash: passwordHash,
            role: UserRole.admin
        }
    });

    const vehicle = await prisma.vehicle.create({
        data: {
            id: 'veh-demo-001',
            organization_id: organization.id,
            identifier: 'DEMO-001',
            name: 'Unidad Demo'
        }
    });

    const now = new Date();
    const startAt = new Date(now.getTime() - 1000 * 60 * 45);

    const session = await prisma.session.create({
        data: {
            id: 'sess-demo-001',
            organization_id: organization.id,
            vehicle_id: vehicle.id,
            user_id: adminUser.id,
            start_at: startAt,
            end_at: now,
            status: SessionStatus.completed,
            session_type: SessionType.routine,
            source: 'seed-clean'
        }
    });

    await prisma.telemetryGps.createMany({
        data: [
            {
                id: 'tele-gps-1',
                session_id: session.id,
                recorded_at: new Date(startAt.getTime() + 1000 * 60 * 5),
                latitude: 40.4168,
                longitude: -3.7038,
                speed: 52.3,
                severity: 0
            },
            {
                id: 'tele-gps-2',
                session_id: session.id,
                recorded_at: new Date(startAt.getTime() + 1000 * 60 * 20),
                latitude: 40.4175,
                longitude: -3.699,
                speed: 64.1,
                severity: 1
            },
            {
                id: 'tele-gps-3',
                session_id: session.id,
                recorded_at: new Date(startAt.getTime() + 1000 * 60 * 35),
                latitude: 40.4201,
                longitude: -3.6955,
                speed: 71.8,
                severity: 2
            }
        ]
    });

    await prisma.report.create({
        data: {
            id: 'rep-demo-001',
            organization_id: organization.id,
            report_type: ReportType.telemetry,
            status: ReportStatus.pending
        }
    });

    console.info('Seed limpio completado.');
}

main()
    .catch((error) => {
        console.error('Seed limpio falló:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
