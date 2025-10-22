/**
 * 🔄 PROCESADOR UNIFICADO DE ARCHIVOS V2
 * 
 * Nueva implementación con arquitectura robusta y reglas estructuradas.
 * 
 * FLUJO:
 * 1. Validar Foreign Keys (usuario, organización)
 * 2. Agrupar archivos por vehículo y fecha
 * 3. Para cada grupo:
 *    a. Detectar sesiones individuales en cada archivo (SessionDetector)
 *    b. Correlacionar sesiones temporalmente (TemporalCorrelator)
 *    c. Validar sesiones correlacionadas (SessionValidator)
 *    d. Guardar en BD solo sesiones válidas
 * 
 * @version 2.0
 * @date 2025-10-12
 */

import { prisma } from '../../lib/prisma';
import { createLogger } from '../../utils/logger';
import { SessionDetectorV2 } from './SessionDetectorV2';
import { TemporalCorrelator } from './TemporalCorrelator';
import { CorrelatedSession } from './types/CorrelatedSession';
import { FileDetail, ProcessingResult } from './types/ProcessingResult';
import { ForeignKeyValidator } from './validators/ForeignKeyValidator';
import { SessionValidator } from './validators/SessionValidator';

// Parsers robustos existentes
import { interpolarGPS, parseGPSRobust } from '../parsers/RobustGPSParser';
import { parseRotativoRobust } from '../parsers/RobustRotativoParser';
import { parseEstabilidadRobust } from '../parsers/RobustStabilityParser';

// ✅ NUEVO: Utilidades y configuración
import { calculateDuration, formatDuration, formatTime } from './utils/formatters';

const logger = createLogger('UnifiedFileProcessor-V2');

/**
 * 🛠️ Convertir DetectedSession a FileDetail
 */
function detectedSessionToFileDetail(
    detectedSession: import('./types/DetectedSession').DetectedSession | null,
    fileName: string
): FileDetail | undefined {
    if (!detectedSession) return undefined;

    const durationSeconds = calculateDuration(detectedSession.startTime, detectedSession.endTime);

    return {
        fileName,
        sessionNumber: detectedSession.sessionNumber,
        startTime: formatTime(detectedSession.startTime),
        endTime: formatTime(detectedSession.endTime),
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        measurements: detectedSession.measurementCount
    };
}

interface ArchivoSubida {
    nombre: string;
    buffer: Buffer;
}

interface GrupoArchivos {
    vehiculo: string;
    fecha: string;
    archivos: {
        estabilidad?: Buffer;
        gps?: Buffer;
        rotativo?: Buffer;
    };
}

export class UnifiedFileProcessorV2 {
    /**
     * Procesa un conjunto de archivos (entrada principal)
     */
    async procesarArchivos(
        archivos: ArchivoSubida[],
        organizationId: string,
        userId: string,
        customConfig?: any // ✅ NUEVO: Configuración personalizada del frontend
    ): Promise<ProcessingResult> {
        logger.info(`🚀 Iniciando procesamiento de ${archivos.length} archivos`);

        // ✅ NUEVO: Aplicar configuración personalizada
        const config = customConfig || {};
        if (customConfig) {
            logger.info('⚙️ Aplicando configuración personalizada:', {
                archivosObligatorios: customConfig.requiredFiles,
                duracionMin: customConfig.minSessionDuration,
                vehiculosFiltrados: customConfig.allowedVehicles,
                fechasFiltradas: customConfig.allowedDates
            });
        }

        const startTime = Date.now();
        const problemas: { archivo: string; error: string }[] = [];
        const warnings: string[] = [];

        try {
            // PASO 1: Validar Foreign Keys
            logger.info('1️⃣  Validando foreign keys...');
            const validation = await ForeignKeyValidator.validateAll(userId, organizationId);

            if (!validation.valid) {
                throw new Error(`Foreign keys inválidas: ${validation.errors.join(', ')}`);
            }

            // PASO 2: Agrupar archivos por vehículo y fecha
            logger.info('2️⃣  Agrupando archivos por vehículo y fecha...');
            let grupos = this.agruparArchivos(archivos);

            // ✅ NUEVO: Filtrar por vehículos permitidos
            if (config.allowedVehicles && config.allowedVehicles.length > 0) {
                const before = grupos.length;
                grupos = grupos.filter(g => config.allowedVehicles.includes(g.vehiculo));
                logger.info(`   → Filtrado por vehículos: ${before} → ${grupos.length} grupos`);
            }

            // ✅ NUEVO: Filtrar por fechas permitidas
            if (config.allowedDates && config.allowedDates.length > 0) {
                const before = grupos.length;
                grupos = grupos.filter(g => {
                    const [dia, mes, año] = g.fecha.split('/');
                    const fechaFormateada = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                    return config.allowedDates.includes(fechaFormateada);
                });
                logger.info(`   → Filtrado por fechas: ${before} → ${grupos.length} grupos`);
            }

            logger.info(`   → ${grupos.length} grupos detectados después de filtros`);

            // PASO 3: Procesar cada grupo
            logger.info('3️⃣  Procesando grupos...');

            let totalSesionesCreadas = 0;
            const sessionIds: string[] = [];
            const sessionDetails: any[] = []; // ✅ NUEVO: Acumular sessionDetails
            const estadisticas = {
                gpsValido: 0,
                gpsInterpolado: 0,
                gpsSinSenal: 0,
                estabilidadValida: 0,
                rotativoValido: 0,
                totalMediciones: 0
            };

            for (const grupo of grupos) {
                try {
                    const resultado = await this.procesarGrupo(
                        grupo,
                        organizationId,
                        userId,
                        config // ✅ NUEVO: Pasar config al procesarGrupo
                    );

                    totalSesionesCreadas += resultado.sesionesCreadas;
                    sessionIds.push(...resultado.sessionIds);

                    // ✅ NUEVO: Acumular sessionDetails de cada grupo
                    if (resultado.sessionDetails && resultado.sessionDetails.length > 0) {
                        sessionDetails.push(...resultado.sessionDetails);
                    }

                    // Acumular estadísticas
                    estadisticas.gpsValido += resultado.estadisticas.gpsValido;
                    estadisticas.gpsInterpolado += resultado.estadisticas.gpsInterpolado;
                    estadisticas.gpsSinSenal += resultado.estadisticas.gpsSinSenal;
                    estadisticas.estabilidadValida += resultado.estadisticas.estabilidadValida;
                    estadisticas.rotativoValido += resultado.estadisticas.rotativoValido;
                    estadisticas.totalMediciones += resultado.estadisticas.totalMediciones;

                } catch (error: any) {
                    logger.error(`Error procesando grupo ${grupo.vehiculo} ${grupo.fecha}`, error);
                    problemas.push({
                        archivo: `${grupo.vehiculo}_${grupo.fecha}`,
                        error: error.message
                    });
                }
            }

            const processingTimeMs = Date.now() - startTime;

            logger.info(`✅ Procesamiento completado en ${processingTimeMs}ms`);
            logger.info(`   → ${totalSesionesCreadas} sesiones creadas`);
            logger.info(`   → ${problemas.length} problemas encontrados`);

            return {
                filesProcessed: archivos.length,
                sesionesCreadas: totalSesionesCreadas,
                sesionesOmitidas: 0, // V2 no omite, crea sesiones únicas
                sessionIds,
                sessionDetails, // ✅ NUEVO: Devolver detalles de sesiones
                estadisticas,
                problemas,
                warnings,
                processingTimeMs
            };

        } catch (error: any) {
            logger.error('Error crítico en procesamiento', error);
            throw error;
        }
    }

    /**
     * Procesa un grupo de archivos del mismo vehículo y fecha
     */
    private async procesarGrupo(
        grupo: GrupoArchivos,
        organizationId: string,
        userId: string,
        config?: any // ✅ NUEVO: Configuración personalizada
    ): Promise<ProcessingResult> {
        logger.info(`📦 Procesando grupo: ${grupo.vehiculo} - ${grupo.fecha}`);

        // PASO 3.1: Buscar o crear vehículo
        const vehicleId = await ForeignKeyValidator.getOrCreateVehicle(
            grupo.vehiculo,
            organizationId
        );

        // PASO 3.2: Detectar sesiones en cada archivo usando parsers robustos
        logger.info('   Detectando sesiones individuales...');

        // Fecha base para parsear (YYYYMMDD → Date)
        const [year, month, day] = [
            parseInt(grupo.fecha.substring(0, 4)),
            parseInt(grupo.fecha.substring(4, 6)),
            parseInt(grupo.fecha.substring(6, 8))
        ];
        const baseDate = new Date(year, month - 1, day);

        const estSessions = grupo.archivos.estabilidad
            ? SessionDetectorV2.detectEstabilidadSessions(
                grupo.archivos.estabilidad,
                baseDate,
                `ESTABILIDAD_${grupo.vehiculo}_${grupo.fecha}.txt`
            )
            : [];

        const gpsSessions = grupo.archivos.gps
            ? SessionDetectorV2.detectGPSSessions(
                grupo.archivos.gps,
                baseDate,
                `GPS_${grupo.vehiculo}_${grupo.fecha}.txt`
            )
            : [];

        const rotSessions = grupo.archivos.rotativo
            ? SessionDetectorV2.detectRotativoSessions(
                grupo.archivos.rotativo,
                baseDate,
                `ROTATIVO_${grupo.vehiculo}_${grupo.fecha}.txt`
            )
            : [];

        // ✅ DEBUG: Ver qué archivos existen en el grupo
        logger.info(`   📁 Archivos: EST=${!!grupo.archivos.estabilidad}, GPS=${!!grupo.archivos.gps}, ROT=${!!grupo.archivos.rotativo}`);
        logger.info(`   → EST: ${estSessions.length}, GPS: ${gpsSessions.length}, ROT: ${rotSessions.length}`);

        // PASO 3.3: Correlacionar sesiones temporalmente
        logger.info('   Correlacionando sesiones...');
        const correlationResult = TemporalCorrelator.correlateSessions(
            estSessions,
            gpsSessions,
            rotSessions
        );

        logger.info(`   → ${correlationResult.correlatedSessions.length} sesiones correlacionadas`);

        // PASO 3.4: Validar sesiones
        logger.info('   Validando sesiones...');
        let validationResult = SessionValidator.validateBatch(correlationResult.correlatedSessions);

        // ✅ NUEVO: Aplicar filtros de configuración
        if (config) {
            const beforeFilter = validationResult.validSessions.length;
            const newInvalidSessions: CorrelatedSession[] = [];

            // Filtrar por archivos obligatorios
            validationResult.validSessions = validationResult.validSessions.filter(session => {
                // GPS obligatorio
                if (config.requiredFiles?.gps && !session.gps) {
                    logger.info(`   ❌ Sesión ${session.sessionNumber} rechazada: Falta GPS`);
                    newInvalidSessions.push({
                        ...session,
                        isValid: false,
                        invalidReason: 'Falta GPS (requerido por configuración)'
                    });
                    return false;
                }

                // ESTABILIDAD obligatorio
                if (config.requiredFiles?.estabilidad && !session.estabilidad) {
                    newInvalidSessions.push({
                        ...session,
                        isValid: false,
                        invalidReason: 'Falta ESTABILIDAD (requerido por configuración)'
                    });
                    return false;
                }

                // ROTATIVO obligatorio
                if (config.requiredFiles?.rotativo && !session.rotativo) {
                    newInvalidSessions.push({
                        ...session,
                        isValid: false,
                        invalidReason: 'Falta ROTATIVO (requerido por configuración)'
                    });
                    return false;
                }

                return true;
            });

            // Filtrar por duración mínima
            if (config.minSessionDuration && config.minSessionDuration > 0) {
                validationResult.validSessions = validationResult.validSessions.filter(session => {
                    if (session.durationSeconds < config.minSessionDuration) {
                        logger.info(`   ❌ Sesión ${session.sessionNumber} rechazada: Duración ${session.durationSeconds}s < ${config.minSessionDuration}s`);
                        newInvalidSessions.push({
                            ...session,
                            isValid: false,
                            invalidReason: `Duración < ${config.minSessionDuration}s (${session.durationSeconds}s)`
                        });
                        return false;
                    }
                    return true;
                });
            }

            // Filtrar por duración máxima
            if (config.maxSessionDuration && config.maxSessionDuration > 0) {
                validationResult.validSessions = validationResult.validSessions.filter(session => {
                    if (session.durationSeconds > config.maxSessionDuration) {
                        newInvalidSessions.push({
                            ...session,
                            isValid: false,
                            invalidReason: `Duración > ${config.maxSessionDuration}s (${session.durationSeconds}s)`
                        });
                        return false;
                    }
                    return true;
                });
            }

            // Agregar sesiones filtradas a las inválidas
            validationResult.invalidSessions.push(...newInvalidSessions);

            if (beforeFilter !== validationResult.validSessions.length) {
                logger.info(`   → Filtrado por config: ${beforeFilter} → ${validationResult.validSessions.length} válidas (${newInvalidSessions.length} rechazadas)`);
            }
        }

        logger.info(`   → ${validationResult.validSessions.length} válidas, ${validationResult.invalidSessions.length} inválidas`);

        // PASO 3.5: Guardar sesiones válidas en BD
        const sessionIds: string[] = [];
        const sessionDetails: any[] = []; // ✅ NUEVO: Detalles por sesión
        const estadisticas = {
            gpsValido: 0,
            gpsInterpolado: 0,
            gpsSinSenal: 0,
            estabilidadValida: 0,
            rotativoValido: 0,
            totalMediciones: 0
        };

        for (const session of validationResult.validSessions) {
            try {
                const result = await this.guardarSesion(
                    session,
                    vehicleId,
                    userId,
                    organizationId,
                    grupo,
                    baseDate
                );

                sessionIds.push(result.sessionId);

                // ✅ NUEVO: Guardar detalles de la sesión CON información COMPLETA por archivo
                const durationSeconds = calculateDuration(session.startTime, session.endTime);

                sessionDetails.push({
                    sessionNumber: session.sessionNumber,
                    sessionId: result.sessionId,
                    startTime: session.startTime.toISOString(),
                    endTime: session.endTime.toISOString(),
                    durationSeconds,
                    durationFormatted: formatDuration(durationSeconds),
                    measurements: result.measurementCount,
                    status: result.created ? 'CREADA' : 'OMITIDA',
                    reason: result.created ? 'Sesión nueva creada' : 'Sesión ya existía',

                    // ✅ Información DETALLADA por archivo
                    estabilidad: session.estabilidad ? {
                        fileName: `ESTABILIDAD_${grupo.vehiculo}_${grupo.fecha}.txt`,
                        sessionNumber: session.estabilidad.sessionNumber,
                        startTime: formatTime(session.estabilidad.startTime),
                        endTime: formatTime(session.estabilidad.endTime),
                        durationSeconds: calculateDuration(session.estabilidad.startTime, session.estabilidad.endTime),
                        durationFormatted: formatDuration(calculateDuration(session.estabilidad.startTime, session.estabilidad.endTime)),
                        measurements: session.estabilidad.measurementCount || 0
                    } : null,

                    gps: session.gps ? {
                        fileName: `GPS_${grupo.vehiculo}_${grupo.fecha}.txt`,
                        sessionNumber: session.gps.sessionNumber,
                        startTime: formatTime(session.gps.startTime),
                        endTime: formatTime(session.gps.endTime),
                        durationSeconds: calculateDuration(session.gps.startTime, session.gps.endTime),
                        durationFormatted: formatDuration(calculateDuration(session.gps.startTime, session.gps.endTime)),
                        measurements: session.gps.measurementCount || 0
                    } : null,

                    rotativo: session.rotativo ? {
                        fileName: `ROTATIVO_${grupo.vehiculo}_${grupo.fecha}.txt`,
                        sessionNumber: session.rotativo.sessionNumber,
                        startTime: formatTime(session.rotativo.startTime),
                        endTime: formatTime(session.rotativo.endTime),
                        durationSeconds: calculateDuration(session.rotativo.startTime, session.rotativo.endTime),
                        durationFormatted: formatDuration(calculateDuration(session.rotativo.startTime, session.rotativo.endTime)),
                        measurements: session.rotativo.measurementCount || 0
                    } : null,

                    // Mantener archivos simples por compatibilidad
                    archivos: {
                        estabilidad: session.estabilidad ? `ESTABILIDAD_${grupo.vehiculo}_${grupo.fecha}.txt` : null,
                        gps: session.gps ? `GPS_${grupo.vehiculo}_${grupo.fecha}.txt` : null,
                        rotativo: session.rotativo ? `ROTATIVO_${grupo.vehiculo}_${grupo.fecha}.txt` : null
                    }
                });

                // Acumular estadísticas (estimado)
                if (session.estabilidad) estadisticas.estabilidadValida += session.estabilidad.measurementCount;
                if (session.rotativo) estadisticas.rotativoValido += session.rotativo.measurementCount;
                if (session.gps) {
                    estadisticas.gpsValido += session.gps.measurementCount;
                } else {
                    estadisticas.gpsSinSenal += 100; // Estimado
                }

                estadisticas.totalMediciones +=
                    (session.estabilidad?.measurementCount || 0) +
                    (session.gps?.measurementCount || 0) +
                    (session.rotativo?.measurementCount || 0);

            } catch (error: any) {
                logger.error(`Error guardando sesión ${session.sessionNumber}`, error);
            }
        }

        // ✅ NUEVO: Agregar sesiones inválidas al reporte para mostrar "por qué no se procesaron"
        for (const invalidSession of validationResult.invalidSessions) {
            const durationSeconds = calculateDuration(invalidSession.startTime, invalidSession.endTime);

            sessionDetails.push({
                sessionNumber: invalidSession.sessionNumber,
                sessionId: '', // No tiene ID porque no se creó
                startTime: invalidSession.startTime.toISOString(),
                endTime: invalidSession.endTime.toISOString(),
                durationSeconds,
                durationFormatted: formatDuration(durationSeconds),
                measurements: 0,
                status: 'OMITIDA',
                reason: invalidSession.invalidReason || 'Sesión inválida',

                archivos: {
                    estabilidad: invalidSession.estabilidad ? `ESTABILIDAD_${grupo.vehiculo}_${grupo.fecha}.txt` : null,
                    gps: invalidSession.gps ? `GPS_${grupo.vehiculo}_${grupo.fecha}.txt` : null,
                    rotativo: invalidSession.rotativo ? `ROTATIVO_${grupo.vehiculo}_${grupo.fecha}.txt` : null
                }
            });
        }

        return {
            filesProcessed: [
                grupo.archivos.estabilidad,
                grupo.archivos.gps,
                grupo.archivos.rotativo
            ].filter(Boolean).length,
            sesionesCreadas: sessionIds.length,
            sesionesOmitidas: validationResult.invalidSessions.length,
            sessionIds,
            sessionDetails, // ✅ AHORA incluye sesiones válidas + inválidas con razones
            estadisticas,
            problemas: validationResult.invalidSessions.map(s => ({
                archivo: `Sesión ${s.sessionNumber}`,
                error: s.invalidReason || 'Desconocido'
            })),
            warnings: correlationResult.warnings
        };
    }

    /**
     * Guarda una sesión correlacionada en la BD
     */
    private async guardarSesion(
        session: CorrelatedSession,
        vehicleId: string,
        userId: string,
        organizationId: string,
        grupo: GrupoArchivos,
        baseDate: Date
    ): Promise<{ sessionId: string; created: boolean; measurementCount: number }> {
        logger.info(`   💾 Guardando sesión #${session.sessionNumber}...`);

        // Verificar si ya existe una sesión con mismo vehículo, número y fecha
        const existing = await prisma.session.findFirst({
            where: {
                vehicleId,
                sessionNumber: session.sessionNumber,
                startTime: {
                    gte: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()),
                    lt: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1)
                }
            },
            include: {
                _count: {
                    select: {
                        GpsMeasurement: true,
                        StabilityMeasurement: true,
                        RotativoMeasurement: true
                    }
                }
            }
        });

        if (existing) {
            logger.info(`   ⚠️ Sesión ${session.sessionNumber} ya existe, omitiendo...`);
            const existingMeasurementCount =
                existing._count.GpsMeasurement +
                existing._count.StabilityMeasurement +
                existing._count.RotativoMeasurement;
            return {
                sessionId: existing.id,
                created: false,
                measurementCount: existingMeasurementCount
            };
        }

        // Crear sesión en BD
        const dbSession = await prisma.session.create({
            data: {
                vehicleId,
                userId,
                organizationId,
                startTime: session.startTime,
                endTime: session.endTime,
                sessionNumber: session.sessionNumber,
                sequence: session.sessionNumber,
                source: 'UPLOAD_UNIFIED_V2',
                status: 'ACTIVE',
                type: 'ROUTINE',
                updatedAt: new Date() // ✅ REQUERIDO: Campo updatedAt obligatorio
            }
        });

        // Parsear y guardar mediciones de cada tipo
        // IMPORTANTE: Parsear el archivo COMPLETO y filtrar por rango de tiempo de esta sesión
        let measurementCount = 0;

        if (session.gps && grupo.archivos.gps) {
            const result = parseGPSRobust(grupo.archivos.gps, baseDate);
            const puntosSesion = result.puntos.filter(p =>
                p.timestamp >= session.startTime && p.timestamp <= session.endTime
            );

            if (puntosSesion.length > 0) {
                const puntosInterpolados = interpolarGPS(puntosSesion);
                await this.guardarMedicionesGPSArray(dbSession.id, puntosInterpolados);
                measurementCount += puntosInterpolados.length;
            }
        }

        if (session.estabilidad && grupo.archivos.estabilidad) {
            const result = parseEstabilidadRobust(grupo.archivos.estabilidad, baseDate);
            const medicionesSesion = result.mediciones.filter(m =>
                m.timestamp >= session.startTime && m.timestamp <= session.endTime
            );

            if (medicionesSesion.length > 0) {
                await this.guardarMedicionesEstabilidadArray(dbSession.id, medicionesSesion);
                measurementCount += medicionesSesion.length;
            }
        }

        if (session.rotativo && grupo.archivos.rotativo) {
            const result = parseRotativoRobust(grupo.archivos.rotativo, baseDate);
            const medicionesSesion = result.mediciones.filter(m =>
                m.timestamp >= session.startTime && m.timestamp <= session.endTime
            );

            if (medicionesSesion.length > 0) {
                await this.guardarMedicionesRotativoArray(dbSession.id, medicionesSesion);
                measurementCount += medicionesSesion.length;
            }
        }

        logger.info(`   ✅ Sesión ${session.sessionNumber} guardada: ${dbSession.id}`);

        // ✅ POST-PROCESAMIENTO AUTOMÁTICO movido a UploadPostProcessor (centralizado)
        // await this.ejecutarPostProcesamiento(dbSession.id); // DESHABILITADO - ahora se ejecuta desde upload-unified.ts

        return {
            sessionId: dbSession.id,
            created: true,
            measurementCount
        };
    }

    /**
     * Guarda array de mediciones GPS en BD
     */
    private async guardarMedicionesGPSArray(
        sessionId: string,
        puntos: any[]
    ): Promise<void> {
        if (puntos.length === 0) return;

        // Insertar en lotes
        const batchSize = 1000;
        for (let i = 0; i < puntos.length; i += batchSize) {
            const batch = puntos.slice(i, i + batchSize);

            await prisma.gpsMeasurement.createMany({
                data: batch.map(p => ({
                    sessionId,
                    timestamp: p.timestamp,
                    latitude: p.latitude,
                    longitude: p.longitude,
                    altitude: p.altitude,
                    hdop: p.hdop || 0,
                    speed: p.speed || 0,
                    satellites: p.satellites || 0,
                    updatedAt: new Date()
                })),
                skipDuplicates: true
            });
        }
    }

    /**
     * Guarda array de mediciones de ESTABILIDAD en BD
     */
    private async guardarMedicionesEstabilidadArray(
        sessionId: string,
        mediciones: any[]
    ): Promise<void> {
        if (mediciones.length === 0) return;

        const batchSize = 1000;
        for (let i = 0; i < mediciones.length; i += batchSize) {
            const batch = mediciones.slice(i, i + batchSize);

            await prisma.stabilityMeasurement.createMany({
                data: batch.map(m => ({
                    sessionId,
                    timestamp: m.timestamp,
                    ax: m.ax,
                    ay: m.ay,
                    az: m.az,
                    gx: m.gx,
                    gy: m.gy,
                    gz: m.gz,
                    roll: m.roll,
                    updatedAt: new Date(),
                    pitch: m.pitch,
                    yaw: m.yaw,
                    timeantwifi: m.timeantwifi,
                    si: m.si || 0, // ✅ AGREGAR CAMPO SI CRUCIAL
                    accmag: m.accmag || 0,
                    microsds: m.microsds || 0,
                    usciclo1: m.usciclo1 || 0,
                    usciclo2: m.usciclo2 || 0,
                    usciclo3: m.usciclo3 || 0,
                    usciclo4: m.usciclo4 || 0,
                    usciclo5: m.usciclo5 || 0,
                    usciclo6: m.usciclo6 || 0,
                    usciclo7: m.usciclo7 || 0,
                    usciclo8: m.usciclo8 || 0
                })),
                skipDuplicates: true
            });
        }
    }

    /**
     * Guarda array de mediciones de ROTATIVO en BD
     */
    private async guardarMedicionesRotativoArray(
        sessionId: string,
        mediciones: any[]
    ): Promise<void> {
        if (mediciones.length === 0) return;

        const batchSize = 1000;
        for (let i = 0; i < mediciones.length; i += batchSize) {
            const batch = mediciones.slice(i, i + batchSize);

            await prisma.rotativoMeasurement.createMany({
                data: batch.map(m => ({
                    sessionId,
                    timestamp: m.timestamp,
                    state: m.state,
                    key: m.key
                })),
                skipDuplicates: true
            });
        }
    }

    /**
     * Agrupa archivos por vehículo y fecha
     */
    private agruparArchivos(archivos: ArchivoSubida[]): GrupoArchivos[] {
        const grupos = new Map<string, GrupoArchivos>();

        for (const archivo of archivos) {
            // Extraer vehículo y fecha del nombre
            // Formato: TIPO_VEHICULO_YYYYMMDD.txt
            const match = archivo.nombre.match(/^(ESTABILIDAD|GPS|ROTATIVO)_([A-Z0-9]+)_(\d{8})\.txt$/i);

            if (!match) {
                logger.warn(`Nombre de archivo no reconocido: ${archivo.nombre}`);
                continue;
            }

            const [, tipo, vehiculo, fecha] = match;

            // ✅ FILTRO: Solo archivos desde 1 septiembre 2025
            const year = parseInt(fecha.substring(0, 4));
            const month = parseInt(fecha.substring(4, 6));

            if (year < 2025 || (year === 2025 && month < 9)) {
                logger.info(`   ⏭️  Archivo ignorado (anterior a sept 2025): ${archivo.nombre}`);
                continue;
            }

            const key = `${vehiculo}_${fecha}`;

            if (!grupos.has(key)) {
                grupos.set(key, {
                    vehiculo,
                    fecha,
                    archivos: {}
                });
            }

            const grupo = grupos.get(key)!;

            switch (tipo.toUpperCase()) {
                case 'ESTABILIDAD':
                    grupo.archivos.estabilidad = archivo.buffer;
                    break;
                case 'GPS':
                    grupo.archivos.gps = archivo.buffer;
                    break;
                case 'ROTATIVO':
                    grupo.archivos.rotativo = archivo.buffer;
                    break;
            }
        }

        return Array.from(grupos.values());
    }

    /**
     * ✅ POST-PROCESAMIENTO AUTOMÁTICO (MANDAMIENTO M9.2)
     * Ejecuta el procesamiento automático después de crear cada sesión
     */
    private async ejecutarPostProcesamiento(sessionId: string): Promise<void> {
        logger.info(`🔄 Iniciando post-procesamiento para sesión: ${sessionId}`);

        try {
            // 1. ✅ EVENTOS DE ESTABILIDAD
            try {
                const { processAndSaveStabilityEvents } = await import('../StabilityEventService');
                await processAndSaveStabilityEvents(sessionId);
                logger.info(`✅ Eventos de estabilidad generados para sesión ${sessionId}`);
            } catch (error: any) {
                logger.warn(`⚠️ Error generando eventos de estabilidad para sesión ${sessionId}:`, error?.message);
            }

            // 2. ✅ SEGMENTOS DE CLAVES OPERACIONALES
            try {
                // Importación dinámica para evitar dependencias circulares
                const keyCalculatorModule = await import('../keyCalculatorBackup') as any;
                const numSegmentos = await keyCalculatorModule.calcularYGuardarSegmentos(sessionId);
                logger.info(`✅ ${numSegmentos} segmentos de claves generados para sesión ${sessionId}`);
            } catch (error: any) {
                logger.warn(`⚠️ Error calculando segmentos de claves para sesión ${sessionId}:`, error?.message);
            }

            // 3. ✅ VIOLACIONES DE VELOCIDAD
            try {
                const { analizarVelocidades } = await import('../speedAnalyzer');
                await analizarVelocidades([sessionId]);
                logger.info(`✅ Violaciones de velocidad analizadas para sesión ${sessionId}`);
            } catch (error: any) {
                logger.warn(`⚠️ Error analizando violaciones de velocidad para sesión ${sessionId}:`, error?.message);
            }

            logger.info(`✅ Post-procesamiento completado para sesión ${sessionId}`);

        } catch (error: any) {
            logger.error(`❌ Error crítico en post-procesamiento para sesión ${sessionId}:`, error?.message);
            // No lanzar error para no fallar la subida completa
        }
    }
}

// Exportar instancia singleton
export const unifiedFileProcessorV2 = new UnifiedFileProcessorV2();

