import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

interface TelemetrySessionSummary {
    totalPoints: number;
    durationSeconds: number;
    maxSpeed: number | null;
    averageSpeed: number | null;
    distanceKm: number;
    severityCount: {
        normal: number;
        warning: number;
        critical: number;
    };
    startTime: string | null;
    endTime: string | null;
}

interface TelemetrySessionMeta {
    id: string;
    vehicleId: string;
    vehicleName: string | null;
    vehiclePlate: string | null;
    startTime: string;
    endTime: string | null;
    status: string;
    type: string;
}

interface LoadedSessionTelemetry {
    session: TelemetrySessionMeta;
    points: Array<{
        lat: number;
        lng: number;
        recorded_at: string;
        severity: number;
        speed: number | null;
        accuracy: number | null;
        heading: number | null;
    }>;
    summary: TelemetrySessionSummary;
}

const toNumber = (value: Prisma.Decimal | number | null | undefined): number | null => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    return Number(value);
};

const getOrganizationId = (req: Request): string | null => {
    if ((req as any).organizationId) {
        return String((req as any).organizationId);
    }

    if (req.user?.organizationId) {
        return req.user.organizationId;
    }

    return null;
};

const computeSeverity = (speed: number | null): number => {
    if (speed === null || Number.isNaN(speed)) {
        return 0;
    }

    if (speed >= 110) {
        return 2;
    }

    if (speed >= 80) {
        return 1;
    }

    return 0;
};

const calculateDistanceKm = (points: Array<{ lat: number; lng: number }>): number => {
    if (points.length < 2) {
        return 0;
    }

    const R = 6371; // km
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    let total = 0;

    for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const curr = points[i];

        const dLat = toRad(curr.lat - prev.lat);
        const dLng = toRad(curr.lng - prev.lng);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(prev.lat)) *
            Math.cos(toRad(curr.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        total += R * c;
    }

    return total;
};

const loadSessionTelemetry = async (
    sessionId: string,
    organizationId: string
): Promise<LoadedSessionTelemetry | null> => {
    const sessionRecord = await prisma.session.findFirst({
        where: {
            id: sessionId,
            organizationId
        },
        include: {
            vehicle: {
                select: {
                    name: true,
                    licensePlate: true
                }
            }
        }
    });

    if (!sessionRecord) {
        return null;
    }

    const measurements = await prisma.gpsMeasurement.findMany({
        where: {
            sessionId: sessionRecord.id
        },
        orderBy: {
            timestamp: 'asc'
        }
    });

    const points = measurements.map((measurement, index) => {
        const speedValue = toNumber(measurement.speed);
        return {
            lat: Number(measurement.latitude),
            lng: Number(measurement.longitude),
            recorded_at: measurement.timestamp.toISOString(),
            severity: computeSeverity(speedValue),
            speed: speedValue,
            accuracy: toNumber(measurement.accuracy),
            heading: toNumber(measurement.heading)
        };
    });

    const severityCount = {
        normal: 0,
        warning: 0,
        critical: 0
    };

    let maxSpeed = 0;
    let speedAccumulator = 0;
    let speedCount = 0;

    points.forEach((point) => {
        if (point.severity === 2) {
            severityCount.critical += 1;
        } else if (point.severity === 1) {
            severityCount.warning += 1;
        } else {
            severityCount.normal += 1;
        }

        if (point.speed !== null) {
            const speedValue = point.speed;
            if (speedValue > maxSpeed) {
                maxSpeed = speedValue;
            }
            speedAccumulator += speedValue;
            speedCount += 1;
        }
    });

    const distanceKm = calculateDistanceKm(points);

    const sessionStartIso = sessionRecord.startTime.toISOString();
    const sessionEndIso = sessionRecord.endTime
        ? sessionRecord.endTime.toISOString()
        : points.length > 0
            ? points[points.length - 1].timestamp.toISOString()
            : null;

    const durationSeconds = sessionRecord.endTime
        ? Math.max(
            0,
            Math.floor(
                (sessionRecord.endTime.getTime() - sessionRecord.startTime.getTime()) / 1000
            )
        )
        : points.length > 1
            ? Math.floor(
                (new Date(points[points.length - 1].timestamp).getTime() -
                    new Date(points[0].timestamp).getTime()) /
                1000
            )
            : 0;

    const summary: TelemetrySessionSummary = {
        totalPoints: points.length,
        durationSeconds,
        maxSpeed: maxSpeed > 0 ? Number(maxSpeed.toFixed(2)) : null,
        averageSpeed:
            speedCount > 0 ? Number((speedAccumulator / speedCount).toFixed(2)) : null,
        distanceKm: Number(distanceKm.toFixed(3)),
        severityCount,
        startTime: sessionStartIso,
        endTime: sessionEndIso
    };

    const session: TelemetrySessionMeta = {
        id: sessionRecord.id,
        vehicleId: sessionRecord.vehicleId,
        vehicleName: sessionRecord.vehicle?.name ?? null,
        vehiclePlate: sessionRecord.vehicle?.licensePlate ?? null,
        startTime: sessionRecord.startTime.toISOString(),
        endTime: sessionRecord.endTime ? sessionRecord.endTime.toISOString() : null,
        status: sessionRecord.status,
        type: sessionRecord.type
    };

    return {
        session,
        points,
        summary
    };
};

const toCsv = (data: LoadedSessionTelemetry): string => {
    const header = [
        'timestamp',
        'latitude',
        'longitude',
        'speed_kmh',
        'severity',
        'accuracy',
        'heading'
    ];

    const rows = data.points.map((point) => [
        point.recorded_at,
        point.lat.toFixed(6),
        point.lng.toFixed(6),
        point.speed !== null ? point.speed.toFixed(2) : '',
        point.severity.toString(),
        point.accuracy !== null ? point.accuracy.toFixed(2) : '',
        point.heading !== null ? point.heading.toFixed(2) : ''
    ]);

    return [header, ...rows].map((columns) => columns.join(',')).join('\n');
};

export class TelemetryMapController {
    getOrganizationInfo = async (req: Request, res: Response) => {
        try {
            const organizationId = getOrganizationId(req);

            if (!organizationId) {
                return res.status(403).json({
                    success: false,
                    error: 'Organizacion no autorizada'
                });
            }

            const [vehicles, parks, zones] = await Promise.all([
                prisma.vehicle.findMany({
                    where: {
                        organizationId,
                        active: true
                    },
                    select: {
                        id: true,
                        name: true,
                        licensePlate: true,
                        status: true,
                        parkId: true
                    },
                    orderBy: {
                        name: 'asc'
                    }
                }),
                prisma.park.findMany({
                    where: {
                        organizationId
                    },
                    select: {
                        id: true,
                        name: true,
                        geometry: true
                    },
                    orderBy: {
                        name: 'asc'
                    }
                }),
                prisma.zone.findMany({
                    where: {
                        organizationId
                    },
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        geometry: true,
                        parkId: true
                    },
                    orderBy: {
                        name: 'asc'
                    }
                })
            ]);

            return res.json({
                success: true,
                data: {
                    vehicles,
                    parks,
                    zones
                }
            });
        } catch (error) {
            logger.error('Error obteniendo informacion de organizacion', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al obtener informacion de la organizacion'
            });
        }
    };

    getRecentSessions = async (req: Request, res: Response) => {
        try {
            const organizationId = getOrganizationId(req);
            if (!organizationId) {
                return res.status(403).json({
                    success: false,
                    error: 'Organizacion no autorizada'
                });
            }

            const { vehicleId, limit } = req.query;
            const parsedLimit = Math.min(Math.max(parseInt(String(limit ?? '20'), 10) || 20, 1), 100);

            const sessions = await prisma.session.findMany({
                where: {
                    organizationId,
                    ...(vehicleId
                        ? {
                            vehicleId: String(vehicleId)
                        }
                        : {})
                },
                include: {
                    vehicle: {
                        select: {
                            name: true,
                            licensePlate: true
                        }
                    },
                    _count: {
                        select: {
                            gpsMeasurements: true
                        }
                    }
                },
                orderBy: {
                    startTime: 'desc'
                },
                take: parsedLimit
            });

            const data = sessions.map((session) => ({
                id: session.id,
                vehicleId: session.vehicleId,
                startTime: session.startTime.toISOString(),
                endTime: session.endTime ? session.endTime.toISOString() : null,
                status: session.status,
                type: session.type,
                vehicle: {
                    name: session.vehicle?.name ?? null,
                    licensePlate: session.vehicle?.licensePlate ?? null
                },
                points: session._count.gpsMeasurements
            }));

            return res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Error obteniendo sesiones de telemetria', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al obtener las sesiones de telemetria'
            });
        }
    };

    getSessionGpsPoints = async (req: Request, res: Response) => {
        try {
            const organizationId = getOrganizationId(req);
            if (!organizationId) {
                return res.status(403).json({
                    success: false,
                    error: 'Organizacion no autorizada'
                });
            }

            const { sessionId } = req.params;

            const sessionData = await loadSessionTelemetry(sessionId, organizationId);

            if (!sessionData) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesion no encontrada'
                });
            }

            return res.json({
                success: true,
                data: sessionData
            });
        } catch (error) {
            logger.error('Error obteniendo puntos GPS de sesion', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al obtener los puntos GPS'
            });
        }
    };

    exportSessionData = async (req: Request, res: Response) => {
        try {
            const organizationId = getOrganizationId(req);
            if (!organizationId) {
                return res.status(403).json({
                    success: false,
                    error: 'Organizacion no autorizada'
                });
            }

            const { sessionId } = req.params;
            const format = String(req.query.format ?? 'csv').toLowerCase();

            if (format !== 'csv') {
                return res.status(400).json({
                    success: false,
                    error: 'Formato no soportado'
                });
            }

            const sessionData = await loadSessionTelemetry(sessionId, organizationId);

            if (!sessionData) {
                return res.status(404).json({
                    success: false,
                    error: 'Sesion no encontrada'
                });
            }

            const csvContent = toCsv(sessionData);
            const filename = `telemetria-${sessionData.session.vehiclePlate ?? sessionData.session.id}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(csvContent);
        } catch (error) {
            logger.error('Error exportando datos de telemetria', { error });
            return res.status(500).json({
                success: false,
                error: 'Error al exportar la telemetria de la sesion'
            });
        }
    };
}