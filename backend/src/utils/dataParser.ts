import {
import { logger } from '../utils/logger';
    CANData,
    GPSData,
    SessionHeader,
    StabilityData,
    VehicleSession
} from '../types/vehicleData';

const parseHeader = (line: string): SessionHeader | null => {
    try {
        const [type, dateTime, vehicleId, sessionNumber, flags] = line.split(';');

        // Parsear la fecha en formato "DD/MM/YYYY HH:MM:SSAM/PM"
        const [datePart, timePart] = dateTime.trim().split(' ');
        const [day, month, year] = datePart.split('/');
        const [time, period] = timePart.split(/(?=[AP]M)/);
        const [hours, minutes, seconds] = time.split(':');

        let hour = parseInt(hours);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;

        // Validar que todos los componentes de la fecha sean números válidos
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        const minutesNum = parseInt(minutes);
        const secondsNum = parseInt(seconds);

        if (
            isNaN(yearNum) ||
            isNaN(monthNum) ||
            isNaN(dayNum) ||
            isNaN(hour) ||
            isNaN(minutesNum) ||
            isNaN(secondsNum)
        ) {
            logger.error('Componentes de fecha inválidos:', {
                year,
                month,
                day,
                hour,
                minutes,
                seconds
            });
            return null;
        }

        // Crear la fecha y validar que sea válida
        const timestamp = new Date(yearNum, monthNum - 1, dayNum, hour, minutesNum, secondsNum);
        if (isNaN(timestamp.getTime())) {
            logger.error('Fecha inválida creada:', timestamp);
            return null;
        }

        logger.info('Fecha parseada:', {
            original: dateTime,
            parsed: timestamp,
            components: {
                year: yearNum,
                month: monthNum,
                day: dayNum,
                hour,
                minutes: minutesNum,
                seconds: secondsNum
            }
        });

        return {
            type: type.trim(),
            timestamp,
            vehicleId: vehicleId.trim(),
            sessionNumber: sessionNumber?.trim() || '',
            flags: flags?.trim() || '',
            fileName: '',
            vehicleName: vehicleId.trim()
        };
    } catch (error) {
        logger.error('Error parsing header:', error);
        return null;
    }
};

const isLateralGForceHigh = (ax: number, ay: number): boolean => {
    const lateralG = Math.sqrt(ax * ax + ay * ay);
    return lateralG > 0.6;
};

const calculateLTR = (ax: number, ay: number, az: number): number => {
    // Simulación simplificada del LTR
    const lateralAccel = Math.sqrt(ax * ax + ay * ay);
    const verticalAccel = Math.abs(az);
    return 2.0 - lateralAccel / verticalAccel;
};

const isDRSHigh = (gx: number, gy: number, gz: number): boolean => {
    // Simulación de Dynamic Rollover Score
    const rotationRate = Math.sqrt(gx * gx + gy * gy + gz * gz);
    return rotationRate > 30;
};

export const parseStabilityData = (fileContent: string): VehicleSession<StabilityData>[] => {
    const lines = fileContent.split('\n').filter((line) => line.trim() !== '');
    const sessions: VehicleSession<StabilityData>[] = [];
    let currentSession: VehicleSession<StabilityData> | null = null;
    let columnHeaders: string[] = [];

    for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;

        // Parse header line
        if (line.startsWith('ESTABILIDAD;')) {
            const header = parseHeader(line);
            if (header) {
                if (currentSession) {
                    sessions.push(currentSession);
                }
                currentSession = {
                    header,
                    data: []
                };
            }
            continue;
        }

        // Parse column headers
        if (line.includes('ax; ay; az;')) {
            columnHeaders = line.split(';').map((h) => h.trim());
            continue;
        }

        // Skip timestamp lines (HH:MM:SSAM/PM format)
        if (line.match(/^\d{2}:\d{2}:\d{2}[AP]M$/)) {
            continue;
        }

        if (!currentSession) continue;

        // Parse data line
        const values = line.split(';').map((v) => v.trim());
        if (values.length < 18) continue; // Skip invalid lines

        // ✅ Validar y normalizar SI en rango [0,1]
        const siRaw = parseFloat(values[15]) || 0;
        const siNormalizado = Math.max(0, Math.min(1, siRaw));
        
        const data: StabilityData = {
            timestamp: new Date(),
            ax: parseFloat(values[0]) || 0,
            ay: parseFloat(values[1]) || 0,
            az: parseFloat(values[2]) || 0,
            gx: parseFloat(values[3]) || 0,
            gy: parseFloat(values[4]) || 0,
            gz: parseFloat(values[5]) || 0,
            roll: parseFloat(values[6]) || 0,
            pitch: parseFloat(values[7]) || 0,
            yaw: parseFloat(values[8]) || 0,
            timeantwifi: parseFloat(values[9]) || 0,
            usciclo1: parseFloat(values[10]) || 0,
            usciclo2: parseFloat(values[11]) || 0,
            usciclo3: parseFloat(values[12]) || 0,
            usciclo4: parseFloat(values[13]) || 0,
            usciclo5: parseFloat(values[14]) || 0,
            si: siNormalizado, // ✅ VALIDADO: clamped a [0,1]
            accmag: parseFloat(values[16]) || 0,
            microsds: parseFloat(values[17]) || 0,
            isLateralGForceHigh: false,
            isLTRCritical: false,
            isDRSHigh: false
        };

        // Calculate derived metrics
        data.isLateralGForceHigh = isLateralGForceHigh(data.ax, data.ay);
        data.isLTRCritical = calculateLTR(data.ax, data.ay, data.az) < 1.0;
        data.isDRSHigh = isDRSHigh(data.gx, data.gy, data.gz);

        currentSession.data.push(data);
    }

    if (currentSession) {
        sessions.push(currentSession);
    }

    return sessions;
};

export const parseCANData = (fileContent: string, fileName?: string): VehicleSession<CANData>[] => {
    const lines = fileContent.split('\n').filter((line) => line.trim() !== '');
    const sessions: VehicleSession<CANData>[] = [];
    let currentSession: VehicleSession<CANData> | null = null;
    let columnHeaders: string[] = [];
    let foundHeader = false;

    for (const line of lines) {
        const cleanLine = line.replace(/"/g, '').trim();
        if (!cleanLine) continue;

        // Nueva sesión CAN
        if (cleanLine.startsWith('CAN;')) {
            foundHeader = true;
            const [_, dateTime, vehicleName, sessionNumber, flags] = cleanLine.split(';');
            if (dateTime && vehicleName) {
                if (currentSession) {
                    sessions.push(currentSession);
                }

                // Parsear la fecha en formato "DD/MM/YYYY HH:MM:SSAM/PM"
                const [datePart, timePart] = dateTime.trim().split(' ');
                const [day, month, year] = datePart.split('/');
                const [time, period] = timePart.split(/(?=[AP]M)/);
                const [hours, minutes, seconds] = time.split(':');

                let hour = parseInt(hours);
                if (period === 'PM' && hour !== 12) hour += 12;
                if (period === 'AM' && hour === 12) hour = 0;

                const timestamp = new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day),
                    hour,
                    parseInt(minutes),
                    parseInt(seconds)
                );

                currentSession = {
                    header: {
                        type: 'CAN',
                        fileName:
                            fileName ||
                            `${vehicleName}_CAN_${dateTime.split(' ')[0].replace(/\//g, '-')}.csv`,
                        timestamp,
                        vehicleId: vehicleName,
                        vehicleName,
                        sessionNumber: sessionNumber || '',
                        flags: flags || ''
                    },
                    data: []
                };
            }
            continue;
        }

        if (!currentSession && !foundHeader) {
            // Crear sesión por defecto usando el nombre del archivo y la primera línea de datos
            const defaultVehicle = fileName
                ? fileName.split('_')[2]?.replace('.csv', '')
                : 'unknown';
            currentSession = {
                header: {
                    type: 'CAN',
                    fileName: fileName || '',
                    timestamp: new Date(),
                    vehicleId: defaultVehicle || 'unknown',
                    vehicleName: defaultVehicle || 'unknown',
                    sessionNumber: '',
                    flags: ''
                },
                data: []
            };
        }
        if (!currentSession) continue;

        // Procesar encabezados de columnas
        if (cleanLine.startsWith('Timestamp,length,response,service')) {
            columnHeaders = cleanLine.split(',').map((h) => h.trim());
            continue;
        }

        // Saltar metadatos y líneas vacías
        if (
            cleanLine.startsWith('#') ||
            cleanLine.startsWith('Protocolo') ||
            cleanLine.startsWith('Fecha de decodificación') ||
            cleanLine === ';;;;'
        ) {
            continue;
        }

        // Procesar línea de datos
        const values = cleanLine.split(',').map((v) => v.trim());
        if (values.length < 1 || !values[0].match(/\d{2}:\d{2}:\d{2}[AP]M/)) continue;

        try {
            // Extraer timestamp
            const timestamp = values[0];
            const [time, period] = timestamp.split(/(?=[AP]M)/);
            const [hours, minutes, seconds] = time.split(':').map(Number);
            const isPM = period === 'PM';
            const hour24 = isPM ? (hours % 12) + 12 : hours % 12;

            // Obtener la fecha del header de la sesión
            const sessionDate = currentSession.header.timestamp;
            const date = new Date(sessionDate);
            date.setHours(hour24, minutes, seconds);

            // Extraer valores de RPM, velocidad y temperatura
            const rpmIndex = columnHeaders.findIndex((h) => h.includes('EngineRPM'));
            const speedIndex = columnHeaders.findIndex((h) => h.includes('VehicleSpeed'));
            const tempIndex = columnHeaders.findIndex((h) => h.includes('FuelSystemStatus'));

            const rpm = rpmIndex >= 0 ? parseFloat(values[rpmIndex] || '0') : 0;
            const speed = speedIndex >= 0 ? parseFloat(values[speedIndex] || '0') : 0;
            const temp = tempIndex >= 0 ? parseFloat(values[tempIndex] || '0') : 0;

            const canData: CANData = {
                timestamp: date,
                engineRpm: rpm,
                vehicleSpeed: speed,
                engineLoad: 0,
                engineTemp: temp,
                alarms: []
            };

            currentSession.data.push(canData);
        } catch (error) {
            logger.error(`Error parsing CAN data line: ${cleanLine}`, error);
            continue;
        }
    }

    if (currentSession) {
        sessions.push(currentSession);
    }

    return sessions;
};

export const parseGPSData = (fileContent: string, fileName?: string): VehicleSession<GPSData>[] => {
    const lines = fileContent.split('\n').filter((line) => line.trim() !== '');
    const sessions: VehicleSession<GPSData>[] = [];
    let currentSession: VehicleSession<GPSData> | null = null;
    let foundHeader = false;

    for (const line of lines) {
        const cleanLine = line.replace(/"/g, '').trim();
        if (!cleanLine) continue;

        // Nueva sesión GPS
        if (cleanLine.startsWith('GPS;')) {
            foundHeader = true;
            const [_, dateTime, vehicleName, sessionNumber, flags] = cleanLine.split(';');
            if (dateTime && vehicleName) {
                if (currentSession) {
                    sessions.push(currentSession);
                }
                let timestamp: Date;
                try {
                    const [datePart, timePart] = dateTime.trim().split(' ');
                    const [day, month, year] = datePart.split('/');
                    const [time, period] = timePart.split(/(?=[AP]M)/);
                    const [hours, minutes, seconds] = time.split(':');
                    let hour = parseInt(hours);
                    if (period === 'PM' && hour !== 12) hour += 12;
                    if (period === 'AM' && hour === 12) hour = 0;
                    timestamp = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day),
                        hour,
                        parseInt(minutes),
                        parseInt(seconds)
                    );
                    if (isNaN(timestamp.getTime())) throw new Error('Fecha inválida');
                } catch (e) {
                    logger.error('Error parseando fecha GPS header:', dateTime, e);
                    timestamp = new Date(0);
                }
                currentSession = {
                    header: {
                        type: 'GPS',
                        fileName:
                            fileName ||
                            `${vehicleName}_GPS_${dateTime.split(' ')[0].replace(/\//g, '-')}.csv`,
                        timestamp,
                        vehicleId: vehicleName,
                        vehicleName,
                        sessionNumber: sessionNumber || '',
                        flags: flags || ''
                    },
                    data: []
                };
            }
            continue;
        }

        if (!currentSession && !foundHeader) {
            // Crear sesión por defecto usando el nombre del archivo y la primera línea de datos
            const defaultVehicle = fileName
                ? fileName.split('_')[2]?.replace('.csv', '')
                : 'unknown';

            // Intentar obtener timestamp de la primera línea de datos
            let defaultTimestamp = new Date();
            const firstDataLine = lines.find((line) => {
                const values = line.split(',').map((v) => v.trim());
                return values.length >= 8 && values[0].match(/\d{2}\/\d{2}\/\d{4}/);
            });

            if (firstDataLine) {
                try {
                    const [dateStr, timeStr] = firstDataLine.split(',').map((v) => v.trim());
                    const [day, month, year] = dateStr.split('/').map(Number);
                    const [time, period] = timeStr.split(/(?=[AP]M)/);
                    const [hours, minutes, seconds] = time.split(':').map(Number);
                    const isPM = period === 'PM';
                    const hour24 = isPM ? (hours % 12) + 12 : hours % 12;
                    defaultTimestamp = new Date(year, month - 1, day, hour24, minutes, seconds);
                } catch (e) {
                    logger.error('Error parseando fecha GPS por defecto:', e);
                }
            }

            currentSession = {
                header: {
                    type: 'GPS',
                    fileName: fileName || '',
                    timestamp: defaultTimestamp,
                    vehicleId: defaultVehicle || 'unknown',
                    vehicleName: defaultVehicle || 'unknown',
                    sessionNumber: '',
                    flags: ''
                },
                data: []
            };
        }
        if (!currentSession) continue;

        // Procesar línea de datos GPS
        const values = cleanLine.split(',').map((v) => v.trim());
        if (values.length < 8) continue;

        try {
            const [dateStr, timeStr, lat, lon, alt, speed, satellites, quality] = values;
            const [day, month, year] = dateStr.split('/').map(Number);
            const [time, period] = timeStr.split(/(?=[AP]M)/);
            const [hours, minutes, seconds] = time.split(':').map(Number);
            const isPM = period === 'PM';
            const hour24 = isPM ? (hours % 12) + 12 : hours % 12;
            const date = new Date(year, month - 1, day, hour24, minutes, seconds);

            const gpsData: GPSData = {
                timestamp: date,
                latitude: parseFloat(lat),
                longitude: parseFloat(lon),
                altitude: parseFloat(alt),
                speed: parseFloat(speed),
                heading: 0,
                quality: parseInt(quality, 10),
                satellites: parseInt(satellites, 10),
                alarms: []
            };

            currentSession.data.push(gpsData);
        } catch (error) {
            logger.error(`Error parsing GPS data line: ${cleanLine}`, error);
            continue;
        }
    }

    if (currentSession) {
        sessions.push(currentSession);
    }

    return sessions;
};
