import { readFile } from 'fs/promises';
import { logger } from './logger';

export interface GPSPoint {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    satellites: number;
    accuracy: number;
}

export interface CANFrame {
    timestamp: Date;
    engineRPM: number;
    vehicleSpeed: number;
    throttlePosition: number;
    brakePressure: number;
    steeringAngle: number;
    engineTemperature: number;
    fuelLevel: number;
    gearPosition: number;
    absActive: boolean;
    espActive: boolean;
}

function parseTimeWithAMPM(timeStr: string): { hours: number; minutes: number; seconds: number } {
    const [time, period] = timeStr.split(/(?=[AP]M)/);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    let hour24 = hours;

    if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
    }

    return { hours: hour24, minutes, seconds };
}

export async function parseGPSFile(filePath: string): Promise<GPSPoint[]> {
    try {
        logger.info(`Iniciando parseo de archivo GPS: ${filePath}`);
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());
        const points: GPSPoint[] = [];

        for (let i = 1; i < lines.length; i++) {
            const [date, time, lat, lon, alt, speed, satellites, accuracy] = lines[i].split(',');
            if (!date || !time || !lat || !lon) {
                logger.warn(`Línea ${i} ignorada por datos incompletos`);
                continue;
            }

            try {
                const [day, month, year] = date.split('/').map(Number);
                const { hours, minutes, seconds } = parseTimeWithAMPM(time);
                const dateObj = new Date(year, month - 1, day, hours, minutes, seconds);

                if (isNaN(dateObj.getTime())) {
                    logger.warn(`Línea ${i} ignorada por timestamp inválido: ${date} ${time}`);
                    continue;
                }

                points.push({
                    timestamp: dateObj,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    altitude: parseFloat(alt) || 0,
                    speed: parseFloat(speed) || 0,
                    heading: 0,
                    satellites: parseInt(satellites) || 0,
                    accuracy: parseFloat(accuracy) || 0
                });
            } catch (error: any) {
                logger.warn(`Error procesando línea ${i}: ${error.message}`);
                continue;
            }
        }

        logger.info(`Archivo GPS parseado: ${points.length} puntos encontrados`);
        return points;
    } catch (error) {
        logger.error('Error parsing GPS file:', error);
        throw new Error('Error parsing GPS file');
    }
}

export async function parseCANFile(filePath: string): Promise<CANFrame[]> {
    try {
        logger.info(`Iniciando parseo de archivo CAN: ${filePath}`);
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());
        const frames: CANFrame[] = [];
        let currentDate = '';

        // Buscar la fecha en las primeras líneas
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            if (lines[i].startsWith('CAN;')) {
                const parts = lines[i].split(';');
                if (parts.length >= 2) {
                    currentDate = parts[1].split(' ')[0];
                    break;
                }
            }
        }

        if (!currentDate) {
            logger.error('No se encontró la fecha en el archivo CAN');
            throw new Error('Fecha no encontrada en el archivo CAN');
        }

        const [day, month, year] = currentDate.split('/').map(Number);

        for (let i = 1; i < lines.length; i++) {
            const [timestamp, length, response, service, pid, rpm, speed, status] =
                lines[i].split(',');
            if (!timestamp || timestamp === 'Timestamp') {
                continue;
            }

            try {
                const { hours, minutes, seconds } = parseTimeWithAMPM(timestamp);
                const dateObj = new Date(year, month - 1, day, hours, minutes, seconds);

                if (isNaN(dateObj.getTime())) {
                    logger.warn(`Línea ${i} ignorada por timestamp inválido: ${timestamp}`);
                    continue;
                }

                if (rpm || speed) {
                    frames.push({
                        timestamp: dateObj,
                        engineRPM: parseFloat(rpm) || 0,
                        vehicleSpeed: parseFloat(speed) || 0,
                        throttlePosition: 0,
                        brakePressure: 0,
                        steeringAngle: 0,
                        engineTemperature: 0,
                        fuelLevel: 0,
                        gearPosition: 0,
                        absActive: false,
                        espActive: false
                    });
                }
            } catch (error: any) {
                logger.warn(`Error procesando línea ${i}: ${error.message}`);
                continue;
            }
        }

        logger.info(`Archivo CAN parseado: ${frames.length} frames encontrados`);
        return frames;
    } catch (error) {
        logger.error('Error parsing CAN file:', error);
        throw new Error('Error parsing CAN file');
    }
}
