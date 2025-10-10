import { addDays, addHours, format, parse } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';

const SOURCE_DIR = path.join(__dirname, '../data/cosigein/doback003/05032025');
const TARGET_DIR = path.join(__dirname, '../uploads/cosigein');

interface VehicleConfig {
    id: string;
    name: string;
    company: string;
    companyId: number;
}

const VEHICLES: VehicleConfig[] = [
    { id: 'BOM-CM-001', name: 'DOBACK003', company: 'Bomberos Madrid', companyId: 5 },
    { id: 'BOM-CM-002', name: 'DOBACK004', company: 'Bomberos Madrid', companyId: 5 },
    { id: 'BOM-CM-003', name: 'DOBACK005', company: 'Bomberos Madrid', companyId: 5 }
];

const DAYS_TO_GENERATE = 5;

async function readSourceFile(filename: string): Promise<string> {
    return fs.readFile(path.join(SOURCE_DIR, filename), 'utf-8');
}

function adjustTimestamp(timestamp: string, dayOffset: number, hourOffset: number): string {
    // Parsear la fecha según el formato específico
    let date: Date;
    if (timestamp.includes(',')) {
        // Formato GPS: "05/03/2025,09:28:53AM"
        const [datePart, timePart] = timestamp.split(',');
        date = parse(`${datePart} ${timePart}`, 'dd/MM/yyyy hh:mm:ssaa', new Date());
    } else {
        // Formato CAN/ESTABILIDAD: "05/03/2025 09:28:53AM"
        date = parse(timestamp, 'dd/MM/yyyy hh:mm:ssaa', new Date());
    }

    // Ajustar la fecha
    const newDate = addHours(addDays(date, dayOffset), hourOffset);

    // Devolver en el formato correcto según el tipo
    return timestamp.includes(',')
        ? `${format(newDate, 'dd/MM/yyyy')},${format(newDate, 'hh:mm:ssaa')}`
        : format(newDate, 'dd/MM/yyyy hh:mm:ssaa');
}

function generateHeader(
    type: string,
    timestamp: string,
    vehicleId: string,
    companyId: number,
    sessionId: number
): string {
    return `${type};${timestamp};${vehicleId};${companyId};${sessionId}`;
}

async function generateDataForVehicle(vehicle: VehicleConfig, dayOffset: number) {
    const dateStr = format(addDays(new Date('2025-03-05'), dayOffset), 'ddMMyyyy');
    const targetVehicleDir = path.join(TARGET_DIR, vehicle.id, dateStr);

    // Crear directorios si no existen
    await fs.mkdir(targetVehicleDir, { recursive: true });

    // Leer archivos fuente
    const stabilityData = await readSourceFile('0005_ESTABILIDAD_DOBACK003_05-03-2025.txt');
    const canData = await readSourceFile('0005_CAN_DOBACK003_05-03-2025.csv');
    const gpsData = await readSourceFile('0005_GPS_DOBACK003_05-03-2025.csv');

    // Generar datos para cada tipo
    const types = [
        { name: 'ESTABILIDAD', ext: 'txt', data: stabilityData },
        { name: 'CAN', ext: 'csv', data: canData },
        { name: 'GPS', ext: 'csv', data: gpsData }
    ];

    for (const type of types) {
        const lines = type.data.split('\n');
        let currentSession = 1;
        const newLines: string[] = [];
        let isHeader = true;

        for (const line of lines) {
            if (!line.trim()) continue;

            if (line.includes(';')) {
                // Es una línea de cabecera
                if (isHeader) {
                    const timestamp = format(
                        addDays(
                            parse('05/03/2025 09:28:46AM', 'dd/MM/yyyy hh:mm:ssaa', new Date()),
                            dayOffset
                        ),
                        'dd/MM/yyyy hh:mm:ssaa'
                    );
                    newLines.push(
                        generateHeader(
                            type.name,
                            timestamp,
                            vehicle.id,
                            vehicle.companyId,
                            currentSession
                        )
                    );
                    currentSession++;
                    isHeader = false;
                }
            } else {
                // Es una línea de datos
                const parts = line.split(',');
                if (parts.length > 1) {
                    const timestamp = type.name === 'GPS' ? `${parts[0]},${parts[1]}` : parts[0];
                    const newTimestamp = adjustTimestamp(
                        timestamp,
                        dayOffset,
                        Math.floor(Math.random() * 4)
                    );

                    if (type.name === 'GPS') {
                        const [datePart, timePart] = newTimestamp.split(',');
                        parts[0] = datePart;
                        parts[1] = timePart;
                    } else {
                        parts[0] = newTimestamp;
                    }

                    newLines.push(parts.join(','));
                }
            }
        }

        const filename = `0005_${type.name}_${vehicle.id}_${format(
            addDays(new Date('2025-03-05'), dayOffset),
            'dd-MM-yyyy'
        )}.${type.ext}`;

        await fs.writeFile(path.join(targetVehicleDir, filename), newLines.join('\n'), 'utf-8');
    }
}

async function generateDemoData() {
    try {
        for (const vehicle of VEHICLES) {
            for (let day = 0; day < DAYS_TO_GENERATE; day++) {
                await generateDataForVehicle(vehicle, day);
                console.log(`Generados datos para ${vehicle.id} - Día ${day + 1}`);
            }
        }
        console.log('Generación de datos completada');
    } catch (error) {
        console.error('Error generando datos:', error);
    }
}

generateDemoData();
