import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';
import { getStabilityEvents } from './StabilityEventService';

const prisma = new PrismaClient();

interface WebfleetReportConfig {
    startDate: Date;
    endDate: Date;
    vehicleIds?: string[];
    organizationId: string;
    reportType: 'detailed' | 'summary';
    title?: string;
    includeCriticalEvents: boolean;
    includeConsumptionAnalysis: boolean;
    fuelReferenceBase: number;
}

interface SessionData {
    id: string;
    vehicleId: string;
    vehicle: any;
    startTime: Date;
    endTime: Date | null;
    sessionNumber: number;
    duration: number; // en minutos
    distance: number; // en km
    startLocation: { lat: number; lon: number; address?: string };
    endLocation: { lat: number; lon: number; address?: string };
    maxSpeed: number; // km/h
    avgSpeed: number; // km/h
    estimatedFuelConsumption: number; // litros
    fuelConsumptionPer100km: number; // l/100km
    criticalEvents: any[];
    eventsSummary: {
        total: number;
        critical: number;
        danger: number;
        moderate: number;
        pointOfInterest: number;
    };
}

interface VehicleSummary {
    vehicleId: string;
    vehicle: any;
    totalSessions: number;
    totalDistance: number;
    totalDuration: number;
    totalStoppedTime: number;
    totalFuelConsumption: number;
    avgFuelConsumption: number;
    sessions: SessionData[];
}

interface GlobalSummary {
    totalSessions: number;
    totalDistance: number;
    totalDuration: number;
    totalStoppedTime: number;
    totalFuelConsumption: number;
    avgFuelConsumption: number;
    totalCriticalEvents: number;
    vehiclesCount: number;
}

interface ReportData {
    globalSummary: GlobalSummary;
    vehiclesData: VehicleSummary[];
    reportPeriod: {
        startDate: Date;
        endDate: Date;
    };
}

export class WebfleetStyleReportService {
    /**
     * Genera un reporte estilo Webfleet Solutions con datos reales
     */
    async generateWebfleetStyleReport(
        config: WebfleetReportConfig
    ): Promise<{ filePath: string; size: number }> {
        try {
            logger.info('=== INICIO WebfleetStyleReportService (DATOS REALES) ===', {
                organizationId: config.organizationId,
                startDate: config.startDate,
                endDate: config.endDate,
                vehicleIds: config.vehicleIds?.length || 'todos'
            });

            // 1. Recopilar datos reales
            const reportData = await this.gatherRealReportData(config);
            logger.info('Datos reales recopilados exitosamente', {
                totalSessions: reportData.globalSummary.totalSessions,
                vehiclesCount: reportData.globalSummary.vehiclesCount,
                totalEvents: reportData.globalSummary.totalCriticalEvents
            });

            // 2. Generar PDF profesional
            const { filePath, size } = await this.buildWebfleetStylePDF(reportData, config);

            logger.info('Reporte Webfleet generado exitosamente', {
                filePath,
                size,
                totalSessions: reportData.globalSummary.totalSessions,
                totalDistance: reportData.globalSummary.totalDistance.toFixed(2),
                totalEvents: reportData.globalSummary.totalCriticalEvents
            });

            return { filePath, size };
        } catch (error) {
            logger.error('Error generando reporte Webfleet:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                config
            });
            throw error;
        }
    }

    /**
     * Recopila todos los datos REALES necesarios para el reporte
     */
    private async gatherRealReportData(config: WebfleetReportConfig): Promise<ReportData> {
        try {
            logger.info('Iniciando recopilación de datos REALES para el reporte');

            // Obtener sesiones REALES del período
            const sessions = await prisma.session.findMany({
                where: {
                    organizationId: config.organizationId,
                    startTime: {
                        gte: config.startDate,
                        lte: config.endDate
                    },
                    ...(config.vehicleIds && config.vehicleIds.length > 0
                        ? { vehicleId: { in: config.vehicleIds } }
                        : {})
                },
                include: {
                    vehicle: true,
                    gpsMeasurements: {
                        orderBy: { timestamp: 'asc' }
                    },
                    canMeasurements: {
                        orderBy: { timestamp: 'asc' }
                    },
                    stabilityMeasurements: {
                        orderBy: { timestamp: 'asc' },
                        take: 10 // Limitamos para performance
                    }
                },
                orderBy: [{ vehicleId: 'asc' }, { startTime: 'asc' }]
            });

            logger.info(`Encontradas ${sessions.length} sesiones REALES para procesar`);

            if (sessions.length === 0) {
                logger.warn('No se encontraron sesiones para el período especificado');
                return {
                    globalSummary: {
                        totalSessions: 0,
                        totalDistance: 0,
                        totalDuration: 0,
                        totalStoppedTime: 0,
                        totalFuelConsumption: 0,
                        avgFuelConsumption: 0,
                        totalCriticalEvents: 0,
                        vehiclesCount: 0
                    },
                    vehiclesData: [],
                    reportPeriod: {
                        startDate: config.startDate,
                        endDate: config.endDate
                    }
                };
            }

            // Procesar datos por vehículo
            const vehiclesData: VehicleSummary[] = [];
            const groupedByVehicle = this.groupSessionsByVehicle(sessions);

            for (const [vehicleId, vehicleSessions] of groupedByVehicle.entries()) {
                logger.info(
                    `Procesando vehículo ${vehicleId} con ${vehicleSessions.length} sesiones REALES`
                );

                const processedSessions: SessionData[] = [];

                for (const session of vehicleSessions) {
                    try {
                        const sessionData = await this.processRealSessionData(session, config);
                        processedSessions.push(sessionData);
                    } catch (error) {
                        logger.warn(`Error procesando sesión ${session.id}:`, error);
                        continue;
                    }
                }

                // Calcular resumen del vehículo
                const vehicleSummary: VehicleSummary = {
                    vehicleId,
                    vehicle: vehicleSessions[0].vehicle,
                    totalSessions: processedSessions.length,
                    totalDistance: processedSessions.reduce((sum, s) => sum + s.distance, 0),
                    totalDuration: processedSessions.reduce((sum, s) => sum + s.duration, 0),
                    totalStoppedTime: 0,
                    totalFuelConsumption: processedSessions.reduce(
                        (sum, s) => sum + s.estimatedFuelConsumption,
                        0
                    ),
                    avgFuelConsumption: 0,
                    sessions: processedSessions
                };

                // Calcular consumo promedio
                vehicleSummary.avgFuelConsumption =
                    vehicleSummary.totalDistance > 0
                        ? (vehicleSummary.totalFuelConsumption / vehicleSummary.totalDistance) * 100
                        : 0;

                vehiclesData.push(vehicleSummary);
            }

            logger.info(`Procesamiento completado. ${vehiclesData.length} vehículos procesados`);

            // Calcular resumen global
            const globalSummary: GlobalSummary = {
                totalSessions: vehiclesData.reduce((sum, v) => sum + v.totalSessions, 0),
                totalDistance: vehiclesData.reduce((sum, v) => sum + v.totalDistance, 0),
                totalDuration: vehiclesData.reduce((sum, v) => sum + v.totalDuration, 0),
                totalStoppedTime: vehiclesData.reduce((sum, v) => sum + v.totalStoppedTime, 0),
                totalFuelConsumption: vehiclesData.reduce(
                    (sum, v) => sum + v.totalFuelConsumption,
                    0
                ),
                avgFuelConsumption: 0,
                totalCriticalEvents: vehiclesData.reduce(
                    (sum, v) =>
                        sum +
                        v.sessions.reduce(
                            (sessionSum, s) => sessionSum + s.eventsSummary.critical,
                            0
                        ),
                    0
                ),
                vehiclesCount: vehiclesData.length
            };

            globalSummary.avgFuelConsumption =
                globalSummary.totalDistance > 0
                    ? (globalSummary.totalFuelConsumption / globalSummary.totalDistance) * 100
                    : 0;

            logger.info('Resumen global calculado:', globalSummary);

            return {
                globalSummary,
                vehiclesData,
                reportPeriod: {
                    startDate: config.startDate,
                    endDate: config.endDate
                }
            };
        } catch (error) {
            logger.error('Error en gatherRealReportData:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                config
            });
            throw error;
        }
    }

    /**
     * Procesa una sesión real con datos corregidos
     */
    private async processRealSessionData(
        session: any,
        config: WebfleetReportConfig
    ): Promise<SessionData> {
        // Obtener datos GPS FILTRADOS (eliminar coordenadas erróneas)
        const gpsPoints = await prisma.gpsMeasurement.findMany({
            where: { sessionId: session.id },
            orderBy: { timestamp: 'asc' }
        });

        // FILTRAR GPS erróneos (coordenadas válidas para Madrid/España)
        const validGpsPoints = gpsPoints.filter((point: any) => {
            return (
                point.latitude >= 35 &&
                point.latitude <= 45 && // España continental
                point.longitude >= -10 &&
                point.longitude <= 5 && // España continental
                point.speed !== null &&
                point.speed < 200
            ); // Velocidad realista
        });

        logger.info(`GPS filtrado: ${gpsPoints.length} → ${validGpsPoints.length} puntos válidos`);

        if (validGpsPoints.length === 0) {
            logger.warn(`No hay datos GPS válidos para sesión ${session.id}`);
            // Retornar datos mínimos
            return this.createMinimalSessionData(session);
        }

        const firstGps = validGpsPoints[0];
        const lastGps = validGpsPoints[validGpsPoints.length - 1];

        // Calcular duración REAL
        const duration = session.endTime
            ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
            : 0;

        // Calcular distancia REAL con filtrado de saltos grandes
        const distance = this.calculateFilteredDistance(validGpsPoints);

        // Calcular velocidades REALES desde datos GPS válidos
        const speeds = validGpsPoints
            .map((p: any) => p.speed || 0)
            .filter((s: number) => s > 0 && s < 200);
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
        const avgSpeed =
            speeds.length > 0
                ? speeds.reduce((sum: number, s: number) => sum + s, 0) / speeds.length
                : 0;

        // Estimar consumo REALISTA
        const estimatedFuelConsumption = this.estimateRealisticFuelConsumption(
            distance,
            avgSpeed,
            maxSpeed,
            duration
        );
        const fuelConsumptionPer100km =
            distance > 0 ? (estimatedFuelConsumption / distance) * 100 : 0;

        // Obtener eventos REALES con clasificación correcta
        let criticalEvents: any[] = [];
        let eventsSummary = { total: 0, critical: 0, danger: 0, moderate: 0, pointOfInterest: 0 };

        if (config.includeCriticalEvents) {
            try {
                const realEvents = await getStabilityEvents(session.id, {});

                // Añadir geocodificación a cada evento
                for (const event of realEvents) {
                    if (event.lat && event.lon) {
                        event.address = await this.reverseGeocode(event.lat, event.lon);
                    }
                }

                criticalEvents = realEvents;
                eventsSummary = this.classifyEventsCorrectly(realEvents);

                logger.info(
                    `Sesión ${session.id}: ${realEvents.length} eventos encontrados (${eventsSummary.critical} críticos, ${eventsSummary.moderate} moderados, ${eventsSummary.pointOfInterest} puntos de interés)`
                );
            } catch (error) {
                logger.warn(`Error obteniendo eventos para sesión ${session.id}:`, error);
            }
        }

        // Geocodificación de ubicaciones REALES
        const startAddress = await this.reverseGeocode(firstGps?.latitude, firstGps?.longitude);
        const endAddress = await this.reverseGeocode(lastGps?.latitude, lastGps?.longitude);

        return {
            id: session.id,
            vehicleId: session.vehicleId,
            vehicle: session.vehicle,
            startTime: session.startTime,
            endTime: session.endTime,
            sessionNumber: session.sessionNumber,
            duration,
            distance,
            startLocation: {
                lat: firstGps?.latitude || 0,
                lon: firstGps?.longitude || 0,
                address: startAddress
            },
            endLocation: {
                lat: lastGps?.latitude || 0,
                lon: lastGps?.longitude || 0,
                address: endAddress
            },
            maxSpeed,
            avgSpeed,
            estimatedFuelConsumption,
            fuelConsumptionPer100km,
            criticalEvents,
            eventsSummary
        };
    }

    /**
     * Crea datos mínimos cuando no hay GPS válidos
     */
    private createMinimalSessionData(session: any): SessionData {
        return {
            id: session.id,
            vehicleId: session.vehicleId,
            vehicle: session.vehicle,
            startTime: session.startTime,
            endTime: session.endTime,
            sessionNumber: session.sessionNumber,
            duration: session.endTime
                ? Math.round(
                      (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
                  )
                : 0,
            distance: 0,
            startLocation: { lat: 0, lon: 0, address: 'Datos GPS no disponibles' },
            endLocation: { lat: 0, lon: 0, address: 'Datos GPS no disponibles' },
            maxSpeed: 0,
            avgSpeed: 0,
            estimatedFuelConsumption: 0,
            fuelConsumptionPer100km: 0,
            criticalEvents: [],
            eventsSummary: { total: 0, critical: 0, danger: 0, moderate: 0, pointOfInterest: 0 }
        };
    }

    /**
     * Calcula distancia filtrando saltos grandes irreales
     */
    private calculateFilteredDistance(gpsPoints: any[]): number {
        if (gpsPoints.length < 2) return 0;

        let totalDistance = 0;
        const MAX_JUMP_KM = 2; // Máximo salto permitido entre puntos consecutivos

        for (let i = 1; i < gpsPoints.length; i++) {
            const prev = gpsPoints[i - 1];
            const curr = gpsPoints[i];

            if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
                const distance = this.haversineDistance(
                    prev.latitude,
                    prev.longitude,
                    curr.latitude,
                    curr.longitude
                );

                // Solo sumar si es un salto realista
                if (distance <= MAX_JUMP_KM) {
                    totalDistance += distance;
                } else {
                    logger.warn(`Salto GPS grande ignorado: ${distance.toFixed(4)} km`);
                }
            }
        }

        return totalDistance;
    }

    /**
     * Clasifica eventos correctamente por severidad real
     */
    private classifyEventsCorrectly(events: any[]): {
        total: number;
        critical: number;
        danger: number;
        moderate: number;
        pointOfInterest: number;
    } {
        const summary = {
            total: events.length,
            critical: 0,
            danger: 0,
            moderate: 0,
            pointOfInterest: 0
        };

        for (const event of events) {
            const level = event.level || 'moderate';

            switch (level) {
                case 'critical':
                case 'critico':
                    summary.critical++;
                    break;
                case 'danger':
                case 'peligro':
                    summary.danger++;
                    break;
                case 'moderate':
                case 'moderado':
                    summary.moderate++;
                    break;
                case 'punto_interes':
                case 'point_of_interest':
                    summary.pointOfInterest++;
                    break;
                default:
                    summary.moderate++; // Default a moderado
            }
        }

        return summary;
    }

    /**
     * Estimación realista de combustible
     */
    private estimateRealisticFuelConsumption(
        distance: number,
        avgSpeed: number,
        maxSpeed: number,
        duration: number
    ): number {
        if (distance === 0) return 0;

        // Consumo base realista para vehículos comerciales
        let baseConsumptionPer100km = 8.5; // l/100km

        // Ajustar por velocidad promedio (realista)
        if (avgSpeed < 20) {
            baseConsumptionPer100km *= 1.3; // +30% ciudad/tráfico
        } else if (avgSpeed < 50) {
            baseConsumptionPer100km *= 1.0; // Base carretera
        } else if (avgSpeed < 90) {
            baseConsumptionPer100km *= 1.1; // +10% autopista
        } else {
            baseConsumptionPer100km *= 1.2; // +20% alta velocidad
        }

        // Factor por conducción agresiva moderado
        const speedVariation = maxSpeed > 0 ? maxSpeed / Math.max(avgSpeed, 1) : 1;
        let aggressionFactor = 1.0;

        if (speedVariation > 2.0) {
            aggressionFactor = 1.1; // +10% conducción agresiva
        }

        return (distance * baseConsumptionPer100km * aggressionFactor) / 100;
    }

    /**
     * Agrupa sesiones por vehículo
     */
    private groupSessionsByVehicle(sessions: any[]): Map<string, any[]> {
        const grouped = new Map<string, any[]>();

        for (const session of sessions) {
            const vehicleId = session.vehicleId;
            if (!grouped.has(vehicleId)) {
                grouped.set(vehicleId, []);
            }
            grouped.get(vehicleId)!.push(session);
        }

        return grouped;
    }

    /**
     * Fórmula de Haversine para calcular distancia entre dos puntos GPS
     */
    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Geocodificación inversa usando OpenStreetMap Nominatim
     */
    private async reverseGeocode(lat?: number, lon?: number): Promise<string> {
        if (!lat || !lon) return 'Ubicación no disponible';

        try {
            // Usar Nominatim de OpenStreetMap (gratuito)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'DobackSoft-FleetManagement/1.0'
                    }
                }
            );

            if (response.ok) {
                const data: any = await response.json();

                if (data && data.display_name) {
                    // Extraer partes relevantes de la dirección
                    const address: any = data.address || {};
                    const parts = [];

                    if (address.road) parts.push(address.road);
                    if (address.house_number) parts.push(address.house_number);
                    if (address.suburb || address.neighbourhood)
                        parts.push(address.suburb || address.neighbourhood);
                    if (address.city || address.town || address.village)
                        parts.push(address.city || address.town || address.village);

                    return parts.length > 0
                        ? parts.join(', ')
                        : data.display_name.split(',').slice(0, 3).join(',');
                }
            }
        } catch (error) {
            logger.warn('Error en geocodificación:', error);
        }

        // Fallback a coordenadas si falla la geocodificación
        return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }

    /**
     * Construye el PDF con estilo Webfleet (menos colorido)
     */
    private async buildWebfleetStylePDF(
        data: ReportData,
        config: WebfleetReportConfig
    ): Promise<{ filePath: string; size: number }> {
        const REPORTS_DIR = process.env.REPORTS_DIR || path.resolve('./reports');

        if (!fs.existsSync(REPORTS_DIR)) {
            fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }

        const fileName = `webfleet-style-report-${Date.now()}.pdf`;
        const filePath = path.join(REPORTS_DIR, fileName);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 40,
                    info: {
                        Title: config.title || 'Informe de viajes (detallado)',
                        Author: 'DobackSoft - Sistema de Gestión de Flotas',
                        Subject: 'Análisis Detallado de Sesiones de Conducción',
                        CreationDate: new Date()
                    }
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Construir secciones del reporte
                this.buildSimpleHeader(doc, data, config);
                this.buildSimpleSummary(doc, data.globalSummary);

                // Sección por vehículo
                data.vehiclesData.forEach((vehicleData: VehicleSummary, index: number) => {
                    if (index > 0) doc.addPage();
                    this.buildSimpleVehicleSection(doc, vehicleData, config);
                });

                doc.end();

                stream.on('finish', () => {
                    const stats = fs.statSync(filePath);
                    resolve({ filePath, size: stats.size });
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Header simple estilo Webfleet (sin tantos colores)
     */
    private buildSimpleHeader(
        doc: PDFKit.PDFDocument,
        data: ReportData,
        config: WebfleetReportConfig
    ) {
        // Header simple con fondo gris
        doc.rect(0, 0, 595, 120).fillColor('#F5F5F5').fill();

        // Título principal
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C3E50').text('DOBACK SOFT', 50, 30);

        doc.fontSize(12)
            .font('Helvetica')
            .fillColor('#6B7280')
            .text('Sistema de Gestión de Flotas', 50, 55);

        // Título del reporte
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#374151')
            .text('Informe de viajes (detallado)', 50, 80);

        // Información del período en el lado derecho
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#6B7280')
            .text(
                `Período: ${config.startDate.toLocaleDateString(
                    'es-ES'
                )} - ${config.endDate.toLocaleDateString('es-ES')}`,
                350,
                35
            )
            .text(`Conductor: Todos los conductores`, 350, 50)
            .text(
                `Vehículos: ${
                    config.vehicleIds && config.vehicleIds.length > 0
                        ? config.vehicleIds.length + ' seleccionados'
                        : 'Todos'
                }`,
                350,
                65
            )
            .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 350, 80);

        // Línea separadora
        doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#D1D5DB').lineWidth(1).stroke();

        doc.y = 150;
    }

    /**
     * Resumen simple con datos reales
     */
    private buildSimpleSummary(doc: PDFKit.PDFDocument, summary: GlobalSummary) {
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#374151')
            .text('RESUMEN GLOBAL DEL PERÍODO', 50, doc.y);

        const startY = doc.y + 25;

        // Datos en formato simple (menos colorido)
        doc.fontSize(11).font('Helvetica').fillColor('#4B5563');

        // Primera línea
        doc.text(`Total de viajes: ${summary.totalSessions}`, 60, startY);
        doc.text(`Distancia total: ${summary.totalDistance.toFixed(1)} km`, 200, startY);
        doc.text(
            `Duración total: ${Math.floor(summary.totalDuration / 60)}h ${
                summary.totalDuration % 60
            }min`,
            340,
            startY
        );

        // Segunda línea
        doc.text(`Consumo total: ${summary.totalFuelConsumption.toFixed(2)} l`, 60, startY + 20);
        doc.text(
            `Consumo medio: ${summary.avgFuelConsumption.toFixed(1)} l/100km`,
            200,
            startY + 20
        );
        doc.text(`Eventos críticos: ${summary.totalCriticalEvents}`, 340, startY + 20);

        // Tercera línea
        doc.text(`Vehículos: ${summary.vehiclesCount}`, 60, startY + 40);
        doc.text(
            `Promedio por viaje: ${(
                summary.totalDistance / Math.max(summary.totalSessions, 1)
            ).toFixed(1)} km`,
            200,
            startY + 40
        );

        doc.y = startY + 70;

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').lineWidth(1).stroke();

        doc.y += 20;
    }

    /**
     * Sección simple de vehículo
     */
    private buildSimpleVehicleSection(
        doc: PDFKit.PDFDocument,
        vehicleData: VehicleSummary,
        config: WebfleetReportConfig
    ) {
        // Header del vehículo simple
        const headerY = doc.y;
        doc.rect(50, headerY, 495, 25)
            .fillColor('#F9FAFB')
            .fill()
            .strokeColor('#E5E7EB')
            .lineWidth(1)
            .stroke();

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#374151')
            .text(
                `${vehicleData.vehicle?.licensePlate || 'N/A'} - ${
                    vehicleData.vehicle?.brand || ''
                } ${vehicleData.vehicle?.model || ''}`,
                60,
                headerY + 7
            );

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#6B7280')
            .text(
                `${vehicleData.totalSessions} viajes • ${vehicleData.totalDistance.toFixed(
                    1
                )} km • ${vehicleData.avgFuelConsumption.toFixed(1)} l/100km`,
                350,
                headerY + 9
            );

        doc.y = headerY + 35;

        // Tabla simple de sesiones
        this.buildSimpleSessionsTable(doc, vehicleData.sessions, config);
    }

    /**
     * Tabla simple de sesiones (estilo Webfleet original)
     */
    private buildSimpleSessionsTable(
        doc: PDFKit.PDFDocument,
        sessions: SessionData[],
        config: WebfleetReportConfig
    ) {
        if (sessions.length === 0) {
            doc.fontSize(11)
                .fillColor('#6B7280')
                .text(
                    'No hay sesiones registradas para este vehículo en el período seleccionado.',
                    60,
                    doc.y
                );
            doc.y += 40;
            return;
        }

        const tableHeaders = [
            'Fecha/Hora',
            'Duración',
            'Distancia',
            'Velocidades',
            'Ubicación inicio',
            'Ubicación fin',
            'Consumo',
            'Eventos'
        ];

        const columnWidths = [75, 45, 50, 60, 95, 95, 65, 50];
        let currentY = doc.y;

        // Header simple de la tabla
        doc.rect(50, currentY, 535, 18)
            .fillColor('#F3F4F6')
            .fill()
            .strokeColor('#D1D5DB')
            .lineWidth(1)
            .stroke();

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
        let currentX = 55;

        tableHeaders.forEach((header, index) => {
            doc.text(header, currentX, currentY + 5, {
                width: columnWidths[index] - 10,
                align: 'center'
            });
            currentX += columnWidths[index];
        });

        currentY += 20;

        // Línea separadora
        doc.moveTo(50, currentY).lineTo(585, currentY).strokeColor('#D1D5DB').lineWidth(1).stroke();

        currentY += 3;

        // Datos de sesiones
        sessions.forEach((session, index) => {
            currentX = 55;

            // Preparar datos de la fila
            const startTime = session.startTime.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const endTime =
                session.endTime?.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                }) || 'N/A';

            const rowData = [
                `${startTime}\n${endTime}`,
                `${session.duration} min`,
                `${session.distance.toFixed(1)} km`,
                `Max: ${session.maxSpeed.toFixed(0)}\nMed: ${session.avgSpeed.toFixed(0)}`,
                this.truncateAddress(session.startLocation.address || 'Sin datos GPS'),
                this.truncateAddress(session.endLocation.address || 'Sin datos GPS'),
                `${session.estimatedFuelConsumption.toFixed(
                    2
                )}l\n${session.fuelConsumptionPer100km.toFixed(1)}l/100km`,
                this.formatEventsSummary(session.eventsSummary)
            ];

            doc.fontSize(7).font('Helvetica').fillColor('#4B5563');

            rowData.forEach((data, colIndex) => {
                // Solo resaltar consumo anómalo (sin colores llamativos)
                if (colIndex === 6) {
                    const consumption = session.fuelConsumptionPer100km;
                    const reference = config.fuelReferenceBase;
                    if (Math.abs(consumption - reference) > 1.0) {
                        doc.fillColor('#DC2626'); // Solo texto rojo
                    }
                }

                // Resaltar eventos críticos
                if (colIndex === 7 && session.eventsSummary.critical > 0) {
                    doc.fillColor('#DC2626');
                }

                doc.text(data, currentX, currentY, {
                    width: columnWidths[colIndex] - 10,
                    align: 'center',
                    lineGap: 1
                });

                currentX += columnWidths[colIndex];

                // Resetear color
                doc.fillColor('#4B5563');
            });

            currentY += 16;

            // Añadir detalles de eventos críticos después de cada sesión
            if (session.criticalEvents && session.criticalEvents.length > 0) {
                currentY += 5;
                currentY = this.buildCriticalEventsDetails(doc, session.criticalEvents, currentY);
                currentY += 10;
            }

            // Nueva página si es necesario
            if (currentY > 720) {
                doc.addPage();
                currentY = 50;
            }
        });

        // Línea final
        doc.moveTo(50, currentY).lineTo(585, currentY).strokeColor('#E5E7EB').lineWidth(1).stroke();

        doc.y = currentY + 15;
    }

    /**
     * Trunca direcciones largas para que quepan en la tabla
     */
    private truncateAddress(address: string): string {
        if (address.length <= 25) return address;
        return address.substring(0, 22) + '...';
    }

    /**
     * Construye los detalles completos de eventos con información profesional de estabilidad
     */
    private buildCriticalEventsDetails(
        doc: PDFKit.PDFDocument,
        events: any[],
        startY: number
    ): number {
        let currentY = startY;

        // Clasificar eventos por tipo
        const eventsByType = this.groupEventsByType(events);
        const hasOnlyCritical = events.every((e) => e.level === 'critical');

        // Título dinámico según el tipo de eventos
        const sectionTitle = hasOnlyCritical
            ? `EVENTOS CRÍTICOS (${events.length})`
            : `ANÁLISIS DE EVENTOS DE ESTABILIDAD (${events.length})`;

        // Título de la sección
        const headerColor = hasOnlyCritical ? '#FEF2F2' : '#F0F9FF';
        const borderColor = hasOnlyCritical ? '#FCA5A5' : '#93C5FD';
        const textColor = hasOnlyCritical ? '#DC2626' : '#1E40AF';

        doc.rect(55, currentY, 485, 15)
            .fillColor(headerColor)
            .fill()
            .strokeColor(borderColor)
            .lineWidth(1)
            .stroke();

        doc.fontSize(8)
            .font('Helvetica-Bold')
            .fillColor(textColor)
            .text(sectionTitle, 60, currentY + 4);

        currentY += 20;

        // Resumen por categorías si hay eventos mixtos
        if (!hasOnlyCritical) {
            currentY = this.buildEventCategorySummary(doc, eventsByType, currentY);
        }

        // Detalles de cada evento
        events.forEach((event, index) => {
            currentY = this.buildSingleEventDetails(doc, event, index + 1, currentY);

            // Control de página
            if (currentY > 680) {
                doc.addPage();
                currentY = 50;
            }
        });

        return currentY;
    }

    /**
     * Agrupa eventos por tipo para resumen
     */
    private groupEventsByType(events: any[]): { [key: string]: number } {
        const types: { [key: string]: number } = {};

        events.forEach((event) => {
            const level = event.level || 'moderado';
            types[level] = (types[level] || 0) + 1;
        });

        return types;
    }

    /**
     * Construye resumen por categorías de eventos
     */
    private buildEventCategorySummary(
        doc: PDFKit.PDFDocument,
        eventsByType: { [key: string]: number },
        startY: number
    ): number {
        let currentY = startY;

        doc.fontSize(7)
            .font('Helvetica-Bold')
            .fillColor('#4B5563')
            .text('DISTRIBUCIÓN POR SEVERIDAD:', 60, currentY);

        currentY += 12;

        Object.entries(eventsByType).forEach(([type, count]) => {
            const color = this.getEventTypeColor(type);
            const displayName = this.getEventTypeDisplayName(type);

            doc.fontSize(6)
                .font('Helvetica')
                .fillColor(color)
                .text(`• ${displayName}: ${count}`, 70, currentY, { width: 200 });

            currentY += 10;
        });

        currentY += 10;
        return currentY;
    }

    /**
     * Construye detalles completos de un evento individual
     */
    private buildSingleEventDetails(
        doc: PDFKit.PDFDocument,
        event: any,
        eventNumber: number,
        startY: number
    ): number {
        let currentY = startY;

        // Header del evento con color según severidad y clasificación en la misma línea
        const severity = event.level || 'moderado';
        const eventColor = this.getEventTypeColor(severity);
        const eventDisplayName = this.getEventTypeDisplayName(severity);
        const eventTime = this.getEventTimeText(event);
        const eventTypes =
            event.tipos && event.tipos.length > 0
                ? event.tipos.map((tipo: string) => this.getEventTypeDescription(tipo)).join(', ')
                : '';

        // Header con evento, fecha y clasificación en una línea
        doc.fontSize(7)
            .font('Helvetica-Bold')
            .fillColor(eventColor)
            .text(`Evento #${eventNumber} - ${eventDisplayName.toUpperCase()}`, 55, currentY);

        doc.fontSize(6)
            .font('Helvetica')
            .fillColor('#4B5563')
            .text(`Fecha/Hora: ${eventTime}`, 200, currentY);

        if (eventTypes) {
            doc.fontSize(6).font('Helvetica').fillColor('#DC2626').text(eventTypes, 350, currentY);
        }

        currentY += 12;

        // Obtener dirección geocodificada
        const eventLocation = this.getEventLocationText(event);

        // Datos divididos en dos columnas
        const leftColumnData = [
            `Ubicación: ${eventLocation}`,
            `Velocidad: ${event.can?.vehicleSpeed || 'N/A'} km/h`,
            `Índice SI: ${event.valores?.si || 'N/A'} ${event.perc ? `(${event.perc}%)` : ''}`
        ];

        const rightColumnData = [
            `Velocidad Angular (yaw): ${event.valores?.yaw || 'N/A'} °/s`,
            `Aceleración Lateral (ay): ${event.valores?.ay || 'N/A'} m/s²`,
            `Rotativo: ${event.can?.rotativo ? 'ENCENDIDO' : 'APAGADO'}`
        ];

        // Mostrar columna izquierda
        leftColumnData.forEach((info, i) => {
            doc.fontSize(6)
                .font('Helvetica')
                .fillColor('#4B5563')
                .text(info, 55, currentY + i * 8, { width: 240 });
        });

        // Mostrar columna derecha
        rightColumnData.forEach((info, i) => {
            // Resaltar estado del rotativo
            const color = info.includes('ENCENDIDO')
                ? '#059669'
                : info.includes('APAGADO')
                ? '#DC2626'
                : '#4B5563';

            doc.fontSize(6)
                .font('Helvetica')
                .fillColor(color)
                .text(info, 310, currentY + i * 8, { width: 240 });
        });

        const maxRows = Math.max(leftColumnData.length, rightColumnData.length);
        currentY += maxRows * 8 + 6;

        // Separador entre eventos
        doc.moveTo(55, currentY)
            .lineTo(540, currentY)
            .strokeColor('#E5E7EB')
            .lineWidth(0.5)
            .stroke();

        currentY += 4;

        return currentY;
    }

    /**
     * Obtiene color según tipo de evento
     */
    private getEventTypeColor(type: string): string {
        switch (type.toLowerCase()) {
            case 'critical':
            case 'critico':
                return '#DC2626'; // Rojo
            case 'danger':
            case 'peligro':
                return '#EA580C'; // Naranja
            case 'moderate':
            case 'moderado':
                return '#D97706'; // Amarillo oscuro
            case 'punto_interes':
            case 'point_of_interest':
                return '#2563EB'; // Azul
            default:
                return '#6B7280'; // Gris
        }
    }

    /**
     * Obtiene nombre legible del tipo de evento
     */
    private getEventTypeDisplayName(type: string): string {
        switch (type.toLowerCase()) {
            case 'critical':
            case 'critico':
                return 'Crítico';
            case 'danger':
            case 'peligro':
                return 'Peligro';
            case 'moderate':
            case 'moderado':
                return 'Moderado';
            case 'punto_interes':
            case 'point_of_interest':
                return 'Punto de Interés';
            default:
                return 'Desconocido';
        }
    }

    /**
     * Obtiene descripción técnica del tipo de evento de estabilidad
     */
    private getEventTypeDescription(tipo: string): string {
        switch (tipo.toLowerCase()) {
            case 'curva_brusca':
                return 'Curva brusca/maniobra lateral agresiva';
            case 'pendiente_lateral':
                return 'Pendiente lateral/inclinación del vehículo';
            case 'terreno_irregular':
                return 'Terreno irregular/vibraciones';
            case 'frenada_brusca':
                return 'Frenada brusca/deceleración excesiva';
            case 'aceleracion_brusca':
                return 'Aceleración brusca/arranque agresivo';
            case 'riesgo_de_vuelco':
                return 'Riesgo de vuelco/estabilidad comprometida';
            case 'vuelco_inminente':
                return 'Vuelco inminente/situación crítica';
            case 'maniobra_brusca':
                return 'Maniobra brusca/cambio de dirección agresivo';
            default:
                return tipo.replace(/_/g, ' ');
        }
    }

    /**
     * Obtiene el texto de ubicación del evento
     */
    private getEventLocationText(event: any): string {
        if (event.address) {
            return event.address;
        }
        if (event.lat && event.lon) {
            return `${event.lat.toFixed(6)}, ${event.lon.toFixed(6)}`;
        }
        return 'Ubicación no disponible';
    }

    /**
     * Obtiene el texto de tiempo del evento
     */
    private getEventTimeText(event: any): string {
        if (event.timestamp) {
            return new Date(event.timestamp).toLocaleString('es-ES');
        }
        if (event.created_at) {
            return new Date(event.created_at).toLocaleString('es-ES');
        }
        if (event.datetime) {
            return new Date(event.datetime).toLocaleString('es-ES');
        }
        return 'Tiempo no disponible';
    }

    /**
     * Formatea el resumen de eventos para la tabla
     */
    private formatEventsSummary(eventsSummary: any): string {
        const parts = [];

        if (eventsSummary.critical > 0) {
            parts.push(`${eventsSummary.critical}C`);
        }
        if (eventsSummary.moderate > 0) {
            parts.push(`${eventsSummary.moderate}M`);
        }
        if (eventsSummary.pointOfInterest > 0) {
            parts.push(`${eventsSummary.pointOfInterest}P`);
        }

        const summary = parts.length > 0 ? parts.join(' ') : '0';
        return `${eventsSummary.total} total\n${summary}`;
    }
}

export const webfleetStyleReportService = new WebfleetStyleReportService();
