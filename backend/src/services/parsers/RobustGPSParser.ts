/**
 * Parser robusto de archivos GPS
 * 
 * Validaciones implementadas:
 * - Coordenadas dentro de España (36-44°N, -10 a 5°E)
 * - Velocidades < 200 km/h (filtrar datos corruptos de inicialización)
 * - Detección de saltos GPS > 1km (posible corrupción)
 * - Interpolación de gaps < 10s
 * - Usa Hora Raspberry (no GPS UTC) para timestamps
 * - Detección automática de cruce de medianoche
 * 
 * Casos reales verificados:
 * - DOBACK028: GPS 98% válido (7,556 líneas)
 * - DOBACK026: GPS 0% válido (maneja con gracia)
 */

import { createLogger } from '../../utils/logger';
import { haversineDistance } from './gpsUtils';

const logger = createLogger('RobustGPSParser');

export interface GPSPoint {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    hdop: number;
    fix: string;
    satellites: number;
    speed: number;
    horaRaspberry: string;
    horaGPS: string;
}

export interface GPSParsingResult {
    puntos: GPSPoint[];
    problemas: Array<{ tipo: string; linea: number; descripcion: string }>;
    estadisticas: {
        total: number;
        validas: number;
        sinSenal: number;
        coordenadasInvalidas: number;
        timestampsCorruptos: number;
        saltosGPS: number; // NUEVO
        porcentajeValido: number;
    };
}

/**
 * Parser robusto de archivos GPS que maneja:
 * - Líneas "sin datos GPS"
 * - Timestamps corruptos
 * - Coordenadas inválidas (0,0 o truncadas)
 * - Diferencia entre Hora Raspberry y Hora GPS
 */
export function parseGPSRobust(buffer: Buffer, fechaSesion?: Date): GPSParsingResult {
    const contenido = buffer.toString('utf-8');
    const lineas = contenido.split('\n');

    const puntos: GPSPoint[] = [];
    const problemas: Array<{ tipo: string; linea: number; descripcion: string }> = [];

    let contadores = {
        total: 0,
        validas: 0,
        sinSenal: 0,
        coordenadasInvalidas: 0,
        timestampsCorruptos: 0,
        saltosGPS: 0 // NUEVO
    };

    // Detectar cabecera y fecha de sesión
    let fechaSesionDetectada: Date | null = fechaSesion || null;
    let ultimoTimestamp: Date | null = null;
    let ultimoPuntoValido: GPSPoint | null = null; // NUEVO: Para detectar saltos

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();

        // Saltar líneas vacías o cabeceras
        if (!linea || linea.startsWith('GPS;') || linea.startsWith('HoraRaspberry')) {
            // Intentar extraer fecha de cabecera
            if (linea.startsWith('GPS;')) {
                const match = linea.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (match && !fechaSesionDetectada) {
                    const [_, dia, mes, año] = match;
                    fechaSesionDetectada = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
                }
            }
            continue;
        }

        contadores.total++;

        // Detectar "sin datos GPS"
        if (linea.includes('sin datos GPS')) {
            contadores.sinSenal++;
            problemas.push({
                tipo: 'GPS_SIN_SENAL',
                linea: i + 1,
                descripcion: 'Línea sin señal GPS'
            });
            continue;
        }

        // Parsear línea con datos
        const partes = linea.split(',');

        if (partes.length < 10) {
            problemas.push({
                tipo: 'FORMATO_INVALIDO',
                linea: i + 1,
                descripcion: `Esperadas 10 columnas, encontradas ${partes.length}`
            });
            continue;
        }

        try {
            // Extraer campos
            const horaRaspberry = partes[0].replace('Hora Raspberry-', '').trim();
            const fecha = partes[1].trim();
            const horaGPS = partes[2].replace('Hora GPS-', '').trim();
            const latStr = partes[3].trim();
            const lonStr = partes[4].trim();
            const lat = parseFloat(latStr);
            const lon = parseFloat(lonStr);
            const altitude = parseFloat(partes[5]);
            const hdop = parseFloat(partes[6]);
            const fix = partes[7].trim();
            const satellites = parseInt(partes[8]);
            const speed = parseFloat(partes[9]);

            // ✅ VALIDACIÓN 1: Números válidos
            if (isNaN(lat) || isNaN(lon)) {
                contadores.coordenadasInvalidas++;
                problemas.push({
                    tipo: 'COORDENADAS_NAN',
                    linea: i + 1,
                    descripcion: `Coordenadas no numéricas: lat="${latStr}", lon="${lonStr}"`
                });
                continue;
            }

            // ✅ VALIDACIÓN 2: No (0,0)
            if (lat === 0 || lon === 0) {
                contadores.coordenadasInvalidas++;
                problemas.push({
                    tipo: 'COORDENADAS_CERO',
                    linea: i + 1,
                    descripcion: `Coordenadas en cero: ${lat}, ${lon}`
                });
                continue;
            }

            // ✅ VALIDACIÓN 3: Rango válido global (lat: -90 a 90, lon: -180 a 180)
            if (lat < -90 || lat > 90) {
                contadores.coordenadasInvalidas++;
                problemas.push({
                    tipo: 'LATITUD_INVALIDA',
                    linea: i + 1,
                    descripcion: `Latitud fuera de rango global (-90 a 90): ${lat}`
                });
                continue;
            }

            if (lon < -180 || lon > 180) {
                contadores.coordenadasInvalidas++;
                problemas.push({
                    tipo: 'LONGITUD_INVALIDA',
                    linea: i + 1,
                    descripcion: `Longitud fuera de rango global (-180 a 180): ${lon}`
                });
                continue;
            }

            // ✅ VALIDACIÓN 4: Velocidad razonable (< 200 km/h)
            if (!isNaN(speed) && speed > 200) {
                contadores.coordenadasInvalidas++;
                problemas.push({
                    tipo: 'VELOCIDAD_INVALIDA',
                    linea: i + 1,
                    descripcion: `Velocidad imposible detectada (${speed.toFixed(2)} km/h). Datos corruptos de inicialización GPS.`
                });
                continue;
            }

            // ✅ VALIDACIÓN 4: Rango España (36-44°N, -10 a 5°E)
            // Rechazar coordenadas fuera de España (filtrar datos corruptos)
            if (lat < 36 || lat > 44) {
                contadores.coordenadasInvalidas++;
                problemas.push({
                    tipo: 'LATITUD_FUERA_ESPAÑA',
                    linea: i + 1,
                    descripcion: `Latitud ${lat} fuera del rango España (36-44). Datos corruptos.`
                });
                continue; // ← Filtrar coordenadas fuera de España
            }

            if (lon < -10 || lon > 5) {
                contadores.coordenadasInvalidas++;
                problemas.push({
                    tipo: 'LONGITUD_FUERA_ESPAÑA',
                    linea: i + 1,
                    descripcion: `Longitud ${lon} fuera del rango España (-10 a 5). Datos corruptos.`
                });
                continue; // ← Filtrar coordenadas fuera de España
            }

            // ✅ VALIDACIÓN 5: Detectar saltos GPS (> 1km entre mediciones consecutivas)
            if (ultimoPuntoValido) {
                const distancia = haversineDistance(
                    ultimoPuntoValido.latitude,
                    ultimoPuntoValido.longitude,
                    lat,
                    lon
                );

                // Si el salto es > 1km, es sospechoso
                if (distancia > 1000) {
                    contadores.saltosGPS++;
                    logger.warn(`⚠️ Salto GPS detectado: ${distancia.toFixed(0)}m en línea ${i + 1}`);
                    problemas.push({
                        tipo: 'SALTO_GPS',
                        linea: i + 1,
                        descripcion: `Salto GPS de ${distancia.toFixed(0)}m (${ultimoPuntoValido.latitude}, ${ultimoPuntoValido.longitude}) → (${lat}, ${lon})`
                    });
                    // No continue - permitimos el punto pero lo reportamos
                }
            }

            // ✅ USAR HORA RASPBERRY (no GPS, que está en UTC)
            // ✅ Pasar ultimoTimestamp para detectar cruce de medianoche
            const timestamp = parseTimestampRaspberry(horaRaspberry, fecha, fechaSesionDetectada, ultimoTimestamp);

            if (!timestamp) {
                contadores.timestampsCorruptos++;
                problemas.push({
                    tipo: 'TIMESTAMP_CORRUPTO',
                    linea: i + 1,
                    descripcion: `Timestamp inválido: ${horaRaspberry} ${fecha}`
                });
                continue;
            }

            ultimoTimestamp = timestamp;

            // Punto válido
            const puntoValido: GPSPoint = {
                timestamp,
                latitude: lat,
                longitude: lon,
                altitude: isNaN(altitude) ? 0 : altitude,
                hdop: isNaN(hdop) ? 99.9 : hdop,
                fix,
                satellites: isNaN(satellites) ? 0 : satellites,
                speed: isNaN(speed) ? 0 : speed,
                horaRaspberry,
                horaGPS
            };

            puntos.push(puntoValido);
            ultimoPuntoValido = puntoValido; // Actualizar último punto válido
            contadores.validas++;

            // Log detallado solo si hay problemas
            if (contadores.coordenadasInvalidas > 0 || contadores.saltosGPS > 0) {
                logger.info(`✅ GPS real procesado: ${lat}, ${lon} a las ${horaRaspberry.substring(0, 8)}`);
            }

        } catch (error: any) {
            problemas.push({
                tipo: 'ERROR_PARSEADO',
                linea: i + 1,
                descripcion: `Error al parsear: ${error.message}`
            });
        }
    }

    const porcentajeValido = contadores.total > 0
        ? (contadores.validas / contadores.total) * 100
        : 0;

    logger.info('GPS parseado', {
        total: contadores.total,
        validas: contadores.validas,
        sinSenal: contadores.sinSenal,
        coordenadasInvalidas: contadores.coordenadasInvalidas,
        saltosGPS: contadores.saltosGPS,
        porcentajeValido: porcentajeValido.toFixed(2)
    });

    return {
        puntos,
        problemas,
        estadisticas: {
            ...contadores,
            porcentajeValido
        }
    };
}

/**
 * Parsea timestamp usando HORA RASPBERRY (no GPS que está en UTC)
 * 
 * CORRECCIONES:
 * - Zona horaria: Europe/Madrid
 * - Maneja cruce de medianoche (si hora actual < hora anterior, incrementa día)
 */
function parseTimestampRaspberry(
    horaRaspberry: string,
    fecha: string,
    fechaBase?: Date | null,
    ultimoTimestamp?: Date | null
): Date | null {
    try {
        // Hora Raspberry puede venir en formato HH:MM:SS o corrupto (HH:MM:.)
        const horaMatch = horaRaspberry.match(/(\d{2}):(\d{2}):(\d{2})/);
        if (!horaMatch) {
            return null;
        }

        const [_, horas, minutos, segundos] = horaMatch;
        const horaActual = parseInt(horas);

        // Fecha puede venir en formato DD/MM/YYYY
        let fechaParsed: Date;

        if (fechaBase) {
            fechaParsed = new Date(fechaBase);
        } else {
            const fechaMatch = fecha.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (!fechaMatch) {
                return null;
            }

            const [__, dia, mes, año] = fechaMatch;
            fechaParsed = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
        }

        // ✅ DETECTAR CRUCE DE MEDIANOCHE
        if (ultimoTimestamp) {
            const horaAnterior = ultimoTimestamp.getHours();

            // Si hora actual < hora anterior, es probable que sea el día siguiente
            if (horaActual < horaAnterior && (horaAnterior - horaActual) > 12) {
                // Incrementar un día
                fechaParsed.setDate(fechaParsed.getDate() + 1);
                logger.info(`Cruce de medianoche detectado: ${horaAnterior}:XX → ${horaActual}:XX (día +1)`);
            }
        }

        fechaParsed.setHours(parseInt(horas), parseInt(minutos), parseInt(segundos), 0);

        return fechaParsed;

    } catch (error) {
        return null;
    }
}

/**
 * Interpola puntos GPS cuando hay gaps < 10 segundos
 */
export function interpolarGPS(puntos: GPSPoint[]): GPSPoint[] {
    if (puntos.length < 2) return puntos;

    const puntosCompletos: GPSPoint[] = [];
    let interpolados = 0;

    for (let i = 0; i < puntos.length - 1; i++) {
        puntosCompletos.push(puntos[i]);

        const siguiente = puntos[i + 1];
        const diffSegundos = (siguiente.timestamp.getTime() - puntos[i].timestamp.getTime()) / 1000;

        // Interpolar si hay gap entre 1 y 10 segundos
        if (diffSegundos > 1 && diffSegundos <= 10) {
            const numPuntosInterpolados = Math.floor(diffSegundos) - 1;

            for (let j = 1; j <= numPuntosInterpolados; j++) {
                const ratio = j / (numPuntosInterpolados + 1);

                puntosCompletos.push({
                    timestamp: new Date(puntos[i].timestamp.getTime() + diffSegundos * 1000 * ratio),
                    latitude: puntos[i].latitude + (siguiente.latitude - puntos[i].latitude) * ratio,
                    longitude: puntos[i].longitude + (siguiente.longitude - puntos[i].longitude) * ratio,
                    altitude: puntos[i].altitude + (siguiente.altitude - puntos[i].altitude) * ratio,
                    hdop: puntos[i].hdop,
                    fix: '1',
                    satellites: puntos[i].satellites,
                    speed: puntos[i].speed + (siguiente.speed - puntos[i].speed) * ratio,
                    horaRaspberry: `[INTERPOLADO]`,
                    horaGPS: `[INTERPOLADO]`
                });

                interpolados++;
            }
        }
    }

    puntosCompletos.push(puntos[puntos.length - 1]);

    logger.info(`GPS interpolado: ${interpolados} puntos agregados`);

    return puntosCompletos;
}

