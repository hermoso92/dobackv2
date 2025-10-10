import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { TokenPayload } from '../types/auth';
import { logger } from '../utils/logger';
import { parseCANFile, parseGPSFile, parseRotativoFile, parseStabilityFile, synchronizeTimestamps } from '../utils/sessionParsers';
import { processAndSaveStabilityEvents } from './StabilityEventService';

const prisma = new PrismaClient();

// Helper function to get timestamp as number regardless of input type
function getTimestamp(timestamp: string | Date): number {
    if (timestamp instanceof Date) {
        return timestamp.getTime();
    } else {
        return parseTimestamp(timestamp).getTime();
    }
}

// Helper function to parse timestamps in multiple formats
function parseTimestamp(timestampStr: string): Date {
    try {
        // Try direct parsing first
        let date = new Date(timestampStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        // dd/mm/yyyy hh:mm:ss or MM/dd/yyyy hh:mm:ss
        const match1 = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/);
        if (match1) {
            const [, part1, part2, year, hour, minute, second] = match1;
            // Try both interpretations: DD/MM and MM/DD
            const dateOption1 = new Date(parseInt(year), parseInt(part2) - 1, parseInt(part1), parseInt(hour), parseInt(minute), parseInt(second));
            const dateOption2 = new Date(parseInt(year), parseInt(part1) - 1, parseInt(part2), parseInt(hour), parseInt(minute), parseInt(second));

            // Return the one that seems more reasonable (check if day is > 12 to determine format)
            if (parseInt(part1) > 12) {
                return dateOption1; // Must be DD/MM
            } else if (parseInt(part2) > 12) {
                return dateOption2; // Must be MM/DD
            } else {
                // Ambiguous, default to MM/DD for CAN files
                return dateOption2;
            }
        }

        // MM/dd/yyyy hh:mm:ssAM/PM format (Estabilidad)
        const match2 = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/);
        if (match2) {
            const [, month, day, year, hour, minute, second, ampm] = match2;
            let hour24 = parseInt(hour);
            if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
            if (ampm === 'AM' && hour24 === 12) hour24 = 0;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
        }

        // dd/mm/yyyy,hh:mm:ss format (GPS)
        const match3 = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),(\d{1,2}):(\d{2}):(\d{2})$/);
        if (match3) {
            const [, day, month, year, hour, minute, second] = match3;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        }

        // If all else fails, return current date with a warning
        logger.warn(`⚠️ No se pudo parsear timestamp: "${timestampStr}", usando fecha actual`);
        return new Date();
    } catch (error) {
        logger.warn(`⚠️ Error parseando timestamp: "${timestampStr}", usando fecha actual`);
        return new Date();
    }
}

interface ProcessingResult {
    success: boolean;
    sessionId?: string;
    sessionNumber?: number;
    vehicleName?: string;
    dataInserted: {
        stability: number;
        can: number;
        gps: number;
        rotativo: number;
    };
    eventsGenerated: number;
    corrections: {
        applied: boolean;
        discarded: {
            CAN: number;
            GPS: number;
            ESTABILIDAD: number;
            ROTATIVO: number;
        };
    };
    error?: string;
    warnings?: string[];
}

interface SessionFiles {
    stabilityFile: string;
    canFile?: string;
    gpsFile?: string;
    rotativoFile?: string;
}

export class BulkProcessingService {
    /**
     * Procesa una sesión completa usando la lógica del procesador manual
     * pero adaptada para archivos del sistema de archivos
     */
    async processSessionFromFiles(
        vehicleId: string,
        sessionFiles: SessionFiles,
        user: TokenPayload
    ): Promise<ProcessingResult> {
        try {
            logger.info('🔧 Iniciando procesamiento de sesión desde archivos', {
                vehicleId,
                files: Object.keys(sessionFiles),
                user: user.id
            });

            // Validar que vehicleId y organizationId no sean null ni undefined
            if (!vehicleId) {
                logger.error('vehicleId es null o undefined');
                return {
                    success: false,
                    dataInserted: { stability: 0, can: 0, gps: 0, rotativo: 0 },
                    eventsGenerated: 0,
                    corrections: { applied: false, discarded: { CAN: 0, GPS: 0, ESTABILIDAD: 0, ROTATIVO: 0 } },
                    error: 'vehicleId es null o undefined'
                };
            }
            if (!user.organizationId) {
                logger.error('organizationId es null o undefined');
                return {
                    success: false,
                    dataInserted: { stability: 0, can: 0, gps: 0, rotativo: 0 },
                    eventsGenerated: 0,
                    corrections: { applied: false, discarded: { CAN: 0, GPS: 0, ESTABILIDAD: 0, ROTATIVO: 0 } },
                    error: 'organizationId es null o undefined'
                };
            }

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: user.organizationId
                }
            });

            if (!vehicle) {
                logger.warn('Vehículo no encontrado o no autorizado', { vehicleId, organizationId: user.organizationId });
                return {
                    success: false,
                    dataInserted: { stability: 0, can: 0, gps: 0, rotativo: 0 },
                    eventsGenerated: 0,
                    corrections: { applied: false, discarded: { CAN: 0, GPS: 0, ESTABILIDAD: 0, ROTATIVO: 0 } },
                    error: 'Vehículo no encontrado o no autorizado'
                };
            }

            // Verificar que existe el archivo de estabilidad (obligatorio)
            if (!fs.existsSync(sessionFiles.stabilityFile)) {
                logger.warn('Archivo de Estabilidad no encontrado', { file: sessionFiles.stabilityFile });
                return {
                    success: false,
                    dataInserted: { stability: 0, can: 0, gps: 0, rotativo: 0 },
                    eventsGenerated: 0,
                    corrections: { applied: false, discarded: { CAN: 0, GPS: 0, ESTABILIDAD: 0, ROTATIVO: 0 } },
                    error: 'Archivo de Estabilidad no encontrado'
                };
            }

            // Leer archivos
            const stabilityBuffer = fs.readFileSync(sessionFiles.stabilityFile);
            const canBuffer = sessionFiles.canFile && fs.existsSync(sessionFiles.canFile) ? fs.readFileSync(sessionFiles.canFile) : null;
            const gpsBuffer = sessionFiles.gpsFile && fs.existsSync(sessionFiles.gpsFile) ? fs.readFileSync(sessionFiles.gpsFile) : null;
            const rotativoBuffer = sessionFiles.rotativoFile && fs.existsSync(sessionFiles.rotativoFile) ? fs.readFileSync(sessionFiles.rotativoFile) : null;

            logger.info('📁 Archivos leídos', {
                stabilitySize: stabilityBuffer.length,
                canSize: canBuffer?.length,
                gpsSize: gpsBuffer?.length,
                rotativoSize: rotativoBuffer?.length
            });

            // Parsear archivos con correcciones del fixed processor
            const descartes: Record<string, any[]> = { CAN: [], GPS: [], ESTABILIDAD: [], ROTATIVO: [] };

            logger.info('🔧 Iniciando parseo con correcciones del fixed processor');

            // Parsear archivos
            const gpsData = gpsBuffer ? parseGPSFile(gpsBuffer, descartes) : [];
            const stabilityData = stabilityBuffer ? parseStabilityFile(stabilityBuffer, descartes) : [];
            const canData = canBuffer ? parseCANFile(canBuffer, descartes) : [];
            const rotativoData = rotativoBuffer ? parseRotativoFile(rotativoBuffer, descartes) : [];

            // Sincronizar timestamps entre GPS y Estabilidad
            const { gpsData: syncedGpsData, stabilityData: syncedStabilityData } = synchronizeTimestamps(gpsData, stabilityData);

            logger.info(`📊 Archivos parseados: ${syncedGpsData.length} GPS, ${syncedStabilityData.length} Estabilidad, ${canData.length} CAN, ${rotativoData.length} Rotativo`);

            // Obtener timestamps globales
            const timestamps = [
                ...stabilityData.map(d => getTimestamp(d.timestamp)),
                ...canData.map(d => getTimestamp(d.timestamp)),
                ...gpsData.map(d => getTimestamp(d.timestamp)),
                ...rotativoData.map(d => getTimestamp(d.timestamp))
            ].filter(Boolean);

            if (timestamps.length === 0) {
                logger.error('No se encontraron timestamps válidos en los datos');
                return {
                    success: false,
                    dataInserted: { stability: 0, can: 0, gps: 0, rotativo: 0 },
                    eventsGenerated: 0,
                    corrections: { applied: false, discarded: { CAN: 0, GPS: 0, ESTABILIDAD: 0, ROTATIVO: 0 } },
                    error: 'No se encontraron datos válidos en los archivos'
                };
            }

            const startTime = new Date(Math.min(...timestamps));
            const endTime = new Date(Math.max(...timestamps));

            logger.info(`📅 Rango temporal de la sesión: ${startTime.toISOString()} - ${endTime.toISOString()}`);

            // Obtener el último número de sesión para este vehículo
            const lastSession = await prisma.session.findFirst({
                where: { vehicleId: vehicle.id },
                orderBy: { sessionNumber: 'desc' }
            });

            const sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

            // Crear sesión
            const session = await prisma.session.create({
                data: {
                    vehicleId: vehicle.id,
                    userId: user.id,
                    organizationId: user.organizationId,
                    startTime,
                    endTime,
                    sessionNumber,
                    sequence: 1,
                    updatedAt: new Date()
                }
            });

            logger.info(`✅ Sesión creada: ${session.id}`);

            // Insertar datos GPS
            if (syncedGpsData.length > 0) {
                logger.info(`📍 Insertando ${syncedGpsData.length} puntos GPS`);

                const gpsInserts = syncedGpsData.map(data => ({
                    sessionId: session.id,
                    timestamp: data.timestamp,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    altitude: data.altitude,
                    speed: data.speed,
                    satellites: data.satellites || 0,
                    hdop: data.hdop || null,
                    fix: data.fix?.toString() || null,
                    heading: data.heading || null,
                    accuracy: data.accuracy || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                await prisma.gpsMeasurement.createMany({
                    data: gpsInserts,
                    skipDuplicates: true
                });
            }

            // Insertar datos de estabilidad
            if (syncedStabilityData.length > 0) {
                logger.info(`⚖️ Insertando ${syncedStabilityData.length} puntos de estabilidad`);

                const stabilityInserts = syncedStabilityData
                    .filter(data => {
                        // Validar que todos los campos requeridos estén presentes
                        const requiredFields = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];
                        const hasAllFields = requiredFields.every(field =>
                            (data as any)[field] !== undefined && (data as any)[field] !== null
                        );

                        if (!hasAllFields) {
                            logger.warn(`⚠️ Datos de estabilidad incompletos en BulkProcessing, omitiendo: ${JSON.stringify(data)}`);
                            return false;
                        }

                        return true;
                    })
                    .map(data => ({
                        sessionId: session.id,
                        timestamp: new Date(data.timestamp),
                        ax: Number(data.ax),
                        ay: Number(data.ay),
                        az: Number(data.az),
                        gx: Number(data.gx),
                        gy: Number(data.gy),
                        gz: Number(data.gz),
                        si: data.si ? Number(data.si) : 0,
                        accmag: data.accmag ? Number(data.accmag) : 0,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }));

                if (stabilityInserts.length > 0) {
                    await prisma.stabilityMeasurement.createMany({
                        data: stabilityInserts,
                        skipDuplicates: true
                    });
                }

                logger.info(`Guardados ${stabilityInserts.length} registros de estabilidad (filtrados de ${syncedStabilityData.length} total)`);
            }

            // Insertar datos CAN
            if (canData.length > 0) {
                logger.info(`🚗 Insertando ${canData.length} frames CAN`);

                const canInserts = canData.map(data => ({
                    sessionId: session.id,
                    timestamp: typeof data.timestamp === 'string' ? parseTimestamp(data.timestamp) : new Date(data.timestamp),
                    engineRpm: data.engineRpm,
                    vehicleSpeed: data.vehicleSpeed,
                    fuelSystemStatus: data.fuelSystemStatus,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                await prisma.canMeasurement.createMany({
                    data: canInserts,
                    skipDuplicates: true
                });
            }

            // Insertar datos rotativo
            if (rotativoData.length > 0) {
                logger.info(`🔄 Insertando ${rotativoData.length} puntos rotativo`);

                const rotativoInserts = rotativoData.map(data => ({
                    sessionId: session.id,
                    timestamp: typeof data.timestamp === 'string' ? parseTimestamp(data.timestamp) : data.timestamp,
                    state: data.state.toString(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                await prisma.rotativoMeasurement.createMany({
                    data: rotativoInserts,
                    skipDuplicates: true
                });
            }

            // Generar eventos de estabilidad automáticamente si hay datos de estabilidad
            let eventsCount = 0;
            if (syncedStabilityData.length > 0) {
                try {
                    logger.info('⚙️ Generando eventos de estabilidad automáticamente...');

                    // Convertir datos al formato esperado
                    const stabilityDataForEvents = syncedStabilityData.map(data => {
                        const timestamp = typeof data.timestamp === 'string' ? new Date(data.timestamp) : data.timestamp;
                        // Validar timestamp antes de usar toISOString
                        if (!timestamp || isNaN(timestamp.getTime())) {
                            return null;
                        }
                        return {
                            timestamp: timestamp.toISOString(),
                            si: data.si,
                            roll: 0, // Los datos parseados no incluyen roll/pitch, usar 0
                            pitch: 0,
                            ay: data.ay,
                            gz: data.gz,
                            time: timestamp.getTime(),
                            accmag: data.accmag
                        };
                    }).filter((item): item is NonNullable<typeof item> => item !== null);

                    const gpsDataForEvents = syncedGpsData.map(data => {
                        const timestamp = typeof data.timestamp === 'string' ? new Date(data.timestamp) : data.timestamp;
                        // Validar timestamp antes de usar toISOString
                        if (!timestamp || isNaN(timestamp.getTime())) {
                            return null;
                        }
                        return {
                            timestamp: timestamp.toISOString(),
                            latitude: data.latitude,
                            longitude: data.longitude,
                            speed: data.speed
                        };
                    }).filter((item): item is NonNullable<typeof item> => item !== null);

                    const canDataForEvents = canData.map(data => {
                        const timestamp = typeof data.timestamp === 'string' ? parseTimestamp(data.timestamp) : new Date(data.timestamp);
                        // Validar timestamp antes de usar toISOString
                        if (!timestamp || isNaN(timestamp.getTime())) {
                            return null;
                        }
                        return {
                            timestamp: timestamp.toISOString(),
                            engineRPM: data.engineRpm,
                            vehicleSpeed: data.vehicleSpeed,
                            rotativo: data.engineRpm > 0
                        };
                    }).filter((item): item is NonNullable<typeof item> => item !== null);

                    // Procesar y guardar eventos
                    await processAndSaveStabilityEvents(
                        session.id,
                        stabilityDataForEvents,
                        gpsDataForEvents,
                        canDataForEvents
                    );

                    // Contar eventos generados
                    eventsCount = await prisma.stability_events.count({
                        where: { session_id: session.id }
                    });

                    logger.info(`✅ Eventos de estabilidad generados: ${eventsCount}`);

                } catch (eventError) {
                    logger.error('⚠️ Error generando eventos de estabilidad (continuando):', eventError);
                    // No fallar la subida por errores en eventos
                }
            }

            logger.info('🎉 Procesamiento de sesión completado exitosamente', {
                sessionId: session.id,
                sessionNumber: session.sessionNumber,
                vehicleId: vehicle.name,
                dataInserted: {
                    stability: syncedStabilityData.length,
                    can: canData.length,
                    gps: syncedGpsData.length,
                    rotativo: rotativoData.length
                },
                eventsGenerated: eventsCount,
                descartes: {
                    CAN: descartes.CAN.length,
                    GPS: descartes.GPS.length,
                    ESTABILIDAD: descartes.ESTABILIDAD.length,
                    ROTATIVO: descartes.ROTATIVO.length
                }
            });

            return {
                success: true,
                sessionId: session.id,
                sessionNumber: session.sessionNumber,
                vehicleName: vehicle.name,
                dataInserted: {
                    stability: syncedStabilityData.length,
                    can: canData.length,
                    gps: syncedGpsData.length,
                    rotativo: rotativoData.length
                },
                eventsGenerated: eventsCount,
                corrections: {
                    applied: true,
                    discarded: {
                        CAN: descartes.CAN.length,
                        GPS: descartes.GPS.length,
                        ESTABILIDAD: descartes.ESTABILIDAD.length,
                        ROTATIVO: descartes.ROTATIVO.length
                    }
                }
            };

        } catch (error) {
            logger.error('Error en processSessionFromFiles:', error);
            return {
                success: false,
                dataInserted: { stability: 0, can: 0, gps: 0, rotativo: 0 },
                eventsGenerated: 0,
                corrections: { applied: false, discarded: { CAN: 0, GPS: 0, ESTABILIDAD: 0, ROTATIVO: 0 } },
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Escanea la carpeta datosDoback y agrupa archivos por vehículo y sesión
     */
    async scanDataFolder(dataFolderPath?: string): Promise<{
        organizations: Record<string, {
            vehicles: Record<string, {
                sessions: Record<string, {
                    files: SessionFiles;
                    missing: string[];
                    warnings: string[];
                    timeRange: { start: string; end: string } | null;
                }>;
            }>;
        }>
    }> {
        const basePath = path.resolve(__dirname, '../../data/datosDoback');
        const folderPath = dataFolderPath ? path.resolve(dataFolderPath) : basePath;
        const organizations: Record<string, {
            vehicles: Record<string, {
                sessions: Record<string, {
                    files: SessionFiles;
                    missing: string[];
                    warnings: string[];
                    timeRange: { start: string; end: string } | null;
                }>;
            }>;
        }> = {};
        const { parseStabilityFile, parseCANFile, parseGPSFile, parseRotativoFile } = require('../utils/sessionParsers');
        const pythonPath = 'python';
        const decodificadorPath = path.resolve(__dirname, '../../data/DECODIFICADOR CAN/decodificador_can_unificado.py');

        try {
            if (!fs.existsSync(folderPath)) {
                logger.warn(`Carpeta de datos no encontrada: ${folderPath}`);
                return { organizations };
            }

            // Escanear organizaciones (carpetas principales)
            const organizationDirs = fs.readdirSync(folderPath, { withFileTypes: true })
                .filter((dirent: fs.Dirent) => dirent.isDirectory());

            for (const orgDir of organizationDirs) {
                const orgPath = path.join(folderPath, orgDir.name);
                organizations[orgDir.name] = { vehicles: {} };

                // Escanear vehículos (subcarpetas)
                const vehicleDirs = fs.readdirSync(orgPath, { withFileTypes: true })
                    .filter((dirent: fs.Dirent) => dirent.isDirectory());

                for (const vehicleDir of vehicleDirs) {
                    const vehiclePath = path.join(orgPath, vehicleDir.name);
                    organizations[orgDir.name].vehicles[vehicleDir.name] = { sessions: {} };

                    // Buscar archivos en subcarpetas por tipo
                    const tipoDirs = ['estabilidad', 'CAN', 'GPS', 'ROTATIVO'];
                    const archivosPorTipo: Record<string, string[]> = {
                        ESTABILIDAD: [],
                        CAN: [],
                        GPS: [],
                        ROTATIVO: []
                    };
                    for (const tipo of tipoDirs) {
                        const tipoPath = path.join(vehiclePath, tipo);
                        if (fs.existsSync(tipoPath) && fs.statSync(tipoPath).isDirectory()) {
                            const files = fs.readdirSync(tipoPath, { withFileTypes: true })
                                .filter((dirent: fs.Dirent) => dirent.isFile() && dirent.name.endsWith('.txt'))
                                .map((dirent: fs.Dirent) => path.join(tipoPath, dirent.name));
                            switch (tipo.toUpperCase()) {
                                case 'ESTABILIDAD': archivosPorTipo.ESTABILIDAD.push(...files); break;
                                case 'CAN': archivosPorTipo.CAN.push(...files); break;
                                case 'GPS': archivosPorTipo.GPS.push(...files); break;
                                case 'ROTATIVO': archivosPorTipo.ROTATIVO.push(...files); break;
                            }
                        }
                    }

                    // Paso previo: traducir archivos CAN crudos a _TRADUCIDO.csv
                    const canCrudos = archivosPorTipo.CAN.filter(f => !f.endsWith('_TRADUCIDO.csv'));
                    for (const canFile of canCrudos) {
                        const traducido = canFile.replace(/\.txt$/i, '_TRADUCIDO.csv');
                        if (!fs.existsSync(traducido)) {
                            logger.info(`Traduciendo archivo CAN: ${canFile}`);
                            const result = spawnSync(pythonPath, [decodificadorPath, canFile], { encoding: 'utf-8' });
                            if (result.error || result.status !== 0) {
                                logger.error(`Error traduciendo CAN: ${canFile}`, { error: result.error, stderr: result.stderr });
                            } else {
                                logger.info(`Archivo CAN traducido: ${traducido}`);
                            }
                        }
                    }
                    archivosPorTipo.CAN = archivosPorTipo.CAN.filter(f => f.endsWith('_TRADUCIDO.csv'));

                    // 1. Parsear todos los archivos y extraer metadatos (tipo, inicio, fin, etc)
                    type ArchivoSesion = { tipo: string, file: string, start: Date, end: Date, rawStart: any, rawEnd: any, desfase?: number };
                    const fragmentos: ArchivoSesion[] = [];
                    const descartes: any = { ESTABILIDAD: [], CAN: [], GPS: [], ROTATIVO: [] };

                    // ESTABILIDAD
                    for (const file of archivosPorTipo.ESTABILIDAD) {
                        try {
                            const buffer = fs.readFileSync(file);
                            const data = parseStabilityFile(buffer, descartes);
                            if (data.length > 0) {
                                const startDate = new Date(data[0].timestamp);
                                const endDate = new Date(data[data.length - 1].timestamp);
                                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                    fragmentos.push({
                                        tipo: 'ESTABILIDAD',
                                        file,
                                        start: startDate,
                                        end: endDate,
                                        rawStart: data[0].timestamp,
                                        rawEnd: data[data.length - 1].timestamp
                                    });
                                } else {
                                    logger.warn('Fecha inválida en ESTABILIDAD', { file, rawStart: data[0].timestamp, rawEnd: data[data.length - 1].timestamp });
                                    descartes.ESTABILIDAD.push({ file, motivo: 'Fecha inválida' });
                                }
                            }
                        } catch (e) { logger.warn('Error parseando estabilidad', { file, e }); }
                    }
                    // CAN
                    for (const file of archivosPorTipo.CAN) {
                        try {
                            const buffer = fs.readFileSync(file);
                            const data = parseCANFile(buffer, descartes);
                            if (data.length > 0) {
                                const startDate = new Date(data[0].timestamp);
                                const endDate = new Date(data[data.length - 1].timestamp);
                                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                    fragmentos.push({
                                        tipo: 'CAN',
                                        file,
                                        start: startDate,
                                        end: endDate,
                                        rawStart: data[0].timestamp,
                                        rawEnd: data[data.length - 1].timestamp
                                    });
                                } else {
                                    logger.warn('Fecha inválida en CAN', { file, rawStart: data[0].timestamp, rawEnd: data[data.length - 1].timestamp });
                                    descartes.CAN.push({ file, motivo: 'Fecha inválida' });
                                }
                            }
                        } catch (e) { logger.warn('Error parseando CAN', { file, e }); }
                    }
                    // GPS (con detección de desfase)
                    for (const file of archivosPorTipo.GPS) {
                        try {
                            const buffer = fs.readFileSync(file);
                            const data = parseGPSFile(buffer, descartes);
                            if (data.length > 0) {
                                let start = new Date(data[0].timestamp);
                                let end = new Date(data[data.length - 1].timestamp);
                                let desfaseDetectado = 0;
                                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                    // Buscar fragmento de estabilidad más cercano
                                    const est = fragmentos.filter(f => f.tipo === 'ESTABILIDAD');
                                    if (est.length > 0) {
                                        // Buscar desfase horario más probable (1h, 2h, 3h)
                                        const diffs = [1, 2, 3].map(h => Math.abs((start.getTime() + h * 3600000) - est[0].start.getTime()));
                                        const minDiff = Math.min(...diffs);
                                        const idx = diffs.indexOf(minDiff);
                                        if (minDiff < 3600000) { // Si el desfase es menor a 1h tras ajuste
                                            desfaseDetectado = [1, 2, 3][idx];
                                            start = new Date(start.getTime() + desfaseDetectado * 3600000);
                                            end = new Date(end.getTime() + desfaseDetectado * 3600000);
                                        }
                                    }
                                    fragmentos.push({
                                        tipo: 'GPS',
                                        file,
                                        start,
                                        end,
                                        rawStart: data[0].timestamp,
                                        rawEnd: data[data.length - 1].timestamp,
                                        desfase: desfaseDetectado
                                    });
                                } else {
                                    logger.warn('Fecha inválida en GPS', { file, rawStart: data[0].timestamp, rawEnd: data[data.length - 1].timestamp });
                                    descartes.GPS.push({ file, motivo: 'Fecha inválida' });
                                }
                            }
                        } catch (e) { logger.warn('Error parseando GPS', { file, e }); }
                    }
                    // ROTATIVO
                    for (const file of archivosPorTipo.ROTATIVO) {
                        try {
                            const buffer = fs.readFileSync(file);
                            const data = parseRotativoFile(buffer, descartes);
                            if (data.length > 0) {
                                const startDate = new Date(data[0].timestamp);
                                const endDate = new Date(data[data.length - 1].timestamp);
                                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                    fragmentos.push({
                                        tipo: 'ROTATIVO',
                                        file,
                                        start: startDate,
                                        end: endDate,
                                        rawStart: data[0].timestamp,
                                        rawEnd: data[data.length - 1].timestamp
                                    });
                                } else {
                                    logger.warn('Fecha inválida en ROTATIVO', { file, rawStart: data[0].timestamp, rawEnd: data[data.length - 1].timestamp });
                                    descartes.ROTATIVO.push({ file, motivo: 'Fecha inválida' });
                                }
                            }
                        } catch (e) { logger.warn('Error parseando ROTATIVO', { file, e }); }
                    }

                    // 2. Agrupar fragmentos por solapamiento real de tiempo (permitir sesiones incompletas)
                    fragmentos.sort((a, b) => a.start.getTime() - b.start.getTime());
                    const sesiones: ArchivoSesion[][] = [];
                    for (const frag of fragmentos) {
                        let added = false;
                        for (const grupo of sesiones) {
                            if (grupo.some(f => !(frag.end < f.start || frag.start > f.end))) {
                                grupo.push(frag);
                                added = true;
                                break;
                            }
                        }
                        if (!added) sesiones.push([frag]);
                    }

                    // 3. Para cada grupo, armar el objeto SessionFiles + advertencias
                    let idx = 1;
                    for (const grupo of sesiones) {
                        const files: Partial<SessionFiles> = {};
                        const warnings: string[] = [];
                        const tipos = ['ESTABILIDAD', 'CAN', 'GPS', 'ROTATIVO'];
                        let desfaseGps = 0;
                        for (const frag of grupo) {
                            switch (frag.tipo) {
                                case 'ESTABILIDAD': files.stabilityFile = frag.file; break;
                                case 'CAN': files.canFile = frag.file; break;
                                case 'GPS': files.gpsFile = frag.file; if (frag.desfase) desfaseGps = frag.desfase; break;
                                case 'ROTATIVO': files.rotativoFile = frag.file; break;
                            }
                        }
                        const missing = tipos.filter(t => {
                            switch (t) {
                                case 'ESTABILIDAD': return !files.stabilityFile;
                                case 'CAN': return !files.canFile;
                                case 'GPS': return !files.gpsFile;
                                case 'ROTATIVO': return !files.rotativoFile;
                            }
                        });
                        if (desfaseGps) warnings.push(`Desfase horario GPS detectado: +${desfaseGps}h`);
                        if (missing.length > 0) warnings.push('Sesión incompleta: faltan archivos ' + missing.join(', '));
                        // Calcular rango temporal global
                        const allTimes = grupo.flatMap(f => [f.start.getTime(), f.end.getTime()]);
                        const timeRange = { start: new Date(Math.min(...allTimes)).toISOString(), end: new Date(Math.max(...allTimes)).toISOString() };
                        organizations[orgDir.name].vehicles[vehicleDir.name].sessions[`auto_${idx}`] = {
                            files: files as SessionFiles,
                            missing,
                            warnings,
                            timeRange
                        };
                        idx++;
                    }
                }
            }

            logger.info('📁 Escaneo de carpeta de datos completado (agrupación real por tiempo, robusto)', {
                organizations: Object.keys(organizations).length,
                totalVehicles: Object.values(organizations).reduce((acc, org) =>
                    acc + Object.keys(org.vehicles).length, 0),
                totalSessions: Object.values(organizations).reduce((acc, org) =>
                    acc + Object.values(org.vehicles).reduce((acc2, vehicle) =>
                        acc2 + Object.keys(vehicle.sessions).length, 0), 0)
            });

        } catch (error) {
            logger.error('Error escaneando carpeta de datos:', error);
        }

        return { organizations };
    }
} 