import bcrypt from 'bcrypt';
import { OrganizationType, SessionType, VehicleStatus } from '../types/domain';
import { logger } from '../utils/logger';
import { db } from './database';

async function seed() {
    try {
        logger.info('Starting database seeding...');

        // Crear organización de prueba
        const [orgResult] = await db.execute(
            `INSERT INTO organizations (id, name, type, status, settings) VALUES (
                UUID(), 
                'Emergency Services Test',
                ?,
                'active',
                ?
            )`,
            [
                OrganizationType.EMERGENCY,
                JSON.stringify({
                    alertThresholds: {
                        stabilityWarning: 0.7,
                        stabilityDanger: 0.85,
                        telemetryWarning: 0.6,
                        telemetryDanger: 0.8
                    },
                    reportingFrequency: 'realtime',
                    dataRetentionDays: 365,
                    aiEnabled: true,
                    allowedModules: ['stability', 'telemetry', 'maintenance']
                })
            ]
        );

        const organizationId = (orgResult as any).insertId;

        // Crear usuario administrador
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const [userResult] = await db.execute(
            `INSERT INTO users (
                id, organization_id, email, password, first_name, last_name,
                role, status, preferences
            ) VALUES (
                UUID(), ?, ?, ?, 'Admin', 'User', 'admin', 'active', ?
            )`,
            [
                organizationId,
                'admin@test.com',
                hashedPassword,
                JSON.stringify({
                    language: 'es',
                    timezone: 'Europe/Madrid',
                    notifications: {
                        email: true,
                        sms: true,
                        push: true
                    }
                })
            ]
        );

        // Crear vehículo de prueba
        const [vehicleResult] = await db.execute(
            `INSERT INTO vehicles (
                id, organization_id, name, type, model, plate,
                vin, year, status, configuration
            ) VALUES (
                UUID(), ?, 'Test Vehicle 1', 'Ambulance', 'Mercedes Sprinter',
                '1234ABC', '1HGCM82633A123456', 2023, ?, ?
            )`,
            [
                organizationId,
                VehicleStatus.ACTIVE,
                JSON.stringify({
                    stabilityThresholds: {
                        rollThreshold: 30,
                        pitchThreshold: 25,
                        yawThreshold: 45,
                        lateralAccThreshold: 0.8,
                        verticalAccThreshold: 0.6,
                        stabilityIndexThreshold: 0.7
                    },
                    telemetryThresholds: {
                        maxSpeed: 120,
                        maxAcceleration: 3,
                        maxBraking: 4,
                        maxRPM: 4500,
                        maxEngineTemp: 95
                    }
                })
            ]
        );

        const vehicleId = (vehicleResult as any).insertId;

        // Crear sesión de prueba
        const [sessionResult] = await db.execute(
            `INSERT INTO sessions (
                id, vehicle_id, type, start_time, end_time,
                duration, distance, average_speed, max_speed,
                event_count, risk_level, weather_conditions
            ) VALUES (
                UUID(), ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR),
                7200, 85.5, 42.75, 95.2, 3, 'medium', ?
            )`,
            [
                vehicleId,
                SessionType.TRAINING,
                JSON.stringify({
                    temperature: 22,
                    humidity: 65,
                    precipitation: 0,
                    windSpeed: 15,
                    visibility: 10000,
                    roadCondition: 'dry'
                })
            ]
        );

        const sessionId = (sessionResult as any).insertId;

        // Crear mediciones de estabilidad de prueba
        const measurements = [];
        for (let i = 0; i < 10; i++) {
            measurements.push([
                'UUID()',
                sessionId,
                `DATE_ADD(NOW(), INTERVAL ${i * 10} MINUTE)`,
                Math.random() * 10 - 5, // roll
                Math.random() * 8 - 4,  // pitch
                Math.random() * 6 - 3,  // yaw
                Math.random() * 0.4 - 0.2, // lateral_acc
                Math.random() * 0.3 - 0.15, // vertical_acc
                Math.random() * 0.2 - 0.1,  // longitudinal_acc
                JSON.stringify({
                    frontLeft: 250 + Math.random() * 50,
                    frontRight: 250 + Math.random() * 50,
                    rearLeft: 250 + Math.random() * 50,
                    rearRight: 250 + Math.random() * 50
                }),
                JSON.stringify({
                    latitude: 40.416775 + Math.random() * 0.01,
                    longitude: -3.703790 + Math.random() * 0.01,
                    altitude: 650 + Math.random() * 10
                })
            ]);
        }

        await db.execute(
            `INSERT INTO stability_measurements (
                id, session_id, timestamp, roll, pitch, yaw,
                lateral_acc, vertical_acc, longitudinal_acc,
                load_distribution, location
            ) VALUES ?`,
            [measurements]
        );

        // Crear eventos de prueba
        await db.execute(
            `INSERT INTO events (
                id, session_id, type, severity, message,
                timestamp, status, context
            ) VALUES
            (UUID(), ?, 'stability', 'warning', 'Alta transferencia de carga detectada',
             NOW(), 'active', ?),
            (UUID(), ?, 'stability', 'critical', 'Riesgo de vuelco detectado',
             DATE_ADD(NOW(), INTERVAL 30 MINUTE), 'active', ?),
            (UUID(), ?, 'system', 'info', 'Sesión iniciada correctamente',
             NOW(), 'resolved', ?)`,
            [
                sessionId,
                JSON.stringify({
                    ltr: 0.75,
                    rollAngle: 12.5,
                    lateralAcceleration: 0.65
                }),
                sessionId,
                JSON.stringify({
                    ltr: 0.92,
                    rollAngle: 28.3,
                    lateralAcceleration: 1.1
                }),
                sessionId,
                JSON.stringify({
                    sessionType: 'training',
                    operator: 'admin'
                })
            ]
        );

        // Crear mantenimiento programado
        await db.execute(
            `INSERT INTO maintenance (
                id, vehicle_id, type, description, scheduled_date,
                status, cost, technician, parts
            ) VALUES (
                UUID(), ?, 'preventive', 'Mantenimiento preventivo trimestral',
                DATE_ADD(NOW(), INTERVAL 1 MONTH), 'pending', 450.00,
                'John Doe', ?
            )`,
            [
                vehicleId,
                JSON.stringify([
                    { name: 'Aceite motor', quantity: 1, cost: 85.00 },
                    { name: 'Filtro aceite', quantity: 1, cost: 25.00 },
                    { name: 'Filtro aire', quantity: 1, cost: 40.00 }
                ])
            ]
        );

        logger.info('Database seeding completed successfully');
    } catch (error) {
        logger.error('Error during database seeding', { error });
        process.exit(1);
    } finally {
        await db.end();
    }
}

// Ejecutar seeding
seed(); 