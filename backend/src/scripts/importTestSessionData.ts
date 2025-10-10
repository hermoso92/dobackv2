import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const BASE_PATH = path.resolve(__dirname, '../../uploads/cosigein/doback003/05032025');
const FILES = {
    estabilidad: '0005_ESTABILIDAD_DOBACK003_05-03-2025.txt',
    can: '0005_CAN_DOBACK003_05-03-2025.csv',
    gps: '0005_GPS_DOBACK003_05-03-2025.csv'
};

// Campos válidos para StabilityMeasurement
const STABILITY_FIELDS = [
    'ax',
    'ay',
    'az',
    'gx',
    'gy',
    'gz',
    'roll',
    'pitch',
    'yaw',
    'timeantwifi',
    'usciclo1',
    'usciclo2',
    'usciclo3',
    'usciclo4',
    'usciclo5',
    'si',
    'accmag',
    'microsds'
];

async function main() {
    // Buscar usuario y última sesión
    const user = await prisma.user.findUnique({
        where: { email: 'admin@DobackSoft.com' }
    });
    if (!user) throw new Error('Usuario no encontrado');
    const session = await prisma.session.findFirst({
        where: { userId: user.id },
        orderBy: { startTime: 'desc' }
    });
    if (!session) throw new Error('Sesión no encontrada');

    // --- ESTABILIDAD ---
    const estPath = path.join(BASE_PATH, FILES.estabilidad);
    const estLines = fs.readFileSync(estPath, 'utf-8').split(/\r?\n/).filter(Boolean);
    // Saltar las dos primeras líneas (cabecera y nombres de columnas)
    const estHeaders = estLines[1].split(';').map((h) => h.trim().replace(/\s/g, ''));
    for (let i = 2; i < estLines.length; i++) {
        const values = estLines[i].split(';').map((v) => v.trim());
        if (values.length < estHeaders.length) continue;
        const data: any = {};
        estHeaders.forEach((h, idx) => {
            if (STABILITY_FIELDS.includes(h)) {
                data[h] = parseFloat(values[idx]);
            }
        });
        // Solo insertar si tiene todos los campos requeridos
        if (Object.keys(data).length === STABILITY_FIELDS.length) {
            await prisma.stabilityMeasurement.create({
                data: {
                    ...data,
                    sessionId: session.id,
                    timestamp: new Date() // Puedes mejorar esto si hay timestamp real
                }
            });
        }
    }

    // --- CAN ---
    const canPath = path.join(BASE_PATH, FILES.can);
    const canLines = fs.readFileSync(canPath, 'utf-8').split(/\r?\n/).filter(Boolean);
    const canHeaderIdx = canLines.findIndex((l) => l.startsWith('Timestamp'));
    if (canHeaderIdx !== -1) {
        const canHeaders = canLines[canHeaderIdx].split(',').map((h) => h.trim());
        for (let i = canHeaderIdx + 1; i < canLines.length; i++) {
            const values = canLines[i].split(',').map((v) => v.trim());
            if (values.length < canHeaders.length) continue;
            const data: any = {};
            canHeaders.forEach((h, idx) => {
                // Puedes filtrar aquí si solo quieres los campos del modelo
                data[h.replace(/\s/g, '')] = isNaN(Number(values[idx]))
                    ? values[idx]
                    : parseFloat(values[idx]);
            });
            await prisma.canMeasurement.create({
                data: {
                    ...data,
                    sessionId: session.id,
                    timestamp: new Date() // Puedes mejorar esto si hay timestamp real
                }
            });
        }
    }

    // --- GPS ---
    const gpsPath = path.join(BASE_PATH, FILES.gps);
    const gpsLines = fs.readFileSync(gpsPath, 'utf-8').split(/\r?\n/).filter(Boolean);
    for (let i = 1; i < gpsLines.length; i++) {
        const values = gpsLines[i].split(',').map((v) => v.trim());
        if (values.length < 8) continue;
        // Parsear fecha y hora en formato DD/MM/YYYY,HH:MM:SSAM/PM
        const [day, month, year] = values[0].split('/');
        const [time, ampm] = values[1].match(/(\d{2}:\d{2}:\d{2})(AM|PM)/i)?.slice(1, 3) || [];
        if (!time || !ampm) continue;
        const [hourStr, minute, second] = time.split(':');
        let hour = parseInt(hourStr, 10);
        if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour
            .toString()
            .padStart(2, '0')}:${minute}:${second}`;
        const dateObj = new Date(isoDate);
        if (isNaN(dateObj.getTime())) continue;
        await prisma.gpsMeasurement.create({
            data: {
                date: dateObj,
                latitude: parseFloat(values[2]),
                longitude: parseFloat(values[3]),
                altitude: parseFloat(values[4]),
                speed: parseFloat(values[5]),
                satellites: parseInt(values[6]),
                quality: parseInt(values[7]),
                sessionId: session.id
            }
        });
    }

    console.log('Datos importados correctamente a la sesión:', session.id);
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
