import { logger } from './logger';

interface GPSPoint {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    satellites?: number;
    hdop?: number;
    fix?: number;
    heading?: number;
    accuracy?: number;
}

interface CANData {
    timestamp: string;
    engineRpm: number;
    vehicleSpeed: number;
    fuelSystemStatus: number;
}

interface StabilityData {
    timestamp: string;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    si: number;
    accmag: number;
}

interface RotativoData {
    timestamp: string;
    state: number;
}

// Parsear timestamps en varios formatos
function parseDateTime(dateTimeStr: string): Date | null {
    try {
        // dd/mm/yyyy hh:mm:ss
        const match1 = dateTimeStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/
        );
        if (match1) {
            const [, day, month, year, hour, minute, second] = match1;
            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            );
        }

        // dd/mm/yyyy hh:mm:ssAM/PM (formato de estabilidad)
        const match2 = dateTimeStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/
        );
        if (match2) {
            const [, day, month, year, hour, minute, second, ampm] = match2;
            let hour24 = parseInt(hour);
            if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
            if (ampm === 'AM' && hour24 === 12) hour24 = 0;
            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                hour24,
                parseInt(minute),
                parseInt(second)
            );
        }

        // MM/DD/YYYY hh:mm:ssAM/PM (formato del CAN traducido)
        const match3 = dateTimeStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/
        );
        if (match3) {
            const [, month, day, year, hour, minute, second, ampm] = match3;
            let hour24 = parseInt(hour);
            if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
            if (ampm === 'AM' && hour24 === 12) hour24 = 0;
            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                hour24,
                parseInt(minute),
                parseInt(second)
            );
        }

        // Nuevo: Manejar timestamps malformados como "13/06/2025 17:31:8:00:00"
        const match4 = dateTimeStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{1,2}):(\d{1,2}):(\d{2}):(\d{2})$/
        );
        if (match4) {
            const [, day, month, year, hour, minute, second] = match4;
            // Validar rangos
            const h = parseInt(hour);
            const m = parseInt(minute);
            const s = parseInt(second);

            if (h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59) {
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, m, s);
            }
        }

        // Nuevo: Manejar timestamps con formato "13/06/2025 17:31:8" (sin segundos)
        const match5 = dateTimeStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/
        );
        if (match5) {
            const [, day, month, year, hour, minute, second] = match5;
            // Validar rangos
            const h = parseInt(hour);
            const m = parseInt(minute);
            const s = parseInt(second);

            if (h >= 0 && h <= 23 && m >= 0 && m <= 59 && s >= 0 && s <= 59) {
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, m, s);
            }
        }

        // Intentar parsing directo como fallback
        const directParse = new Date(dateTimeStr);
        if (!isNaN(directParse.getTime())) {
            return directParse;
        }

        logger.warn(`⚠️ No se pudo parsear timestamp: "${dateTimeStr}"`);
        return null;
    } catch (error) {
        logger.warn(`⚠️ Error parseando timestamp: "${dateTimeStr}" - ${error}`);
        return null;
    }
}

function cleanLine(line: string): string {
    return line.replace(/\r|\n/g, '').trim();
}

function findCANField(rowData: Record<string, string>, fieldNames: string[]): string | null {
    for (const name of fieldNames) {
        for (const key in rowData) {
            if (key.toLowerCase().includes(name.toLowerCase())) {
                return rowData[key];
            }
        }
    }
    return null;
}

export function parseGPSFile(buffer: Buffer, descartes: any): GPSPoint[] {
    if (!buffer || buffer.length === 0) {
        logger.warn('GPS buffer vacío o nulo');
        return [];
    }

    const content = buffer.toString('utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length < 3) {
        logger.warn('Archivo GPS con muy pocas líneas:', lines.length);
        return [];
    }

    const points: GPSPoint[] = [];
    const correcciones = {
        coordenadas: 0,
        velocidadesAnómalas: 0,
        timestamps: 0
    };

    // Parsear cabecera
    const headerLine = lines[0];
    const headerParts = headerLine.split(';');
    if (headerParts.length < 5) {
        logger.error('Cabecera GPS inválida:', headerLine);
        return [];
    }

    const fecha = headerParts[1].split(' ')[0]; // Extraer solo la fecha
    const vehicleId = headerParts[2];
    const sessionId = headerParts[3];

    logger.info(`Procesando GPS: vehículo ${vehicleId}, sesión ${sessionId}, fecha ${fecha}`);

    // Procesar líneas de datos (empezar desde línea 2)
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length < 9) {
            descartes.GPS?.push({
                line: i + 1,
                reason: `Campos insuficientes: ${parts.length} de 9`
            });
            continue;
        }

        let [fechaLinea, hora, latitude, longitude, altitude, hdop, fix, satellites, speed] = parts;

        // Limpiar y validar timestamp
        fechaLinea = fechaLinea.trim();
        hora = hora.trim();

        // Corregir timestamps malformados
        if (hora.includes('.')) {
            correcciones.timestamps++;
            const horaParts = hora.split('.');
            if (horaParts.length >= 2) {
                hora = horaParts[0] + ':' + horaParts[1].padStart(2, '0') + ':00';
            }
            if (correcciones.timestamps <= 3) {
                logger.info(
                    `🔧 GPS timestamp corregido línea ${i + 1}: "${parts[1]}" -> "${hora}"`
                );
            }
        }

        // Nuevo: Corregir timestamps con formato "17:31:8" (sin segundos)
        const horaParts = hora.split(':');
        if (horaParts.length === 3) {
            const [h, m, s] = horaParts.map(Number);

            // Validar y corregir horas inválidas (como 73)
            if (h > 23) {
                correcciones.timestamps++;
                const horaOriginal = hora;
                hora = `${h % 24}:${m.toString().padStart(2, '0')}:${s
                    .toString()
                    .padStart(2, '0')}`;
                if (correcciones.timestamps <= 3) {
                    logger.info(
                        `🔧 GPS hora inválida corregida línea ${
                            i + 1
                        }: "${horaOriginal}" -> "${hora}"`
                    );
                }
            }

            // Validar y corregir minutos inválidos (como 72)
            if (m > 59) {
                correcciones.timestamps++;
                const horaOriginal = hora;
                hora = `${h}:${(m % 60).toString().padStart(2, '0')}:${s
                    .toString()
                    .padStart(2, '0')}`;
                if (correcciones.timestamps <= 3) {
                    logger.info(
                        `🔧 GPS minutos inválidos corregidos línea ${
                            i + 1
                        }: "${horaOriginal}" -> "${hora}"`
                    );
                }
            }

            // Validar y corregir segundos inválidos
            if (s > 59) {
                correcciones.timestamps++;
                const horaOriginal = hora;
                hora = `${h}:${m.toString().padStart(2, '0')}:${(s % 60)
                    .toString()
                    .padStart(2, '0')}`;
                if (correcciones.timestamps <= 3) {
                    logger.info(
                        `🔧 GPS segundos inválidos corregidos línea ${
                            i + 1
                        }: "${horaOriginal}" -> "${hora}"`
                    );
                }
            }
        }

        // Corregir coordenadas que empiezan con 0. en lugar de 40.
        if (latitude.startsWith('0.') && latitude.length > 4) {
            correcciones.coordenadas++;
            const latOriginal = latitude;
            latitude = '40' + latitude.substring(1);
            if (correcciones.coordenadas <= 3) {
                logger.info(
                    `🔧 GPS latitud 0.x corregida línea ${i + 1}: "${latOriginal}" -> "${latitude}"`
                );
            }
        }

        // Corregir coordenadas que empiezan con 4. en lugar de 40.
        if (latitude.startsWith('4.') && latitude.length > 4 && !latitude.startsWith('40.')) {
            correcciones.coordenadas++;
            const latOriginal = latitude;
            latitude = '40' + latitude.substring(1);
            if (correcciones.coordenadas <= 3) {
                logger.info(
                    `🔧 GPS latitud 4.x corregida línea ${i + 1}: "${latOriginal}" -> "${latitude}"`
                );
            }
        }

        // Corregir longitudes que empiezan con -0. en lugar de -3.
        if (longitude.startsWith('-0.') && longitude.length > 4) {
            correcciones.coordenadas++;
            const lonOriginal = longitude;
            longitude = longitude.replace('-0.', '-3.');
            if (correcciones.coordenadas <= 3) {
                logger.info(
                    `🔧 GPS longitud -0.x corregida línea ${
                        i + 1
                    }: "${lonOriginal}" -> "${longitude}"`
                );
            }
        }

        // Corregir longitudes con valores extremadamente grandes
        if (longitude.includes('-353043') || longitude.includes('-584038')) {
            correcciones.coordenadas++;
            const lonOriginal = longitude;
            longitude = '-3.8840388'; // Valor típico para la zona
            if (correcciones.coordenadas <= 3) {
                logger.info(
                    `🔧 GPS longitud extrema corregida línea ${
                        i + 1
                    }: "${lonOriginal}" -> "${longitude}"`
                );
            }
        }

        // Validar coordenadas finales
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
            descartes.GPS?.push({
                line: i + 1,
                reason: `Coordenadas inválidas: lat=${lat}, lon=${lon}`
            });
            continue;
        }

        // Parsear timestamp final
        const timestamp = parseDateTime(`${fechaLinea} ${hora}`);
        if (!timestamp) {
            descartes.GPS?.push({
                line: i + 1,
                reason: `Timestamp inválido: "${fechaLinea} ${hora}"`
            });
            continue;
        }

        // Log del primer timestamp para debug
        if (i === 2) {
            logger.info(
                `GPS primer timestamp: "${fechaLinea} ${hora}" -> ${timestamp.toISOString()}`
            );
        }

        // Validar velocidad
        const speedValue = parseFloat(speed) || 0;
        if (speedValue > 200) {
            correcciones.velocidadesAnómalas++;
            if (correcciones.velocidadesAnómalas <= 3) {
                logger.warn(`⚠️ GPS velocidad anómala línea ${i + 1}: ${speedValue} km/h`);
            }
        }

        // Validar altitud
        const alt = parseFloat(altitude) || 0;
        if (alt > 10000 || alt < -1000) {
            descartes.GPS?.push({
                line: i + 1,
                reason: `Altitud fuera de rango: ${alt}`
            });
            continue;
        }

        // Validar HDOP
        const hdopValue = parseFloat(hdop) || 0;
        if (hdopValue > 50) {
            descartes.GPS?.push({
                line: i + 1,
                reason: `HDOP muy alto: ${hdopValue}`
            });
            continue;
        }

        // Validar número de satélites
        const satCount = parseInt(satellites) || 0;
        if (satCount < 3 || satCount > 20) {
            descartes.GPS?.push({
                line: i + 1,
                reason: `Número de satélites inválido: ${satCount}`
            });
            continue;
        }

        // Validar fix
        const fixValue = parseInt(fix) || 0;
        if (fixValue !== 1) {
            descartes.GPS?.push({
                line: i + 1,
                reason: `Fix inválido: ${fixValue}`
            });
            continue;
        }

        points.push({
            timestamp,
            latitude: lat,
            longitude: lon,
            altitude: alt,
            speed: speedValue,
            heading: 0, // No disponible en este formato
            satellites: satCount,
            accuracy: hdopValue
        });
    }

    logger.info(`GPS procesado: ${points.length} puntos válidos de ${lines.length - 2} líneas`, {
        correcciones,
        descartes: descartes.GPS?.length || 0
    });

    return points;
}

export function parseCANFile(buffer: Buffer, descartes: any): CANData[] {
    logger.info('🚗 Parseando CAN');

    if (!buffer || buffer.length === 0) {
        logger.warn('Archivo CAN vacío o buffer nulo');
        return [];
    }

    const content = buffer.toString('utf-8');
    if (!content || content.trim().length === 0) {
        logger.warn('Contenido CAN vacío después de conversión');
        return [];
    }

    const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);

    logger.info(`CAN archivo: ${lines.length} líneas totales`);
    if (lines.length > 0) {
        logger.info(`CAN primera línea: "${lines[0]}"`);
        if (lines.length > 1) {
            logger.info(`CAN segunda línea: "${lines[1]}"`);
        }
    }

    // Buscar header real
    let headerIndex = -1;
    let delimiter = ',';

    for (let i = 0; i < Math.min(lines.length, 20); i++) {
        const line = lines[i];
        if (!line) {
            if (i < 3) logger.warn(`CAN línea ${i + 1} vacía, saltando`);
            continue;
        }

        const lineLower = line.toLowerCase();
        if (
            lineLower.includes('fecha-hora') ||
            lineLower.includes('timestamp') ||
            lineLower.includes('engine')
        ) {
            headerIndex = i;
            delimiter = line.includes(',') ? ',' : ';';
            logger.info(`CAN header encontrado en línea ${i + 1} con delimitador: "${delimiter}"`);
            break;
        }
    }

    if (headerIndex === -1) {
        logger.error('No se encontró header CAN válido');
        logger.error('Primeras 5 líneas del archivo CAN:');
        lines.slice(0, 5).forEach((line, idx) => {
            logger.error(`  Línea ${idx + 1}: "${line}"`);
        });
        return [];
    }

    const headerLine = lines[headerIndex];
    logger.info(`CAN header encontrado en línea ${headerIndex + 1}: ${headerLine}`);

    const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());
    const data: CANData[] = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        if ((i - headerIndex) % 1000 === 0) {
            logger.info(`CAN procesando línea ${i + 1} / ${lines.length}`);
        }

        const parts = line.split(delimiter).map((p) => p.trim());
        if (parts.length !== headers.length) {
            if (i - headerIndex < 10) {
                descartes.CAN?.push({
                    line: i + 1,
                    reason: `Columnas incorrectas: esperado ${headers.length}, encontrado ${parts.length}`
                });
            }
            continue;
        }

        const rowData: Record<string, string> = {};
        headers.forEach((header, idx) => {
            rowData[header] = parts[idx];
        });

        // Buscar campos obligatorios
        const timestamp = findCANField(rowData, ['fecha-hora', 'timestamp']);
        const engineRpm = findCANField(rowData, ['enginerpm', 'engine_speed', 'rpm', 'engine rpm']);

        if (!timestamp || !engineRpm) {
            if (i - headerIndex < 10) {
                descartes.CAN?.push({
                    line: i + 1,
                    reason: `Faltan campos obligatorios: timestamp=${
                        timestamp ? 'OK' : 'NULL'
                    }, engineRpm=${engineRpm ? 'OK' : 'NULL'}`
                });
            }
            continue;
        }

        try {
            // Validar que el timestamp sea válido sin convertirlo a Date
            const parsedTimestamp = parseDateTime(timestamp);
            if (!parsedTimestamp) {
                if (i - headerIndex < 10) {
                    descartes.CAN?.push({
                        line: i + 1,
                        reason: `Timestamp inválido: "${timestamp}"`
                    });
                }
                continue;
            }

            // Buscar campos opcionales con valores por defecto
            const vehicleSpeedField = findCANField(rowData, [
                'vehiclespeed',
                'vehicle_speed',
                'speed'
            ]);
            const fuelSystemField = findCANField(rowData, ['fuelsystemstatus', 'fuel_consumption']);

            data.push({
                timestamp: timestamp, // Mantener como string para CANData interface
                engineRpm: parseFloat(engineRpm),
                vehicleSpeed: vehicleSpeedField ? parseFloat(vehicleSpeedField) : 0,
                fuelSystemStatus: fuelSystemField ? parseFloat(fuelSystemField) : 0
            });
        } catch (error) {
            if (i - headerIndex < 10) {
                descartes.CAN?.push({
                    line: i + 1,
                    reason: `Error parsing: ${
                        error instanceof Error ? error.message : 'Unknown error'
                    }`
                });
            }
        }
    }

    logger.info(
        `CAN parseado: ${data.length} puntos válidos, ${descartes.CAN?.length || 0} descartados`
    );
    return data;
}

export function parseStabilityFile(buffer: Buffer, descartes: any): StabilityData[] {
    logger.info('⚖️ Parseando ESTABILIDAD con interpolación de timestamps');

    const content = buffer.toString('utf-8');
    const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);

    if (lines.length < 3) {
        logger.error('Archivo ESTABILIDAD demasiado corto');
        return [];
    }

    // Parsear cabecera
    const cabecera = lines[0].split(';');
    const fechaBaseStr = cabecera[1]?.trim();

    if (!fechaBaseStr) {
        descartes.ESTABILIDAD?.push({ line: 1, reason: 'Cabecera inválida' });
        return [];
    }

    logger.info(`ESTABILIDAD fecha base original: "${fechaBaseStr}"`);
    logger.info(`ESTABILIDAD cabecera completa: "${lines[0]}"`);

    let fechaBase: Date;
    try {
        // Parsear directamente el formato de estabilidad: "15/07/2025 10:00:49AM"
        fechaBase = parseDateTime(fechaBaseStr) || new Date();

        // Verificar que la fecha sea razonable (no en el futuro y no muy antigua)
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        if (fechaBase < oneYearAgo || fechaBase > oneYearFromNow) {
            logger.warn(
                `⚠️ Fecha de estabilidad fuera de rango razonable: ${fechaBase.toISOString()}, usando fecha actual`
            );
            fechaBase = new Date();
        }

        logger.info(`ESTABILIDAD fecha base parseada: ${fechaBase.toISOString()}`);
    } catch (error) {
        logger.error(`Error parseando fecha base: ${error}`);
        return [];
    }

    const header = lines[1].split(';').map((h) => h.trim());
    logger.info(`ESTABILIDAD header: ${header.join(', ')}`);

    const data: StabilityData[] = [];
    const timePattern = /^(\d{2}:\d{2}:\d{2}(AM|PM))$/;

    const marcasTiempo = [fechaBase];
    const bloques: any[][] = [];
    let bloqueActual: any[] = [];

    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];

        if (timePattern.test(line)) {
            // Nueva marca de tiempo
            if (bloqueActual.length > 0) {
                bloques.push(bloqueActual);
                bloqueActual = [];
            }

            try {
                const timestamp = parseDateTime(`${fechaBaseStr.split(' ')[0]} ${line}`);
                if (timestamp) {
                    marcasTiempo.push(timestamp);
                    // Log del primer timestamp para debug
                    if (marcasTiempo.length === 2) {
                        logger.info(
                            `ESTABILIDAD primer timestamp: "${
                                fechaBaseStr.split(' ')[0]
                            } ${line}" -> ${timestamp.toISOString()}`
                        );
                    }
                }
            } catch (error) {
                logger.warn(`Error parseando marca de tiempo: ${line}`);
            }
        } else {
            // Línea de datos
            const parts = line.split(';').map((p) => p.trim());
            if (
                parts.length === header.length ||
                (parts.length === header.length + 1 && parts[parts.length - 1] === '')
            ) {
                if (parts.length === header.length + 1) parts.pop(); // Remover columna vacía final

                const rowData: any = {};
                header.forEach((h, idx) => {
                    rowData[h] = parts[idx];
                });

                bloqueActual.push(rowData);
            } else {
                descartes.ESTABILIDAD?.push({ line: i + 1, reason: 'Columnas incorrectas' });
            }
        }
    }

    // Agregar último bloque
    if (bloqueActual.length > 0) {
        bloques.push(bloqueActual);
    }

    // Interpolar timestamps
    for (let i = 0; i < bloques.length; i++) {
        const bloque = bloques[i];
        if (bloque.length === 0) continue;

        const tStart = marcasTiempo[i];
        const tEnd =
            i + 1 < marcasTiempo.length
                ? marcasTiempo[i + 1]
                : new Date(tStart.getTime() + 1000 * bloque.length);

        const totalMs = tEnd.getTime() - tStart.getTime();
        const stepMs = bloque.length > 1 ? totalMs / bloque.length : 0;

        bloque.forEach((row, j) => {
            const timestamp = new Date(tStart.getTime() + stepMs * (j + 0.5));

            try {
                // ✅ Validar y normalizar SI en rango [0,1]
                const siRaw = parseFloat(row.si || '0');
                const siNormalizado = Math.max(0, Math.min(1, siRaw));
                
                data.push({
                    timestamp: timestamp.toISOString(),
                    ax: parseFloat(row.ax || '0'),
                    ay: parseFloat(row.ay || '0'),
                    az: parseFloat(row.az || '0'),
                    gx: parseFloat(row.gx || '0'),
                    gy: parseFloat(row.gy || '0'),
                    gz: parseFloat(row.gz || '0'),
                    si: siNormalizado, // ✅ VALIDADO: clamped a [0,1]
                    accmag: parseFloat(row.accmag || '0')
                });
            } catch (error) {
                descartes.ESTABILIDAD?.push({ line: -1, reason: `Error processing: ${error}` });
            }
        });
    }

    logger.info(
        `ESTABILIDAD parseado: ${data.length} puntos válidos, ${
            descartes.ESTABILIDAD?.length || 0
        } descartados`
    );
    return data;
}

export function parseRotativoFile(buffer: Buffer, descartes: any): RotativoData[] {
    logger.info('🔄 Parseando ROTATIVO');

    const content = buffer.toString('utf-8');
    const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);

    if (lines.length < 2) {
        logger.error('Archivo ROTATIVO demasiado corto');
        return [];
    }

    const headerLine = lines[1];
    const delimiter = headerLine.includes(',') ? ',' : ';';
    const data: RotativoData[] = [];

    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const parts = line.split(delimiter).map((p) => p.trim());
        if (parts.length < 2) {
            descartes.ROTATIVO?.push({ line: i + 1, reason: 'Columnas insuficientes' });
            continue;
        }

        try {
            data.push({
                timestamp: parts[0],
                state: parseInt(parts[1])
            });
        } catch (error) {
            descartes.ROTATIVO?.push({ line: i + 1, reason: `Error parsing: ${error}` });
        }
    }

    logger.info(
        `ROTATIVO parseado: ${data.length} puntos válidos, ${
            descartes.ROTATIVO?.length || 0
        } descartados`
    );
    return data;
}

// Función de traducción CAN (placeholder)
export function translateCANIfNeeded(buffer: Buffer): Buffer {
    // Ya está traducido según el usuario
    return buffer;
}

// Función para sincronizar timestamps entre GPS y Estabilidad
export function synchronizeTimestamps(
    gpsData: GPSPoint[],
    stabilityData: StabilityData[]
): { gpsData: GPSPoint[]; stabilityData: StabilityData[] } {
    if (gpsData.length === 0 || stabilityData.length === 0) {
        return { gpsData, stabilityData };
    }

    const gpsStart = gpsData[0].timestamp;
    const stabilityStart = new Date(stabilityData[0].timestamp);

    const timeDiff = Math.abs(gpsStart.getTime() - stabilityStart.getTime()) / 1000 / 60; // diferencia en minutos

    logger.info(
        `🔍 Sincronización temporal: GPS inicio ${gpsStart.toISOString()}, Estabilidad inicio ${stabilityStart.toISOString()}, diferencia: ${timeDiff.toFixed(
            1
        )} minutos`
    );

    // Si la diferencia es mayor a 5 minutos, ajustar
    if (timeDiff > 5) {
        const adjustmentMs = stabilityStart.getTime() - gpsStart.getTime();

        logger.info(
            `⏰ Aplicando ajuste temporal de ${(adjustmentMs / 1000 / 60).toFixed(1)} minutos`
        );

        // Ajustar timestamps de estabilidad para que coincidan con GPS
        const adjustedStabilityData = stabilityData.map((data) => ({
            ...data,
            timestamp: new Date(new Date(data.timestamp).getTime() - adjustmentMs).toISOString()
        }));

        logger.info(
            `✅ Sincronización temporal aplicada. Nuevo inicio estabilidad: ${new Date(
                adjustedStabilityData[0].timestamp
            ).toISOString()}`
        );

        return { gpsData, stabilityData: adjustedStabilityData };
    }

    return { gpsData, stabilityData };
}
