import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import {
    ArchivoAgrupado,
    agruparArchivosPorVehiculo,
    detectarSesionesMultiples,
    extraerContenidoSesion
} from './parsers/MultiSessionDetector';
import { interpolarGPS, parseGPSRobust } from './parsers/RobustGPSParser';
import { parseRotativoRobust } from './parsers/RobustRotativoParser';
import { parseEstabilidadRobust } from './parsers/RobustStabilityParser';

const logger = createLogger('UnifiedFileProcessor');
const prisma = new PrismaClient();

export interface ProcessingResult {
    success: boolean;
    sesionesCreadas: number;
    archivosValidos: number;
    archivosConProblemas: number;
    estadisticas: {
        gpsValido: number;
        gpsInterpolado: number;
        gpsSinSenal: number;
        estabilidadValida: number;
        rotativoValido: number;
    };
    sessionIds: string[];
    problemas: Array<{ tipo: string; descripcion: string; gravedad: string }>;
}

/**
 * Procesador Unificado de Archivos Doback
 * 
 * Funcionalidades:
 * 1. Detección de sesiones múltiples
 * 2. Validación robusta de GPS ("sin datos GPS")
 * 3. Interpolación de timestamps en ESTABILIDAD
 * 4. Correlación GPS-ESTABILIDAD-ROTATIVO
 * 5. Estadísticas de calidad por sesión
 */
export class UnifiedFileProcessor {

    /**
     * Procesa múltiples archivos agrupándolos automáticamente por vehículo y fecha
     */
    async procesarArchivos(
        archivos: Array<{ nombre: string; buffer: Buffer }>,
        organizationId: string,
        userId: string
    ): Promise<ProcessingResult> {
        logger.info(`Iniciando procesamiento unificado de ${archivos.length} archivos`);

        const resultado: ProcessingResult = {
            success: true,
            sesionesCreadas: 0,
            archivosValidos: 0,
            archivosConProblemas: 0,
            estadisticas: {
                gpsValido: 0,
                gpsInterpolado: 0,
                gpsSinSenal: 0,
                estabilidadValida: 0,
                rotativoValido: 0
            },
            sessionIds: [],
            problemas: []
        };

        try {
            // 1. Agrupar archivos por vehículo y fecha
            const grupos = agruparArchivosPorVehiculo(archivos);

            logger.info(`Archivos agrupados en ${grupos.length} conjuntos de vehículo/fecha`);

            // 2. Procesar cada grupo
            for (const grupo of grupos) {
                try {
                    const resultadoGrupo = await this.procesarGrupoArchivos(grupo, organizationId, userId);

                    resultado.sesionesCreadas += resultadoGrupo.sesionesCreadas;
                    resultado.archivosValidos += resultadoGrupo.archivosValidos;
                    resultado.sessionIds.push(...resultadoGrupo.sessionIds);

                    // Acumular estadísticas
                    resultado.estadisticas.gpsValido += resultadoGrupo.gpsValidas;
                    resultado.estadisticas.gpsSinSenal += resultadoGrupo.gpsSinSenal;
                    resultado.estadisticas.estabilidadValida += resultadoGrupo.estabilidadValidas;
                    resultado.estadisticas.rotativoValido += resultadoGrupo.rotativoValidas;

                } catch (error: any) {
                    logger.error(`Error procesando grupo ${grupo.vehiculo} ${grupo.fecha}`, { error: error.message });
                    resultado.archivosConProblemas++;
                    resultado.problemas.push({
                        tipo: 'ERROR_GRUPO',
                        descripcion: `Error en ${grupo.vehiculo} ${grupo.fecha}: ${error.message}`,
                        gravedad: 'ALTA'
                    });
                }
            }

            logger.info('Procesamiento completado', {
                sesionesCreadas: resultado.sesionesCreadas,
                archivosValidos: resultado.archivosValidos,
                problemas: resultado.problemas.length
            });

        } catch (error: any) {
            logger.error('Error crítico en procesamiento', { error: error.message });
            resultado.success = false;
            resultado.problemas.push({
                tipo: 'ERROR_CRITICO',
                descripcion: error.message,
                gravedad: 'CRITICA'
            });
        }

        return resultado;
    }

    /**
     * Procesa un grupo de archivos (ESTABILIDAD + GPS + ROTATIVO) del mismo vehículo y fecha
     */
    private async procesarGrupoArchivos(
        grupo: ArchivoAgrupado,
        organizationId: string,
        userId: string
    ): Promise<any> {
        logger.info(`Procesando grupo: ${grupo.vehiculo} ${grupo.fecha}`);

        // 1. Buscar o crear vehículo
        const vehiculo = await this.buscarOCrearVehiculo(grupo.vehiculo, organizationId);

        // 2. Detectar sesiones múltiples en cada archivo
        const sesionesEstabilidad = grupo.archivos.estabilidad
            ? detectarSesionesMultiples(grupo.archivos.estabilidad, 'ESTABILIDAD')
            : [];

        const sesionesGPS = grupo.archivos.gps
            ? detectarSesionesMultiples(grupo.archivos.gps, 'GPS')
            : [];

        const sesionesRotativo = grupo.archivos.rotativo
            ? detectarSesionesMultiples(grupo.archivos.rotativo, 'ROTATIVO')
            : [];

        // 3. Determinar número de sesiones (máximo de los 3 tipos)
        const numSesiones = Math.max(
            sesionesEstabilidad.length,
            sesionesGPS.length,
            sesionesRotativo.length,
            1 // Al menos 1 sesión
        );

        logger.info(`Sesiones detectadas: ESTABILIDAD=${sesionesEstabilidad.length}, GPS=${sesionesGPS.length}, ROTATIVO=${sesionesRotativo.length}`);

        const sessionIds: string[] = [];
        let gpsValidas = 0;
        let gpsSinSenal = 0;
        let estabilidadValidas = 0;
        let rotativoValidas = 0;

        // 4. Procesar cada sesión independientemente
        for (let i = 0; i < numSesiones; i++) {
            const sesionEstabilidad = sesionesEstabilidad[i];
            const sesionGPS = sesionesGPS[i];
            const sesionRotativo = sesionesRotativo[i];

            // Parsear datos de esta sesión específica
            const gpsResult = sesionGPS && grupo.archivos.gps
                ? parseGPSRobust(
                    extraerContenidoSesion(grupo.archivos.gps, sesionGPS),
                    sesionGPS.fechaDate
                )
                : null;

            const estabilidadResult = sesionEstabilidad && grupo.archivos.estabilidad
                ? parseEstabilidadRobust(
                    extraerContenidoSesion(grupo.archivos.estabilidad, sesionEstabilidad),
                    sesionEstabilidad.fechaDate
                )
                : null;

            const rotativoResult = sesionRotativo && grupo.archivos.rotativo
                ? parseRotativoRobust(
                    extraerContenidoSesion(grupo.archivos.rotativo, sesionRotativo),
                    sesionRotativo.fechaDate
                )
                : null;

            // Acumular estadísticas
            if (gpsResult) {
                gpsValidas += gpsResult.estadisticas.validas;
                gpsSinSenal += gpsResult.estadisticas.sinSenal;
            }

            if (estabilidadResult) {
                estabilidadValidas += estabilidadResult.estadisticas.validas;
            }

            if (rotativoResult) {
                rotativoValidas += rotativoResult.estadisticas.validas;
            }

            // 5. Interpolar GPS si es necesario
            const gpsInterpolado = gpsResult?.puntos && gpsResult.puntos.length > 0
                ? interpolarGPS(gpsResult.puntos)
                : [];

            // 6. Crear sesión en BD
            const startTime = sesionEstabilidad?.fechaDate
                || sesionGPS?.fechaDate
                || sesionRotativo?.fechaDate
                || new Date();

            const endTime = this.calcularEndTime(
                gpsResult?.puntos,
                estabilidadResult?.mediciones,
                rotativoResult?.mediciones
            );

            const sessionId = await this.crearSesionEnBD({
                vehicleId: vehiculo.id,
                userId,
                organizationId,
                startTime,
                endTime,
                sessionNumber: (sesionEstabilidad?.numeroSesion || sesionGPS?.numeroSesion || i + 1),
                source: 'UPLOAD_UNIFIED'
            });

            sessionIds.push(sessionId);

            // 7. Guardar mediciones en BD
            if (gpsInterpolado.length > 0) {
                await this.guardarMedicionesGPS(sessionId, gpsInterpolado);
            }

            if (estabilidadResult?.mediciones && estabilidadResult.mediciones.length > 0) {
                await this.guardarMedicionesEstabilidad(sessionId, estabilidadResult.mediciones);
            }

            if (rotativoResult?.mediciones && rotativoResult.mediciones.length > 0) {
                await this.guardarMedicionesRotativo(sessionId, rotativoResult.mediciones);
            }

            // 8. Guardar estadísticas de calidad
            await this.guardarCalidadDatos(sessionId, {
                gpsTotal: gpsResult?.estadisticas.total || 0,
                gpsValidas: gpsResult?.estadisticas.validas || 0,
                gpsSinSenal: gpsResult?.estadisticas.sinSenal || 0,
                gpsInterpoladas: gpsInterpolado.length - (gpsResult?.puntos.length || 0),
                porcentajeGPSValido: gpsResult?.estadisticas.porcentajeValido || 0,
                estabilidadTotal: estabilidadResult?.estadisticas.total || 0,
                estabilidadValidas: estabilidadResult?.estadisticas.validas || 0,
                rotativoTotal: rotativoResult?.estadisticas.total || 0,
                rotativoValidas: rotativoResult?.estadisticas.validas || 0,
                problemas: [
                    ...(gpsResult?.problemas || []),
                    ...(estabilidadResult?.problemas || []),
                    ...(rotativoResult?.problemas || [])
                ]
            });

            logger.info(`Sesión ${sessionId} creada`, {
                gps: gpsInterpolado.length,
                estabilidad: estabilidadResult?.mediciones.length || 0,
                rotativo: rotativoResult?.mediciones.length || 0
            });
        }

        return {
            sesionesCreadas: numSesiones,
            archivosValidos: (grupo.archivos.estabilidad ? 1 : 0) + (grupo.archivos.gps ? 1 : 0) + (grupo.archivos.rotativo ? 1 : 0),
            sessionIds,
            gpsValidas,
            gpsSinSenal,
            estabilidadValidas,
            rotativoValidas
        };
    }

    /**
     * Busca o crea un vehículo en la BD
     */
    private async buscarOCrearVehiculo(identifier: string, organizationId: string) {
        let vehiculo = await prisma.vehicle.findFirst({
            where: { identifier }
        });

        if (!vehiculo) {
            logger.warn(`Vehículo ${identifier} no encontrado, creando...`);

            vehiculo = await prisma.vehicle.create({
                data: {
                    identifier,
                    name: identifier,
                    model: 'UNKNOWN',
                    licensePlate: 'PENDING',
                    organizationId,
                    type: 'OTHER',
                    status: 'ACTIVE'
                }
            });

            logger.info(`Vehículo ${identifier} creado con ID ${vehiculo.id}`);
        }

        return vehiculo;
    }

    /**
     * Crea una sesión en la BD
     */
    private async crearSesionEnBD(data: {
        vehicleId: string;
        userId: string;
        organizationId: string;
        startTime: Date;
        endTime: Date;
        sessionNumber: number;
        source: string;
    }): Promise<string> {
        const session = await prisma.session.create({
            data: {
                vehicleId: data.vehicleId,
                userId: data.userId,
                organizationId: data.organizationId,
                startTime: data.startTime,
                endTime: data.endTime,
                sessionNumber: data.sessionNumber,
                sequence: data.sessionNumber,
                source: data.source,
                status: 'ACTIVE',
                type: 'ROUTINE'
            }
        });

        return session.id;
    }

    /**
     * Guarda mediciones GPS en BD
     */
    private async guardarMedicionesGPS(sessionId: string, puntos: any[]) {
        if (puntos.length === 0) return;

        // Insertar en lotes de 1000 para no saturar la BD
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
                    hdop: p.hdop,
                    fix: p.fix,
                    satellites: p.satellites,
                    speed: p.speed
                })),
                skipDuplicates: true
            });
        }

        logger.info(`GPS guardado: ${puntos.length} mediciones`);
    }

    /**
     * Guarda mediciones de estabilidad en BD
     */
    private async guardarMedicionesEstabilidad(sessionId: string, mediciones: any[]) {
        if (mediciones.length === 0) return;

        // Insertar en lotes de 1000
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
                    pitch: m.pitch,
                    yaw: m.yaw,
                    si: m.si,
                    accmag: m.accmag
                })),
                skipDuplicates: true
            });
        }

        logger.info(`ESTABILIDAD guardada: ${mediciones.length} mediciones`);
    }

    /**
     * Guarda mediciones de rotativo en BD
     */
    private async guardarMedicionesRotativo(sessionId: string, mediciones: any[]) {
        if (mediciones.length === 0) return;

        await prisma.rotativoMeasurement.createMany({
            data: mediciones.map((m: any) => ({
                sessionId,
                timestamp: m.timestamp,
                state: m.state,
                key: m.key !== undefined && m.key !== null ? m.key : null // Guardar clave operacional si existe
            })),
            skipDuplicates: true
        });

        // Contar cuántas mediciones tienen clave
        const conClave = mediciones.filter(m => m.key !== undefined).length;
        logger.info(`ROTATIVO guardado: ${mediciones.length} mediciones (${conClave} con clave operacional)`);
    }

    /**
     * Guarda métricas de calidad de datos para la sesión
     */
    private async guardarCalidadDatos(sessionId: string, calidad: any) {
        try {
            await prisma.dataQualityMetrics.create({
                data: {
                    sessionId,
                    gpsTotal: calidad.gpsTotal,
                    gpsValidas: calidad.gpsValidas,
                    gpsSinSenal: calidad.gpsSinSenal,
                    gpsInterpoladas: calidad.gpsInterpoladas,
                    porcentajeGPSValido: calidad.porcentajeGPSValido,
                    estabilidadTotal: calidad.estabilidadTotal,
                    estabilidadValidas: calidad.estabilidadValidas,
                    rotativoTotal: calidad.rotativoTotal,
                    rotativoValidas: calidad.rotativoValidas,
                    problemas: calidad.problemas || []
                }
            });

            logger.info(`Métricas de calidad guardadas para sesión ${sessionId}`);

        } catch (error: any) {
            logger.error(`Error guardando métricas de calidad: ${error.message}`);
        }
    }

    /**
     * Calcula el endTime de una sesión basándose en el último timestamp de cualquier tipo de dato
     */
    private calcularEndTime(gps?: any[], estabilidad?: any[], rotativo?: any[]): Date {
        let ultimoTimestamp = new Date(0);

        if (gps && gps.length > 0) {
            const ultimoGPS = gps[gps.length - 1].timestamp;
            if (ultimoGPS > ultimoTimestamp) ultimoTimestamp = ultimoGPS;
        }

        if (estabilidad && estabilidad.length > 0) {
            const ultimoEstabilidad = estabilidad[estabilidad.length - 1].timestamp;
            if (ultimoEstabilidad > ultimoTimestamp) ultimoTimestamp = ultimoEstabilidad;
        }

        if (rotativo && rotativo.length > 0) {
            const ultimoRotativo = rotativo[rotativo.length - 1].timestamp;
            if (ultimoRotativo > ultimoTimestamp) ultimoTimestamp = ultimoRotativo;
        }

        return ultimoTimestamp;
    }
}

export const unifiedFileProcessor = new UnifiedFileProcessor();

