import { PrismaClient, SessionStatus, UserRole, VehicleType } from '@prisma/client';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Función para parsear fechas en formato DD/MM/YYYY HH:MM:SSAM/PM
function parseCustomDateTime(dateStr: string): Date {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [time, period] = timePart.split(/(?=[AP]M)/);
    const [hours, minutes, seconds] = time.split(':');

    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hour,
        parseInt(minutes),
        parseInt(seconds)
    );
}

interface StabilityMeasurement {
    timestamp: Date;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll?: number;
    pitch?: number;
    yaw?: number;
    timeantwifi?: number;
    isDRSHigh: boolean;
    isLTRCritical: boolean;
    isLateralGForceHigh: boolean;
    temperature?: number;
}

interface CanMeasurement {
    timestamp: Date;
    engineRpm: number;
    vehicleSpeed: number;
    fuelSystemStatus: number;
    temperature?: number;
}

interface GpsMeasurement {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    satellites: number;
    hdop?: number;
    quality?: string;
}

async function parseStabilityFile(filePath: string): Promise<StabilityMeasurement[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const measurements: StabilityMeasurement[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        const [
            timestamp,
            ax,
            ay,
            az,
            gx,
            gy,
            gz,
            roll,
            pitch,
            yaw,
            timeantwifi,
            isDRSHigh,
            isLTRCritical,
            isLateralGForceHigh,
            temperature
        ] = line.split(',').map((s) => s.trim());

        if (timestamp && ax && ay && az && gx && gy && gz) {
            measurements.push({
                timestamp: parseCustomDateTime(timestamp),
                ax: parseFloat(ax),
                ay: parseFloat(ay),
                az: parseFloat(az),
                gx: parseFloat(gx),
                gy: parseFloat(gy),
                gz: parseFloat(gz),
                roll: roll ? parseFloat(roll) : undefined,
                pitch: pitch ? parseFloat(pitch) : undefined,
                yaw: yaw ? parseFloat(yaw) : undefined,
                timeantwifi: timeantwifi ? parseFloat(timeantwifi) : undefined,
                isDRSHigh: isDRSHigh === 'true',
                isLTRCritical: isLTRCritical === 'true',
                isLateralGForceHigh: isLateralGForceHigh === 'true',
                temperature: temperature ? parseFloat(temperature) : undefined
            });
        }
    }

    return measurements;
}

async function parseCanFile(filePath: string): Promise<CanMeasurement[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const measurements: CanMeasurement[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        const [timestamp, engineRpm, vehicleSpeed, fuelSystemStatus, temperature] = line
            .split(',')
            .map((s) => s.trim());

        if (timestamp && engineRpm && vehicleSpeed && fuelSystemStatus) {
            measurements.push({
                timestamp: parseCustomDateTime(timestamp),
                engineRpm: parseFloat(engineRpm),
                vehicleSpeed: parseFloat(vehicleSpeed),
                fuelSystemStatus: parseFloat(fuelSystemStatus),
                temperature: temperature ? parseFloat(temperature) : undefined
            });
        }
    }

    return measurements;
}

async function parseGpsFile(filePath: string): Promise<GpsMeasurement[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const measurements: GpsMeasurement[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;
        const [timestamp, latitude, longitude, altitude, speed, satellites, hdop, quality] = line
            .split(',')
            .map((s) => s.trim());

        if (timestamp && latitude && longitude && altitude && speed && satellites) {
            measurements.push({
                timestamp: parseCustomDateTime(timestamp),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                altitude: parseFloat(altitude),
                speed: parseFloat(speed),
                satellites: parseInt(satellites),
                hdop: hdop ? parseFloat(hdop) : undefined,
                quality: quality || undefined
            });
        }
    }

    return measurements;
}

async function main() {
    try {
        console.log('Iniciando simulación de subida de archivos...');

        // 1. Crear organización con apiKey único
        console.log('Creando organización...');
        const organization = await prisma.organization.upsert({
            where: { apiKey: 'cosigein-api-key-123' },
            update: {},
            create: {
                name: 'Cosigein',
                apiKey: 'cosigein-api-key-123'
            }
        });
        console.log('Organización creada:', organization.name);

        // 2. Crear usuario administrador
        console.log('Creando usuario administrador...');
        const adminPassword = await hash('admin123', 10);
        const admin = await prisma.user.upsert({
            where: { email: 'admin@cosigein.com' },
            update: {},
            create: {
                email: 'admin@cosigein.com',
                password: adminPassword,
                name: 'Administrador',
                role: UserRole.ADMIN,
                organizationId: organization.id
            }
        });
        console.log('Usuario administrador creado:', admin.email);

        // 3. Crear vehículo
        console.log('Creando vehículo...');
        const vehicle = await prisma.vehicle.upsert({
            where: { identifier: 'DOBACK003-SIM' },
            update: {},
            create: {
                name: 'DOBACK003',
                model: 'Doblo',
                licensePlate: '1234ABC',
                identifier: 'DOBACK003-SIM',
                brand: 'Fiat',
                type: VehicleType.FURGONETA,
                organizationId: organization.id,
                userId: admin.id
            }
        });
        console.log('Vehículo creado:', vehicle.name);

        // 4. Procesar archivos de telemetría
        const dataDir = path.join(__dirname, '..', 'data', 'cosigein', 'doback003', '05032025');

        // Crear sesión
        const session = await prisma.session.create({
            data: {
                vehicleId: vehicle.id,
                userId: admin.id,
                startTime: new Date('2025-03-05T00:00:00Z'),
                endTime: new Date('2025-03-05T23:59:59Z'),
                sessionNumber: 5,
                sequence: 1,
                status: SessionStatus.ACTIVE
            }
        });
        console.log('Sesión creada:', session.id);

        // Procesar archivos de mediciones
        const stabilityFile = path.join(dataDir, '0005_ESTABILIDAD_DOBACK003_05-03-2025.txt');
        const canFile = path.join(dataDir, '0005_CAN_DOBACK003_05-03-2025.txt');
        const gpsFile = path.join(dataDir, '0005_GPS_DOBACK003_05-03-2025.txt');

        // Crear mediciones de estabilidad
        if (fs.existsSync(stabilityFile)) {
            const stabilityMeasurements = await parseStabilityFile(stabilityFile);
            await prisma.stabilityMeasurement.createMany({
                data: stabilityMeasurements.map((m) => ({
                    ...m,
                    sessionId: session.id
                }))
            });
            console.log('Mediciones de estabilidad creadas:', stabilityMeasurements.length);
        }

        // Crear mediciones CAN
        if (fs.existsSync(canFile)) {
            const canMeasurements = await parseCanFile(canFile);
            await prisma.canMeasurement.createMany({
                data: canMeasurements.map((m) => ({
                    ...m,
                    sessionId: session.id
                }))
            });
            console.log('Mediciones CAN creadas:', canMeasurements.length);
        }

        // Crear mediciones GPS
        if (fs.existsSync(gpsFile)) {
            const gpsMeasurements = await parseGpsFile(gpsFile);
            await prisma.gpsMeasurement.createMany({
                data: gpsMeasurements.map((m) => ({
                    ...m,
                    sessionId: session.id,
                    date: m.timestamp
                }))
            });
            console.log('Mediciones GPS creadas:', gpsMeasurements.length);
        }

        console.log('Simulación completada exitosamente');
    } catch (error) {
        console.error('Error durante la simulación:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('Error en la ejecución:', error);
    process.exit(1);
});
