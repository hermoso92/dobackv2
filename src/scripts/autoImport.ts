import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../../backend/node_modules/@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 1000;

// Ruta base para los archivos de datos
const BASE_PATH = path.join(__dirname, '..', '..', 'uploads');

async function createVehicleAndSession(vehicleId: string, sessionDate: string) {
    try {
        console.log('Iniciando proceso de importación...');

        // Crear o encontrar el vehículo
        console.log('Creando/buscando vehículo...');
        const vehicle = await prisma.vehicle.upsert({
            where: { licensePlate: vehicleId },
            update: {},
            create: {
                name: vehicleId,
                model: 'Default',
                licensePlate: vehicleId,
                brand: 'Default',
                type: 'Default',
                status: 'ACTIVE'
            }
        });
        console.log('Vehículo creado/encontrado:', vehicle);

        // Buscar un usuario válido
        console.log('Buscando usuario válido...');
        const user = await prisma.user.findFirst();
        if (!user) {
            throw new Error('No se encontró ningún usuario en la base de datos');
        }
        console.log('Usuario encontrado:', user.id);

        // Crear la sesión
        console.log('Creando sesión...');
        const session = await prisma.session.create({
            data: {
                vehicleId: vehicle.id,
                userId: user.id,
                startTime: new Date(sessionDate),
                endTime: new Date(sessionDate)
            }
        });
        console.log('Sesión creada:', session);

        // Procesar archivos de datos
        // Convertir la fecha a formato ddmmyyyy
        const [year, month, day] = sessionDate.split('-');
        const sessionFolder = `${day}${month}${year}`;
        const sessionPath = path.join(BASE_PATH, 'cosigein', vehicleId, sessionFolder);
        console.log('Buscando archivos en:', sessionPath);

        // Verificar si el directorio existe
        if (!fs.existsSync(sessionPath)) {
            throw new Error(`El directorio ${sessionPath} no existe`);
        }

        const files = fs.readdirSync(sessionPath);
        console.log('Archivos encontrados:', files);

        // Procesar archivo de estabilidad
        const stabilityFile = files.find(f => f.includes('ESTABILIDAD'));
        if (stabilityFile) {
            console.log('Procesando archivo de estabilidad:', stabilityFile);
            const stabilityPath = path.join(sessionPath, stabilityFile);
            const stabilityData = fs.readFileSync(stabilityPath, 'utf-8');
            const lines = stabilityData.split('\n');

            // Ignorar las primeras 2 líneas (encabezados)
            const dataLines = lines.slice(2);
            const measurements = [];

            for (const [i, line] of dataLines.entries()) {
                if (line.trim()) {
                    const [
                        ax, ay, az,
                        gx, gy, gz,
                        roll, pitch, yaw,
                        timeantwifi,
                        usciclo1, usciclo2, usciclo3, usciclo4, usciclo5,
                        si, accmag, microsds
                    ] = line.split(';').map(v => parseFloat(v.replace(',', '.').trim()));

                    const values = [ax, ay, az, gx, gy, gz, roll, pitch, yaw, timeantwifi, usciclo1, usciclo2, usciclo3, usciclo4, usciclo5, si, accmag, microsds];
                    const allValid = values.every(val => typeof val === 'number' && !isNaN(val));

                    if (i === 0) {
                        console.log('Primera línea parseada:', {
                            ax, ay, az, gx, gy, gz, roll, pitch, yaw, timeantwifi,
                            usciclo1, usciclo2, usciclo3, usciclo4, usciclo5, si, accmag, microsds
                        });
                    }

                    if (allValid) {
                        measurements.push({
                            sessionId: session.id,
                            timestamp: new Date(sessionDate),
                            ax, ay, az, gx, gy, gz, roll, pitch, yaw,
                            timeantwifi,
                            usciclo1, usciclo2, usciclo3, usciclo4, usciclo5,
                            si, accmag, microsds
                        });
                    }
                }
            }

            // Insertar mediciones en lotes
            for (let i = 0; i < measurements.length; i += BATCH_SIZE) {
                const batch = measurements.slice(i, i + BATCH_SIZE);
                await prisma.stabilityMeasurement.createMany({
                    data: batch
                });
            }

            console.log(`Se insertaron ${measurements.length} mediciones de estabilidad para la sesión ${session.id}`);
        } else {
            console.log('No se encontró archivo de estabilidad para esta sesión');
        }

        await prisma.$disconnect();
        console.log('Proceso de importación completado exitosamente');
    } catch (error) {
        console.error('Error al crear vehículo y sesión:', error);
        await prisma.$disconnect();
        throw error;
    }
}

// Ejecutar la función
createVehicleAndSession('doback003', '2025-03-05')
    .catch(console.error); 