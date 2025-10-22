import { SessionStatus, SessionType } from '@prisma/client';
import { Request, Response } from 'express';
import { existsSync, mkdir, writeFile } from 'fs';
import { join } from 'path';
import { prisma } from '../lib/prisma';
import { DataProcessor } from '../services/dataProcessor';
import { createLogger } from '../utils/logger';

const logger = createLogger('DataController');
const dataProcessor = new DataProcessor(join(process.cwd(), 'data'));


interface AuthenticatedRequest extends Request {
    user: {
        id: string;
    };
}

interface StabilityMeasurement {
    timestamp: Date;
    roll: number | null;
    pitch: number | null;
    yaw: number | null;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    accmag: number;
    si: number;
}

interface Session {
    id: string;
    vehicleId: string;
    userId: string;
    startTime: Date;
    endTime: Date | null;
    status: SessionStatus;
    type: SessionType;
    stabilityMeasurements: StabilityMeasurement[];
    gpsMeasurements: any[];
    canMeasurements: any[];
    vehicle: any;
}

export class DataController {
    public async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            const { organizationId, vehicleId, date } = req.body;
            if (!organizationId || !vehicleId || !date) {
                res.status(400).json({
                    error: 'Missing required fields: organizationId, vehicleId, date'
                });
                return;
            }

            // Create directory structure
            const basePath = join(
                process.cwd(),
                'data',
                'organizations',
                organizationId,
                'vehicles',
                vehicleId,
                date.replace(/-/g, '')
            );

            // Create directories for each type
            const types = ['stability', 'gps', 'can'];
            for (const type of types) {
                const typePath = join(basePath, type);
                if (!existsSync(typePath)) {
                    await mkdir(typePath, { recursive: true });
                }
            }

            // Save file
            const filePath = join(basePath, req.file.originalname);
            await writeFile(filePath, req.file.buffer);

            // Process file
            await dataProcessor.processFile(filePath, req.user.id);

            res.status(200).json({
                message: 'File uploaded and processed successfully',
                path: filePath
            });
        } catch (error: any) {
            logger.error('Error uploading file:', error);
            res.status(500).json({
                error: 'Error processing file',
                details: error.message
            });
        }
    }

    public async getSessions(req: Request, res: Response): Promise<void> {
        try {
            const { vehicleId, startDate, endDate } = req.query;
            const organizationId = (req as any).user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a sesiones sin organizationId');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere organizationId'
                });
            }

            const sessions = await prisma.session.findMany({
                where: {
                    organizationId,
                    ...(vehicleId && {
                        vehicle: {
                            licensePlate: vehicleId as string
                        }
                    }),
                    startTime: {
                        gte: startDate ? new Date(startDate as string) : undefined,
                        lte: endDate ? new Date(endDate as string) : undefined
                    }
                },
                include: {
                    stabilityMeasurements: true,
                    gpsMeasurements: true,
                    canMeasurements: true,
                    vehicle: true
                },
                orderBy: {
                    startTime: 'desc'
                }
            });

            res.status(200).json(sessions);
        } catch (error: any) {
            logger.error('Error fetching sessions:', error);
            res.status(500).json({
                error: 'Error fetching sessions',
                details: error.message
            });
        }
    }

    public async getSessionDetails(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;

            const session = (await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    stabilityMeasurements: {
                        select: {
                            timestamp: true,
                            roll: true,
                            pitch: true,
                            yaw: true,
                            ax: true,
                            ay: true,
                            az: true,
                            gx: true,
                            gy: true,
                            gz: true,
                            accmag: true,
                            si: true
                        }
                    },
                    gpsMeasurements: true,
                    canMeasurements: true,
                    vehicle: true
                }
            })) as Session | null;

            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }

            // Transformar los datos de estabilidad al formato esperado
            const transformedSession = {
                ...session,
                stabilityData: session.stabilityMeasurements.map((data) => ({
                    timestamp: data.timestamp,
                    roll: data.roll,
                    pitch: data.pitch,
                    yaw: data.yaw,
                    ay: data.ay,
                    gx: data.gx,
                    az: data.az,
                    accmag: data.accmag,
                    si: data.si
                }))
            };

            res.status(200).json(transformedSession);
        } catch (error: any) {
            logger.error('Error fetching session details:', error);
            res.status(500).json({
                error: 'Error fetching session details',
                details: error.message
            });
        }
    }
}
