import { Request, Response } from 'express';
import { RadarAdapter } from '../adapters/radar.adapter';
import {
    EventDTO,
    GeofenceDTO,
    TelemetryPointDTO,
    TelemetrySessionDTO
} from '../types/telemetry';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

export class TelemetryV2Controller {
    /**
     * GET /api/telemetry/sessions
     * Obtiene sesiones de telemetría con filtros
     */
    getSessions = async (req: Request, res: Response) => {
        try {
            const { from, to, vehicleId, page = 1, limit = 20 } = req.query;

            // ✅ FALLBACK completo para orgId
            const orgId = req.orgId || (req as any).user?.organizationId;

            logger.info('TelemetryV2Controller.getSessions called', {
                orgId,
                orgIdFromAttach: req.orgId,
                orgIdFromUser: (req as any).user?.organizationId,
                query: req.query,
                user: req.user
            });

            if (!orgId) {
                logger.error('Organization ID no encontrado después de fallback', {
                    orgIdFromAttach: req.orgId,
                    orgIdFromUser: (req as any).user?.organizationId,
                    user: (req as any).user,
                    hasAuthHeader: !!req.headers.authorization
                });
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID requerido'
                });
            }

            const where: any = {
                organizationId: orgId
            };

            if (vehicleId) {
                where.vehicleId = vehicleId as string;
            }

            if (from || to) {
                where.startTime = {};
                if (from) where.startTime.gte = new Date(from as string);
                if (to) where.startTime.lte = new Date(to as string);
            }

            logger.info('Consultando sesiones con filtros', { where });

            // ✅ CHATGPT CRÍTICO 2: Paginación completa con total
            const [sessions, total] = await Promise.all([
                prisma.session.findMany({
                    where,
                    include: {
                        Vehicle: {  // ✅ Mayúscula
                            select: {
                                name: true,
                                licensePlate: true
                            }
                        },
                        GpsMeasurement: {  // ✅ Mayúscula
                            select: {
                                latitude: true,
                                longitude: true,
                                speed: true,
                                timestamp: true
                            },
                            orderBy: {
                                timestamp: 'asc'
                            }
                        },
                        _count: {
                            select: {
                                GpsMeasurement: true  // ✅ Mayúscula
                            }
                        }
                    },
                    orderBy: {
                        startTime: 'desc'
                    },
                    skip: (Number(page) - 1) * Number(limit),
                    take: Number(limit)
                }),
                prisma.session.count({ where })
            ]);

            const totalPages = Math.ceil(total / Number(limit));

            logger.info('Sesiones encontradas', {
                count: sessions.length,
                total,
                page: Number(page),
                totalPages
            });

            const sessionsDTO: TelemetrySessionDTO[] = sessions.map(session => {
                // Calcular bbox de los puntos GPS
                const bbox = this.calculateBbox(session.GpsMeasurement || []);  // ✅ Mayúscula

                // Calcular resumen
                const summary = this.calculateSessionSummary(session);

                return {
                    id: session.id,
                    orgId: session.organizationId,
                    vehicleId: session.vehicleId,
                    startedAt: session.startTime.toISOString(),
                    endedAt: session.endTime?.toISOString(),
                    pointsCount: session._count.GpsMeasurement,  // ✅ Mayúscula
                    bbox,
                    summary
                };
            });

            // ✅ CHATGPT CRÍTICO 2: Respuesta con metadata de paginación
            return res.json({
                success: true,
                data: sessionsDTO,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages,
                    hasMore: Number(page) < totalPages
                }
            });
        } catch (error: any) {
            // ✅ Control de errores global mejorado
            logger.error('Error en TelemetryV2Controller.getSessions', {
                error: error.message,
                stack: error.stack,
                query: req.query,
                orgId: req.orgId
            });
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    };

    /**
     * GET /api/telemetry/sessions/:id
     * Obtiene una sesión específica
     */
    getSession = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            // ✅ FALLBACK para orgId
            const orgId = req.orgId || (req as any).user?.organizationId;

            if (!orgId) {
                logger.error('Organization ID no encontrado en getSession');
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID requerido'
                });
            }

            const session = await prisma.session.findFirst({
                where: {
                    id,
                    organizationId: orgId
                },
                include: {
                    vehicle: {
                        select: {
                            name: true,
                            licensePlate: true
                        }
                    },
                    gpsMeasurements: {
                        select: {
                            latitude: true,
                            longitude: true,
                            speed: true,
                            timestamp: true
                        },
                        orderBy: {
                            timestamp: 'asc'
                        }
                    },
                    _count: {
                        select: {
                            gpsMeasurements: true
                        }
                    }
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión no encontrada'
                });
            }

            const bbox = this.calculateBbox(session.GpsMeasurement || []);  // ✅ Mayúscula
            const summary = this.calculateSessionSummary(session);

            const sessionDTO: TelemetrySessionDTO = {
                id: session.id,
                orgId: session.organizationId,
                vehicleId: session.vehicleId,
                startedAt: session.startTime.toISOString(),
                endedAt: session.endTime?.toISOString(),
                pointsCount: session._count.GpsMeasurement,  // ✅ Mayúscula
                bbox,
                summary
            };

            return res.json({
                success: true,
                data: sessionDTO
            });
        } catch (error: any) {
            logger.error('Error en TelemetryV2Controller.getSession', {
                error: error.message,
                stack: error.stack,
                sessionId: req.params.id
            });
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    };

    /**
     * GET /api/telemetry/sessions/:id/points
     * Obtiene puntos de una sesión con opción de downsample
     */
    getSessionPoints = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { downsample = '10s' } = req.query;
            // ✅ FALLBACK para orgId
            const orgId = req.orgId || (req as any).user?.organizationId;

            if (!orgId) {
                logger.error('Organization ID no encontrado en getSessionPoints');
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID requerido'
                });
            }

            const session = await prisma.session.findFirst({
                where: {
                    id,
                    organizationId: orgId
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión no encontrada'
                });
            }

            let points = await prisma.gpsMeasurement.findMany({
                where: {
                    sessionId: id
                },
                orderBy: {
                    timestamp: 'asc'
                }
            });

            // Aplicar downsample si es necesario
            if (downsample !== 'none') {
                points = this.applyDownsample(points, downsample as string);
            }

            const pointsDTO: TelemetryPointDTO[] = points.map(point => ({
                ts: point.timestamp.toISOString(),
                lat: point.latitude,
                lng: point.longitude,
                speed: point.speed,
                heading: point.heading ?? undefined,
                can: undefined // Los datos CAN se obtienen por separado si es necesario
            }));

            return res.json({
                success: true,
                data: pointsDTO
            });
        } catch (error: any) {
            logger.error('Error en TelemetryV2Controller.getSessionPoints', {
                error: error.message,
                stack: error.stack,
                sessionId: req.params.id
            });
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: error.message
            });
        }
    };

    /**
     * GET /api/telemetry/events/list
     * Obtiene eventos con filtros
     */
    getEvents = async (req: Request, res: Response) => {
        try {
            const { sessionId, type, severity, geofenceId, from, to, vehicleId } = req.query;
            const orgId = req.orgId;

            const where: any = {
                organizationId: orgId
            };

            if (sessionId) where.sessionId = sessionId;
            if (type) where.type = type;
            if (severity) where.severity = severity;
            if (vehicleId) {
                where.EventVehicle = {
                    some: {
                        vehicleId: vehicleId as string
                    }
                };
            }

            if (from || to) {
                where.timestamp = {};
                if (from) where.timestamp.gte = new Date(from as string);
                if (to) where.timestamp.lte = new Date(to as string);
            }

            const events = await prisma.event.findMany({
                where,
                include: {
                    EventVehicle: {
                        select: {
                            vehicleId: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });

            const eventsDTO: EventDTO[] = events.map(event => {
                // Extraer datos del JSON si existen
                const eventData: any = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                return {
                    id: event.id,
                    orgId: event.organizationId,
                    ts: event.timestamp.toISOString(),
                    type: event.type as string,
                    severity: (eventData?.severity || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                    sessionId: eventData?.sessionId || event.id,
                    vehicleId: eventData?.vehicleId || event.EventVehicle?.[0]?.vehicleId || '',
                    lat: eventData?.latitude || eventData?.lat || 0,
                    lng: eventData?.longitude || eventData?.lon || 0,
                    meta: eventData
                };
            });

            return res.json({
                success: true,
                data: eventsDTO
            });
        } catch (error) {
            logger.error('Error obteniendo eventos', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al obtener los eventos'
            });
        }
    };

    /**
     * GET /api/telemetry/radar/geofences
     * Obtiene geocercas de Radar
     */
    getGeofences = async (req: Request, res: Response) => {
        try {
            const orgId = req.orgId;

            // Aquí se haría la llamada a Radar API
            // Por ahora devolvemos datos mock
            const mockGeofences = [
                {
                    id: 'geofence-1',
                    name: 'Almacén Principal',
                    provider: 'RADAR',
                    type: 'POLYGON',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [-3.7038, 40.4168],
                            [-3.7038, 40.4178],
                            [-3.7028, 40.4178],
                            [-3.7028, 40.4168],
                            [-3.7038, 40.4168]
                        ]]
                    },
                    tags: ['almacén', 'principal'],
                    version: 1
                }
            ];

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID requerido'
                });
            }

            const geofencesDTO: GeofenceDTO[] = mockGeofences.map(geofence => ({
                ...geofence,
                orgId: orgId
            }));

            return res.json({
                success: true,
                data: geofencesDTO
            });
        } catch (error) {
            logger.error('Error obteniendo geocercas', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al obtener las geocercas'
            });
        }
    };

    /**
     * POST /api/telemetry/radar/geofences
     * Crea una nueva geocerca
     */
    createGeofence = async (req: Request, res: Response) => {
        try {
            const geofenceData = req.body;
            const orgId = req.orgId;

            // Aquí se haría la llamada a Radar API para crear la geocerca
            // Por ahora simulamos la creación
            const newGeofence: GeofenceDTO = {
                id: `geofence-${Date.now()}`,
                orgId,
                ...geofenceData,
                version: 1
            };

            return res.json({
                success: true,
                data: newGeofence
            });
        } catch (error) {
            logger.error('Error creando geocerca', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al crear la geocerca'
            });
        }
    };

    /**
     * PUT /api/telemetry/radar/geofences/:id
     * Actualiza una geocerca existente
     */
    updateGeofence = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const orgId = req.orgId;

            // Aquí se haría la llamada a Radar API para actualizar la geocerca
            // Por ahora simulamos la actualización
            const updatedGeofence: GeofenceDTO = {
                id,
                orgId,
                ...updateData,
                version: (updateData.version || 1) + 1
            };

            return res.json({
                success: true,
                data: updatedGeofence
            });
        } catch (error) {
            logger.error('Error actualizando geocerca', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar la geocerca'
            });
        }
    };

    /**
     * DELETE /api/telemetry/radar/geofences/:id
     * Elimina una geocerca
     */
    deleteGeofence = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId;

            // Aquí se haría la llamada a Radar API para eliminar la geocerca
            // Por ahora simulamos la eliminación
            logger.info('Geocerca eliminada', { id, orgId });

            return res.json({
                success: true
            });
        } catch (error) {
            logger.error('Error eliminando geocerca', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al eliminar la geocerca'
            });
        }
    };

    /**
     * POST /api/telemetry/radar/webhook
     * Procesa webhook de Radar
     */
    processRadarWebhook = async (req: Request, res: Response) => {
        try {
            const payload = req.body;

            if (!RadarAdapter.isValidWebhookPayload(payload)) {
                return res.status(400).json({
                    success: false,
                    error: 'Payload de webhook inválido'
                });
            }

            const eventDTO = RadarAdapter.webhookToEventDTO(payload);

            // Guardar evento en la base de datos (simplificado)
            // TODO: Mapear correctamente a EventType de Prisma
            logger.info('Evento de Radar recibido', { eventDTO });

            return res.json({
                success: true,
                data: eventDTO
            });
        } catch (error) {
            logger.error('Error procesando webhook de Radar', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al procesar el webhook de Radar'
            });
        }
    };

    /**
     * POST /api/telemetry/sessions/:id/export/csv
     * Exporta datos a CSV
     */
    exportToCSV = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { includePoints = true, includeEvents = true } = req.body;
            const orgId = req.orgId;

            // Verificar que la sesión existe y pertenece a la organización
            const session = await prisma.session.findFirst({
                where: {
                    id,
                    organizationId: orgId
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión no encontrada'
                });
            }

            // Generar CSV (implementación simplificada)
            let csvContent = 'timestamp,lat,lng,speed,heading\n';

            if (includePoints) {
                const points = await prisma.gpsMeasurement.findMany({
                    where: { sessionId: id },
                    orderBy: { timestamp: 'asc' }
                });

                points.forEach(point => {
                    csvContent += `${point.timestamp.toISOString()},${point.latitude},${point.longitude},${point.speed || ''},${point.heading || ''}\n`;
                });
            }

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="session-${id}.csv"`);
            res.send(csvContent);
        } catch (error) {
            logger.error('Error exportando a CSV', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al exportar a CSV'
            });
        }
    };

    /**
     * POST /api/telemetry/sessions/:id/export/pdf
     * Exporta datos a PDF
     */
    exportToPDF = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { includeHeatmap = true, includeEvents = true, includeKPIs = true } = req.body;
            const orgId = req.orgId;

            // Verificar que la sesión existe y pertenece a la organización
            const session = await prisma.session.findFirst({
                where: {
                    id,
                    organizationId: orgId
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesión no encontrada'
                });
            }

            // Generar PDF (implementación simplificada)
            const pdfContent = `PDF Report for Session ${id}\nGenerated at ${new Date().toISOString()}`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="session-${id}.pdf"`);
            res.send(pdfContent);
        } catch (error) {
            logger.error('Error exportando a PDF', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al exportar a PDF'
            });
        }
    };

    /**
     * GET /api/telemetry/tomtom/tiles/:style/:z/:x/:y
     * Proxy para tiles de TomTom
     */
    getTomTomTiles = async (req: Request, res: Response) => {
        try {
            const { style, z, x, y } = req.params;
            const apiKey = process.env.TOMTOM_API_KEY;

            if (!apiKey) {
                return res.status(500).json({
                    success: false,
                    error: 'TomTom API key no configurada'
                });
            }

            const tileUrl = `https://api.tomtom.com/map/1/tile/${style}/${z}/${x}/${y}.png?key=${apiKey}`;

            const response = await fetch(tileUrl);
            if (!response.ok) {
                throw new Error(`Error obteniendo tile: ${response.status}`);
            }

            const tileData = await response.arrayBuffer();

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.send(Buffer.from(tileData));
        } catch (error) {
            logger.error('Error obteniendo tiles de TomTom', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al obtener tiles de TomTom'
            });
        }
    };

    // Métodos auxiliares
    private calculateBbox(points: any[]): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
        if (points.length === 0) {
            return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
        }

        let minLat = points[0].latitude;
        let maxLat = points[0].latitude;
        let minLng = points[0].longitude;
        let maxLng = points[0].longitude;

        points.forEach(point => {
            minLat = Math.min(minLat, point.latitude);
            maxLat = Math.max(maxLat, point.latitude);
            minLng = Math.min(minLng, point.longitude);
            maxLng = Math.max(maxLng, point.longitude);
        });

        return { minLat, maxLat, minLng, maxLng };
    }

    private calculateSessionSummary(session: any): any {
        const points = session.GpsMeasurement || [];  // ✅ Mayúscula

        if (points.length === 0) {
            return {
                km: 0,
                avgSpeed: 0,
                maxSpeed: 0,
                eventsBySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
            };
        }

        // Calcular distancia total usando fórmula de Haversine
        let totalDistance = 0;
        let totalSpeed = 0;
        let maxSpeed = 0;
        let validSpeedCount = 0;

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];

            // Filtrar puntos GPS inválidos (coordenadas 0,0 o fuera de España)
            if (prev.latitude === 0 && prev.longitude === 0) continue;
            if (curr.latitude === 0 && curr.longitude === 0) continue;
            if (prev.latitude < 35 || prev.latitude > 45) continue;
            if (curr.latitude < 35 || curr.latitude > 45) continue;
            if (prev.longitude < -10 || prev.longitude > 5) continue;
            if (curr.longitude < -10 || curr.longitude > 5) continue;

            // Calcular distancia usando fórmula de Haversine
            const distance = this.calculateHaversineDistance(
                prev.latitude, prev.longitude,
                curr.latitude, curr.longitude
            );

            // Filtrar distancias irreales (>10km entre puntos consecutivos)
            if (distance <= 10) {
                totalDistance += distance;
            }

            if (curr.speed && curr.speed > 0 && curr.speed < 200) {
                totalSpeed += curr.speed;
                maxSpeed = Math.max(maxSpeed, curr.speed);
                validSpeedCount++;
            }
        }

        return {
            km: Math.round(totalDistance * 100) / 100, // Redondear a 2 decimales
            avgSpeed: validSpeedCount > 0 ? Math.round(totalSpeed / validSpeedCount * 100) / 100 : 0,
            maxSpeed: Math.round(maxSpeed * 100) / 100,
            eventsBySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
        };
    }

    /**
     * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
     */
    private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en kilómetros
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convierte grados a radianes
     */
    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private applyDownsample(points: any[], downsample: string): any[] {
        if (downsample === 'none' || points.length === 0) {
            return points;
        }

        const result = [points[0]]; // Siempre incluir el primer punto
        let lastIncludedTime = new Date(points[0].timestamp).getTime();

        for (let i = 1; i < points.length; i++) {
            const currentTime = new Date(points[i].timestamp).getTime();
            const timeDiff = currentTime - lastIncludedTime;

            let shouldInclude = false;

            switch (downsample) {
                case '5s':
                    shouldInclude = timeDiff >= 5000;
                    break;
                case '10s':
                    shouldInclude = timeDiff >= 10000;
                    break;
                case '100m':
                    // Calcular distancia desde el último punto incluido
                    const lastPoint = result[result.length - 1];
                    const latDiff = points[i].latitude - lastPoint.latitude;
                    const lngDiff = points[i].longitude - lastPoint.longitude;
                    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // En metros
                    shouldInclude = distance >= 100;
                    break;
            }

            if (shouldInclude) {
                result.push(points[i]);
                lastIncludedTime = currentTime;
            }
        }

        return result;
    }
}
