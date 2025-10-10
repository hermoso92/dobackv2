import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function initializeDatabase() {
    try {
        console.log('Starting database initialization...');

        // Check if we already have data
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
            console.log('Database already contains data. Skipping initialization.');
            return;
        }

        // Create test organization
        console.log('Creating test organization...');
        const organization = await prisma.organization.create({
            data: {
                name: 'Test Organization'
            }
        });

        // Create admin user
        console.log('Creating admin user...');
        const adminPassword = await bcrypt.hash('Admin123!', 10);
        const admin = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                name: 'Admin User',
                password: adminPassword,
                role: 'ADMIN',
                organizationId: organization.id,
                isEmailVerified: true
            }
        });

        // Create test vehicle
        console.log('Creating test vehicle...');
        const vehicle = await prisma.vehicle.create({
            data: {
                name: 'Test Vehicle',
                model: 'Test Model',
                plateNumber: 'TEST-001',
                organizationId: organization.id,
                status: 'ACTIVE'
            }
        });

        // Create test measurement
        console.log('Creating test measurement...');
        const measurement = await prisma.measurement.create({
            data: {
                timestamp: new Date(),
                vehicleId: vehicle.id,
                sessionId: 'test-session-001',
                data: JSON.stringify({
                    accelerometer: { x: 0.1, y: 0.2, z: 9.81 },
                    gyroscope: { x: 0.01, y: 0.02, z: 0.03 },
                    location: { latitude: 40.4168, longitude: -3.7038, altitude: 667 },
                    loadCells: {
                        frontLeft: 0.3,
                        frontRight: 0.3,
                        rearLeft: 0.2,
                        rearRight: 0.2
                    }
                }),
                metrics: JSON.stringify({
                    ltr: 0.5,
                    ssf: 1.2,
                    drs: 0.8,
                    rsc: 0.9
                })
            }
        });

        // Create test event
        console.log('Creating test event...');
        const event = await prisma.event.create({
            data: {
                type: 'STABILITY_WARNING',
                severity: 'MEDIUM',
                description: 'Test stability warning',
                vehicleId: vehicle.id,
                organizationId: organization.id,
                status: 'ACTIVE',
                context: JSON.stringify({
                    measurementId: measurement.id,
                    metrics: {
                        ltr: 0.5,
                        ssf: 1.2
                    }
                })
            }
        });

        console.log('Database initialization completed successfully!');
        console.log('\nTest credentials:');
        console.log('Email: admin@example.com');
        console.log('Password: Admin123!');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the initialization
initializeDatabase();
