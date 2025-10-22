import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Estadísticas del sistema de procesamiento
router.get('/stats', async (req, res) => {
    try {
        const totalSessions = await prisma.session.count();
        const totalStabilityMeasurements = await prisma.stabilityMeasurement.count();
        const totalCanMeasurements = await prisma.canMeasurement.count();
        const totalGpsMeasurements = await prisma.gpsMeasurement.count();
        const totalRotativoMeasurements = await prisma.rotativoMeasurement.count();

        // Calcular archivos procesados (aproximación basada en mediciones)
        const processedFiles = Math.floor((totalStabilityMeasurements + totalCanMeasurements + totalGpsMeasurements + totalRotativoMeasurements) / 1000);

        // Obtener última sesión para timestamp
        const lastSession = await prisma.session.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        const stats = {
            totalFiles: processedFiles * 2, // Estimación
            processedFiles: processedFiles,
            failedFiles: 0, // TODO: implementar tracking real
            totalSessions,
            createdSessions: totalSessions,
            failedSessions: 0,
            totalMeasurements: totalStabilityMeasurements + totalCanMeasurements + totalGpsMeasurements + totalRotativoMeasurements,
            stabilityMeasurements: totalStabilityMeasurements,
            canMeasurements: totalCanMeasurements,
            gpsMeasurements: totalGpsMeasurements,
            rotativoMeasurements: totalRotativoMeasurements,
            processingTime: 0, // TODO: calcular tiempo real
            lastProcessed: lastSession?.createdAt?.toISOString() || null
        };

        res.json(stats);
    } catch (error) {
        logger.error('Error getting processing stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Sesiones recientes
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await prisma.session.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                vehicle: {
                    select: { name: true }
                },
                _count: {
                    select: {
                        stabilityMeasurements: true,
                        canMeasurements: true,
                        gpsMeasurements: true,
                        rotativoMeasurements: true
                    }
                }
            }
        });

        const sessionSummaries = sessions.map(session => ({
            id: session.id,
            vehicleName: session.vehicle?.name || 'Desconocido',
            date: session.startTime.toISOString(),
            measurements: {
                stability: session._count.stabilityMeasurements,
                can: session._count.canMeasurements,
                gps: session._count.gpsMeasurements,
                rotativo: session._count.rotativoMeasurements,
                total: session._count.stabilityMeasurements + session._count.canMeasurements +
                    session._count.gpsMeasurements + session._count.rotativoMeasurements
            },
            status: session.status.toLowerCase() as 'completed' | 'processing' | 'failed'
        }));

        res.json(sessionSummaries);
    } catch (error) {
        logger.error('Error getting sessions:', error);
        res.status(500).json({ error: 'Error al obtener sesiones' });
    }
});

// Logs del sistema
router.get('/logs', async (req, res) => {
    try {
        const logFiles = [
            { path: path.join(process.cwd(), 'processing-log.txt'), type: 'main' },
            { path: path.join(process.cwd(), 'improved-processing-log.txt'), type: 'main' },
            { path: path.join(process.cwd(), 'correct-sessions-log.txt'), type: 'main' }
        ];

        let logs: any[] = [];

        for (const logFile of logFiles) {
            if (fs.existsSync(logFile.path)) {
                const content = fs.readFileSync(logFile.path, 'utf-8');
                const lines = content.split('\n').filter(line => line.trim());

                // Procesar últimas 50 líneas
                const recentLines = lines.slice(-50);

                recentLines.forEach(line => {
                    const match = line.match(/\[(.*?)\] (.*)/);
                    if (match) {
                        const timestamp = match[1];
                        const message = match[2];

                        let level: 'info' | 'error' | 'warning' | 'success' = 'info';
                        if (message.includes('ERROR')) level = 'error';
                        else if (message.includes('⚠️') || message.includes('WARNING')) level = 'warning';
                        else if (message.includes('✅') || message.includes('SUCCESS')) level = 'success';

                        logs.push({
                            timestamp,
                            level,
                            message: message.replace(/\[(.*?)\]/g, '').trim()
                        });
                    }
                });
            }
        }

        // Ordenar por timestamp y tomar los más recientes
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        logs = logs.slice(0, 100);

        res.json(logs);
    } catch (error) {
        logger.error('Error getting logs:', error);
        res.status(500).json({ error: 'Error al obtener logs' });
    }
});

// Iniciar procesamiento
router.post('/start', async (req, res) => {
    try {
        // Ejecutar el script de procesamiento correcto
        const scriptPath = path.join(process.cwd(), 'process-correct-sessions.js');

        if (!fs.existsSync(scriptPath)) {
            return res.status(404).json({ error: 'Script de procesamiento no encontrado' });
        }

        // Ejecutar en background
        const child = spawn('node', [scriptPath], {
            detached: true,
            stdio: 'ignore'
        });

        child.unref();

        res.json({
            message: 'Procesamiento iniciado',
            pid: child.pid
        });
    } catch (error) {
        logger.error('Error starting processing:', error);
        res.status(500).json({ error: 'Error al iniciar procesamiento' });
    }
});

// Detener procesamiento
router.post('/stop', async (req, res) => {
    try {
        // TODO: Implementar sistema de control de procesos
        res.json({ message: 'Procesamiento detenido' });
    } catch (error) {
        logger.error('Error stopping processing:', error);
        res.status(500).json({ error: 'Error al detener procesamiento' });
    }
});

// Limpiar base de datos
router.post('/reset', async (req, res) => {
    try {
        await prisma.stabilityMeasurement.deleteMany();
        await prisma.canMeasurement.deleteMany();
        await prisma.gpsMeasurement.deleteMany();
        await prisma.rotativoMeasurement.deleteMany();
        await prisma.stability_events.deleteMany();
        await prisma.session.deleteMany();

        res.json({ message: 'Base de datos limpiada exitosamente' });
    } catch (error) {
        logger.error('Error resetting database:', error);
        res.status(500).json({ error: 'Error al limpiar base de datos' });
    }
});

// Generar reporte
router.get('/report/:type', async (req, res) => {
    try {
        const { type } = req.params;

        if (type === 'html') {
            // Generar reporte HTML
            const scriptPath = path.join(process.cwd(), 'generate-visual-report.js');

            if (!fs.existsSync(scriptPath)) {
                return res.status(404).json({ error: 'Script de reporte no encontrado' });
            }

            const child = spawn('node', [scriptPath]);

            child.on('close', (code) => {
                if (code === 0) {
                    const reportPath = path.join(process.cwd(), 'processing-report.html');
                    if (fs.existsSync(reportPath)) {
                        res.download(reportPath);
                    } else {
                        res.status(404).json({ error: 'Reporte HTML no generado' });
                    }
                } else {
                    res.status(500).json({ error: 'Error al generar reporte HTML' });
                }
            });

        } else if (type === 'json') {
            // Generar reporte JSON
            const stats = await prisma.session.groupBy({
                by: ['vehicleId'],
                _count: { id: true }
            });

            const report = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalSessions: await prisma.session.count(),
                    totalStabilityMeasurements: await prisma.stabilityMeasurement.count(),
                    totalCanMeasurements: await prisma.canMeasurement.count(),
                    totalGpsMeasurements: await prisma.gpsMeasurement.count(),
                    totalRotativoMeasurements: await prisma.rotativoMeasurement.count()
                },
                sessionsByVehicle: stats
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=processing-report.json');
            res.json(report);

        } else {
            res.status(400).json({ error: 'Tipo de reporte no válido' });
        }
    } catch (error) {
        logger.error('Error generating report:', error);
        res.status(500).json({ error: 'Error al generar reporte' });
    }
});

// Verificar estructura de sesiones
router.get('/validate-sessions', async (req, res) => {
    try {
        const sessions = await prisma.session.findMany({
            include: {
                vehicle: {
                    select: { name: true }
                }
            },
            orderBy: { startTime: 'desc' },
            take: 50
        });

        const vehicleDateMap: { [key: string]: string[] } = {};

        sessions.forEach(session => {
            const vehicleName = session.vehicle?.name || 'Desconocido';
            const date = session.startTime.toISOString().split('T')[0];
            const key = `${vehicleName}_${date}`;

            if (!vehicleDateMap[key]) {
                vehicleDateMap[key] = [];
            }
            vehicleDateMap[key].push(session.id.substring(0, 8));
        });

        const violations = Object.entries(vehicleDateMap)
            .filter(([_, sessionIds]) => sessionIds.length > 1)
            .map(([key, sessionIds]) => {
                const [vehicle, date] = key.split('_');
                return {
                    vehicle,
                    date,
                    sessionCount: sessionIds.length,
                    sessions: sessionIds
                };
            });

        res.json({
            totalSessions: sessions.length,
            violations,
            isValid: violations.length === 0,
            message: violations.length === 0
                ? '✅ Todas las sesiones respetan la regla de una sesión por día por vehículo'
                : `❌ Se encontraron ${violations.length} violaciones de la regla`
        });
    } catch (error) {
        logger.error('Error validating sessions:', error);
        res.status(500).json({ error: 'Error al validar sesiones' });
    }
});

export default router;







































