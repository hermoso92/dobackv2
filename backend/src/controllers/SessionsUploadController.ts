
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import { processAndSaveStabilityEvents } from '../services/StabilityEventService';
import { TokenPayload } from '../types/auth';
import { logger } from '../utils/logger';
import {
    parseCANFile,
    parseGPSFile,
    parseRotativoFile,
    parseStabilityFile,
    synchronizeTimestamps
} from '../utils/sessionParsers';



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
        const date = new Date(timestampStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        // dd/mm/yyyy hh:mm:ss or MM/dd/yyyy hh:mm:ss
        const match1 = timestampStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/
        );
        if (match1) {
            const [, part1, part2, year, hour, minute, second] = match1;
            // Try both interpretations: DD/MM and MM/DD
            const dateOption1 = new Date(
                parseInt(year),
                parseInt(part2) - 1,
                parseInt(part1),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            );
            const dateOption2 = new Date(
                parseInt(year),
                parseInt(part1) - 1,
                parseInt(part2),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            );

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
        const match2 = timestampStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/
        );
        if (match2) {
            const [, month, day, year, hour, minute, second, ampm] = match2;
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

        // dd/mm/yyyy,hh:mm:ss format (GPS)
        const match3 = timestampStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}),(\d{1,2}):(\d{2}):(\d{2})$/
        );
        if (match3) {
            const [, day, month, year, hour, minute, second] = match3;
            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute),
                parseInt(second)
            );
        }

        // If all else fails, return current date with a warning
        logger.warn(`⚠️ No se pudo parsear timestamp: "${timestampStr}", usando fecha actual`);
        return new Date();
    } catch (error) {
        logger.warn(`⚠️ Error parseando timestamp: "${timestampStr}", usando fecha actual`);
        return new Date();
    }
}

interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

interface DiagnosticIssue {
    type: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    details: string;
}

export class SessionsUploadController {
    async uploadSessionData(req: AuthenticatedRequest, res: Response) {
        try {
            logger.info('Iniciando uploadSessionData', {
                body: req.body,
                files: req.files,
                user: req.user
            });

            const { vehicleId } = req.body;
            const files = req.files as Record<string, any>;

            if (!vehicleId) {
                logger.warn('Intento de subida sin vehicleId');
                return res.status(400).json({ error: 'Falta vehicleId' });
            }

            if (!req.user?.organizationId) {
                logger.warn('Intento de subida sin organizationId');
                return res.status(400).json({ error: 'Usuario no tiene organización asignada' });
            }

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: req.user.organizationId
                }
            });

            if (!vehicle) {
                logger.warn('Vehículo no encontrado o no autorizado', { vehicleId });
                return res.status(404).json({ error: 'Vehículo no encontrado o no autorizado' });
            }

            // Obtener archivos
            const stabilityFile = files.stabilityFile ? files.stabilityFile[0] : null;
            const canFile = files.canFile ? files.canFile[0] : null;
            const gpsFile = files.gpsFile ? files.gpsFile[0] : null;
            const rotativoFile = files.rotativoFile ? files.rotativoFile[0] : null;

            const stabilityBuffer = stabilityFile ? fs.readFileSync(stabilityFile.path) : null;
            const canBuffer = canFile ? fs.readFileSync(canFile.path) : null;
            const gpsBuffer = gpsFile ? fs.readFileSync(gpsFile.path) : null;
            const rotativoBuffer = rotativoFile ? fs.readFileSync(rotativoFile.path) : null;

            logger.info('Archivos recibidos', {
                stabilitySize: stabilityBuffer?.length,
                canSize: canBuffer?.length,
                gpsSize: gpsBuffer?.length,
                rotativoSize: rotativoBuffer?.length
            });

            // Parsear archivos con correcciones del fixed processor
            const descartes: Record<string, any[]> = {
                CAN: [],
                GPS: [],
                ESTABILIDAD: [],
                ROTATIVO: []
            };

            logger.info('🔧 Iniciando parseo con correcciones del fixed processor');

            // Parsear archivos
            logger.info('📁 Iniciando parseo de archivos...');

            // Parsear archivos con logging detallado
            logger.info('🔍 Iniciando parseo de archivos...');

            const gpsData = gpsBuffer ? parseGPSFile(gpsBuffer, descartes) : [];
            logger.info('🔍 GPS parseado:', {
                puntos: gpsData.length,
                descartes: descartes.GPS?.length || 0,
                primerasLineas: gpsBuffer ? gpsBuffer.toString('utf-8').split('\n').slice(0, 3) : []
            });

            const stabilityData = stabilityBuffer
                ? parseStabilityFile(stabilityBuffer, descartes)
                : [];
            logger.info('🔍 Estabilidad parseada:', {
                puntos: stabilityData.length,
                descartes: descartes.ESTABILIDAD?.length || 0,
                primerasLineas: stabilityBuffer ? stabilityBuffer.toString('utf-8').split('\n').slice(0, 3) : []
            });

            const canData = canBuffer ? parseCANFile(canBuffer, descartes) : [];
            logger.info('🔍 CAN parseado:', {
                puntos: canData.length,
                descartes: descartes.CAN?.length || 0
            });

            const rotativoData = rotativoBuffer ? parseRotativoFile(rotativoBuffer, descartes) : [];
            logger.info('🔍 Rotativo parseado:', {
                puntos: rotativoData.length,
                descartes: descartes.ROTATIVO?.length || 0,
                primerasLineas: rotativoBuffer ? rotativoBuffer.toString('utf-8').split('\n').slice(0, 3) : []
            });

            // Sincronizar timestamps entre GPS y Estabilidad
            const { gpsData: syncedGpsData, stabilityData: syncedStabilityData } =
                synchronizeTimestamps(gpsData, stabilityData);

            logger.info(
                `📊 Archivos parseados: ${syncedGpsData.length} GPS, ${syncedStabilityData.length} Estabilidad, ${canData.length} CAN, ${rotativoData.length} Rotativo`
            );

            logger.info('📊 Datos parseados con correcciones', {
                stabilityCount: stabilityData.length,
                canCount: canData.length,
                gpsCount: gpsData.length,
                rotativoCount: rotativoData.length,
                descartesCount: {
                    CAN: descartes.CAN.length,
                    GPS: descartes.GPS.length,
                    ESTABILIDAD: descartes.ESTABILIDAD.length,
                    ROTATIVO: descartes.ROTATIVO.length
                }
            });

            // Obtener timestamps globales de forma eficiente

            let minTimestamp: number | null = null;
            let maxTimestamp: number | null = null;
            const allData = [stabilityData, canData, gpsData, rotativoData];
            for (const arr of allData) {
                for (const d of arr) {
                    const ts = getTimestamp(d.timestamp);
                    if (!isNaN(ts)) {
                        if (minTimestamp === null || ts < minTimestamp) minTimestamp = ts;
                        if (maxTimestamp === null || ts > maxTimestamp) maxTimestamp = ts;
                    }
                }
            }
            if (minTimestamp === null || maxTimestamp === null) {
                logger.error('No se encontraron timestamps válidos en los datos');
                return res
                    .status(400)
                    .json({ error: 'No se encontraron datos válidos en los archivos' });
            }
            const startTime = new Date(minTimestamp);
            const endTime = new Date(maxTimestamp);

            logger.info(
                `📅 Rango temporal de la sesión: ${startTime.toISOString()} - ${endTime.toISOString()}`
            );

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
                    userId: req.user.id,
                    organizationId: req.user.organizationId,
                    startTime,
                    endTime,
                    sessionNumber,
                    sequence: 1,
                    updatedAt: new Date(),
                    source: 'manual' // O ajusta según lógica de origen
                }
            });

            logger.info(`✅ Sesión creada: ${session.id}`);

            // Insertar datos GPS
            if (syncedGpsData.length > 0) {
                logger.info(`📍 Insertando ${syncedGpsData.length} puntos GPS`);

                for (let i = 0; i < syncedGpsData.length; i += 1000) {
                    const batch = syncedGpsData.slice(i, i + 1000).map((data) => ({
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
                        data: batch,
                        skipDuplicates: true
                    });
                }
            }

            // Insertar datos de estabilidad
            if (syncedStabilityData.length > 0) {
                logger.info(`⚖️ Insertando ${syncedStabilityData.length} puntos de estabilidad`);

                for (let i = 0; i < syncedStabilityData.length; i += 1000) {
                    const batch = syncedStabilityData
                        .slice(i, i + 1000)
                        .filter((data) => {
                            // Validar que todos los campos requeridos estén presentes
                            const requiredFields = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];
                            const hasAllFields = requiredFields.every(
                                (field) =>
                                    (data as any)[field] !== undefined &&
                                    (data as any)[field] !== null
                            );

                            if (!hasAllFields) {
                                logger.warn(
                                    `⚠️ Datos de estabilidad incompletos, omitiendo: ${JSON.stringify(
                                        data
                                    )}`
                                );
                                return false;
                            }

                            return true;
                        })
                        .map((data) => ({
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

                    if (batch.length > 0) {
                        await prisma.stabilityMeasurement.createMany({
                            data: batch,
                            skipDuplicates: true
                        });
                    }
                }
            }

            // Insertar datos CAN
            if (canData.length > 0) {
                logger.info(`🚗 Insertando ${canData.length} frames CAN`);

                for (let i = 0; i < canData.length; i += 1000) {
                    const batch = canData.slice(i, i + 1000).map((data) => ({
                        sessionId: session.id,
                        timestamp:
                            typeof data.timestamp === 'string'
                                ? parseTimestamp(data.timestamp)
                                : new Date(data.timestamp),
                        engineRpm: data.engineRpm,
                        vehicleSpeed: data.vehicleSpeed,
                        fuelSystemStatus: data.fuelSystemStatus,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }));
                    await prisma.canMeasurement.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                }
            }

            // Insertar datos rotativo
            if (rotativoData.length > 0) {
                logger.info(`🔄 Insertando ${rotativoData.length} puntos rotativo`);

                for (let i = 0; i < rotativoData.length; i += 1000) {
                    const batch = rotativoData.slice(i, i + 1000).map((data) => ({
                        sessionId: session.id,
                        timestamp:
                            typeof data.timestamp === 'string'
                                ? parseTimestamp(data.timestamp)
                                : data.timestamp,
                        state: data.state.toString(),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }));
                    await prisma.rotativoMeasurement.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                }
            }

            // Generar eventos de estabilidad automáticamente si hay datos de estabilidad
            if (syncedStabilityData.length > 0) {
                try {
                    logger.info('⚙️ Generando eventos de estabilidad automáticamente...');
                    await processAndSaveStabilityEvents(session.id);
                    const eventsCount = await prisma.stability_events.count({
                        where: { session_id: session.id }
                    });
                    logger.info(`✅ Eventos de estabilidad generados: ${eventsCount}`);
                } catch (eventError) {
                    logger.error(
                        '⚠️ Error generando eventos de estabilidad (continuando):',
                        eventError
                    );
                }
            }

            logger.info('🎉 Subida de sesión completada exitosamente', {
                sessionId: session.id,
                sessionNumber: session.sessionNumber,
                vehicleId: vehicle.name,
                dataInserted: {
                    stability: syncedStabilityData.length,
                    can: canData.length,
                    gps: syncedGpsData.length,
                    rotativo: rotativoData.length
                },
                descartes: {
                    CAN: descartes.CAN.length,
                    GPS: descartes.GPS.length,
                    ESTABILIDAD: descartes.ESTABILIDAD.length,
                    ROTATIVO: descartes.ROTATIVO.length
                }
            });

            // Crear reporte de diagnóstico detallado
            const diagnosticReport = {
                session: {
                    id: session.id,
                    number: session.sessionNumber,
                    vehicle: vehicle.name,
                    duration:
                        syncedGpsData.length > 0
                            ? Math.round(
                                (getTimestamp(syncedGpsData[syncedGpsData.length - 1].timestamp) -
                                    getTimestamp(syncedGpsData[0].timestamp)) /
                                1000 /
                                60
                            ) + ' minutos'
                            : 'No determinada',
                    createdAt: session.createdAt
                },
                files: {
                    uploaded: {
                        stability: !!stabilityFile,
                        can: !!canFile,
                        gps: !!gpsFile,
                        rotativo: !!rotativoFile
                    },
                    sizes: {
                        stability: stabilityFile?.[0]?.size || 0,
                        can: canFile?.[0]?.size || 0,
                        gps: gpsFile?.[0]?.size || 0,
                        rotativo: rotativoFile?.[0]?.size || 0
                    }
                },
                dataProcessed: {
                    stability: {
                        total: stabilityData.length,
                        discarded: descartes.ESTABILIDAD.length,
                        success: stabilityData.length > 0,
                        timeRange:
                            stabilityData.length > 0
                                ? {
                                    start: stabilityData[0].timestamp,
                                    end: stabilityData[stabilityData.length - 1].timestamp
                                }
                                : null
                    },
                    gps: {
                        total: gpsData.length,
                        discarded: descartes.GPS.length,
                        success: gpsData.length > 0,
                        timeRange:
                            gpsData.length > 0
                                ? {
                                    start: gpsData[0].timestamp,
                                    end: gpsData[gpsData.length - 1].timestamp
                                }
                                : null,
                        coverage:
                            gpsData.length > 0
                                ? {
                                    minLat: Math.min(...gpsData.map((p) => p.latitude)),
                                    maxLat: Math.max(...gpsData.map((p) => p.latitude)),
                                    minLng: Math.min(...gpsData.map((p) => p.longitude)),
                                    maxLng: Math.max(...gpsData.map((p) => p.longitude))
                                }
                                : null
                    },
                    can: {
                        total: canData.length,
                        discarded: descartes.CAN.length,
                        success: canData.length > 0,
                        timeRange:
                            canData.length > 0
                                ? {
                                    start: canData[0].timestamp,
                                    end: canData[canData.length - 1].timestamp
                                }
                                : null
                    },
                    rotativo: {
                        total: rotativoData.length,
                        discarded: descartes.ROTATIVO.length,
                        success: rotativoData.length > 0,
                        timeRange:
                            rotativoData.length > 0
                                ? {
                                    start: rotativoData[0].timestamp,
                                    end: rotativoData[rotativoData.length - 1].timestamp
                                }
                                : null
                    }
                },
                events: {
                    success: false
                },
                issues: [] as DiagnosticIssue[],
                recommendations: [] as string[]
            };

            // Detectar problemas y generar recomendaciones
            if (syncedGpsData.length === 0) {
                diagnosticReport.issues.push({
                    type: 'warning',
                    category: 'GPS',
                    message: 'No se procesaron datos GPS',
                    details: files.gpsFile
                        ? 'Archivo subido pero sin datos válidos'
                        : 'No se subió archivo GPS'
                });
                diagnosticReport.recommendations.push(
                    'Verificar formato del archivo GPS y que contenga coordenadas válidas'
                );
            }

            if (canData.length === 0 && files.canFile) {
                diagnosticReport.issues.push({
                    type: 'warning',
                    category: 'CAN',
                    message: 'No se procesaron datos CAN',
                    details: 'Archivo subido pero sin datos válidos'
                });
                diagnosticReport.recommendations.push(
                    'Verificar formato del archivo CAN y estructura de columnas'
                );
            }

            if (syncedStabilityData.length > 0 && diagnosticReport.events.success === false) {
                diagnosticReport.issues.push({
                    type: 'warning',
                    category: 'Eventos',
                    message: 'No se generaron eventos de estabilidad',
                    details: `${syncedStabilityData.length} puntos de estabilidad procesados pero sin eventos`
                });
                diagnosticReport.recommendations.push(
                    'Los datos de estabilidad podrían no superar los umbrales configurados. Revisar rangos de SI (Stability Index)'
                );
            }

            if (descartes.GPS.length > gpsData.length * 0.3) {
                diagnosticReport.issues.push({
                    type: 'error',
                    category: 'GPS',
                    message: 'Alto porcentaje de puntos GPS descartados',
                    details: `${descartes.GPS.length} puntos descartados de ${descartes.GPS.length + gpsData.length
                        } total`
                });
                diagnosticReport.recommendations.push(
                    'Revisar formato de coordenadas GPS y timestamps'
                );
            }

            if (descartes.ESTABILIDAD.length > stabilityData.length * 0.3) {
                diagnosticReport.issues.push({
                    type: 'error',
                    category: 'Estabilidad',
                    message: 'Alto porcentaje de datos de estabilidad descartados',
                    details: `${descartes.ESTABILIDAD.length} puntos descartados de ${descartes.ESTABILIDAD.length + stabilityData.length
                        } total`
                });
                diagnosticReport.recommendations.push(
                    'Verificar formato de timestamps y valores numéricos en archivo de estabilidad'
                );
            }

            // Verificar sincronización temporal
            if (syncedGpsData.length > 0 && syncedStabilityData.length > 0) {
                const gpsStart = getTimestamp(syncedGpsData[0].timestamp);
                const gpsEnd = getTimestamp(syncedGpsData[syncedGpsData.length - 1].timestamp);
                const stabilityStart = getTimestamp(syncedStabilityData[0].timestamp);
                const stabilityEnd = getTimestamp(
                    syncedStabilityData[syncedStabilityData.length - 1].timestamp
                );

                const timeDiff = Math.abs(gpsStart - stabilityStart) / 1000 / 60; // minutos
                const timeDiffHours = timeDiff / 60;

                if (timeDiff > 5) {
                    const timeMessage =
                        timeDiffHours > 1
                            ? `${Math.round(timeDiffHours)} horas`
                            : `${Math.round(timeDiff)} minutos`;

                    diagnosticReport.issues.push({
                        type: timeDiff > 60 ? 'error' : 'warning',
                        category: 'Sincronización',
                        message: 'Desincronización temporal entre GPS y Estabilidad',
                        details: `Diferencia de ${timeMessage} en timestamps iniciales. GPS: ${new Date(
                            gpsStart
                        ).toLocaleString()}, Estabilidad: ${new Date(
                            stabilityStart
                        ).toLocaleString()}`
                    });

                    if (timeDiff > 60) {
                        diagnosticReport.recommendations.push(
                            '❌ ERROR CRÍTICO: Los archivos GPS y Estabilidad parecen ser de sesiones diferentes. Verificar que correspondan al mismo viaje.'
                        );
                    } else {
                        diagnosticReport.recommendations.push(
                            'Verificar que los archivos correspondan a la misma sesión temporal'
                        );
                    }
                }
            }

            // Agregar recomendaciones generales
            if (diagnosticReport.issues.length === 0) {
                diagnosticReport.recommendations.push(
                    '✅ Sesión procesada correctamente sin problemas detectados'
                );
            } else {
                diagnosticReport.recommendations.push(
                    '💡 Revisar los problemas identificados para mejorar la calidad de los datos'
                );
            }

            // Eliminar cualquier validación que impida la subida por pocos puntos GPS.
            // Solo mostrar advertencia:
            const gpsWarnings: string[] = [];
            if (gpsData.length < 10) gpsWarnings.push('Muy pocos puntos GPS');
            // Detectar saltos de tiempo grandes
            gpsData.sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            let prevTime = null;
            let jumpCount = 0;
            for (const point of gpsData) {
                const ts = new Date(point.timestamp).getTime();
                if (prevTime !== null) {
                    const diff = Math.abs(ts - prevTime) / 1000;
                    if (diff > 5) {
                        jumpCount++;
                    }
                }
                prevTime = ts;
            }
            if (jumpCount > 0) gpsWarnings.push(`Saltos de tiempo detectados: ${jumpCount}`);
            if (gpsWarnings.length > 0) {
                logger.warn(`Advertencias GPS para sesión: ${gpsWarnings.join('; ')}`);
            }

            // Llamar a la generación de KPIs tras la subida de sesión
            try {
                const { calculateVehicleKPI } = require('../services/calculateVehicleKPI');
                await calculateVehicleKPI(vehicle.id, startTime, req.user.organizationId);
                logger.info('✅ KPIs de vehículo recalculados correctamente tras la subida de sesión');
            } catch (kpiError) {
                logger.error('Error al calcular KPIs tras la subida de sesión:', kpiError);
            }

            return res.status(200).json({
                success: true,
                message: 'Sesión subida correctamente',
                data: {
                    sessionId: session.id,
                    sessionNumber: session.sessionNumber,
                    vehicleId: vehicle.id,
                    vehicleName: vehicle.name,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    createdAt: session.createdAt,
                    dataInserted: {
                        stability: syncedStabilityData.length,
                        can: canData.length,
                        gps: syncedGpsData.length,
                        rotativo: rotativoData.length
                    },
                    descartes: {
                        CAN: descartes.CAN.length,
                        GPS: descartes.GPS.length,
                        ESTABILIDAD: descartes.ESTABILIDAD.length,
                        ROTATIVO: descartes.ROTATIVO.length
                    },
                    diagnosticReport: diagnosticReport
                },
                warnings: gpsWarnings.length > 0 ? gpsWarnings : undefined
            });
        } catch (error) {
            logger.error('Error en uploadSessionData:', error);
            return res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
