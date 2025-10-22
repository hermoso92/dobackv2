import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { Permission } from '../types/permissions';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

interface SystemStatus {
    timestamp: Date;
    services: {
        backend: ServiceStatus;
        database: ServiceStatus;
        cronJobs: ServiceStatus;
    };
    statistics: {
        users: UserStatistics;
        alerts: AlertStatistics;
        reports: ReportStatistics;
    };
    performance: {
        uptime: number;
        cpu: CpuInfo;
        memory: MemoryInfo;
        responseTime: number;
    };
    logs: RecentLog[];
}

interface ServiceStatus {
    status: 'healthy' | 'degraded' | 'down';
    message: string;
    lastCheck: Date;
}

interface UserStatistics {
    total: number;
    byRole: {
        ADMIN: number;
        MANAGER: number;
        OPERATOR: number;
        VIEWER: number;
    };
    activeToday: number;
}

interface AlertStatistics {
    total: number;
    pending: number;
    resolved: number;
    ignored: number;
    critical: number;
}

interface ReportStatistics {
    total: number;
    active: number;
    executedToday: number;
    scheduled: number;
}

interface CpuInfo {
    model: string;
    cores: number;
    usage: number;
}

interface MemoryInfo {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
}

interface RecentLog {
    timestamp: string;
    level: string;
    message: string;
    category?: string;
}

// GET /api/system/status - Obtener estado completo del sistema
router.get('/status',
    authenticate,
    requirePermission(Permission.SYSTEM_STATUS_VIEW),
    async (req: Request, res: Response) => {
        const startTime = Date.now();

        try {
            // 1. Verificar servicios
            const services = await checkServices();

            // 2. Obtener estadísticas
            const statistics = await getStatistics();

            // 3. Obtener métricas de performance
            const performance = getPerformanceMetrics(startTime);

            // 4. Obtener logs recientes
            const logs = await getRecentLogs();

            const systemStatus: SystemStatus = {
                timestamp: new Date(),
                services,
                statistics,
                performance,
                logs,
            };

            res.json(systemStatus);
        } catch (error) {
            logger.error('Error obteniendo estado del sistema', { error });
            res.status(500).json({
                error: 'Error al obtener estado del sistema',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
);

// GET /api/system/health - Health check simple
router.get('/health', async (req: Request, res: Response) => {
    try {
        // Verificar conexión a BD
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: 'healthy',
            timestamp: new Date(),
            uptime: process.uptime(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Funciones auxiliares

async function checkServices(): Promise<SystemStatus['services']> {
    const services = {
        backend: await checkBackendService(),
        database: await checkDatabaseService(),
        cronJobs: await checkCronJobsService(),
    };

    return services;
}

async function checkBackendService(): Promise<ServiceStatus> {
    try {
        const uptime = process.uptime();

        return {
            status: 'healthy',
            message: `Backend funcionando correctamente. Uptime: ${Math.floor(uptime / 60)} minutos`,
            lastCheck: new Date(),
        };
    } catch (error) {
        return {
            status: 'down',
            message: error instanceof Error ? error.message : 'Backend no responde',
            lastCheck: new Date(),
        };
    }
}

async function checkDatabaseService(): Promise<ServiceStatus> {
    try {
        await prisma.$queryRaw`SELECT 1`;

        // Verificar tiempo de respuesta
        const start = Date.now();
        await prisma.user.count();
        const responseTime = Date.now() - start;

        const status = responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'down';
        const message = `Base de datos ${status === 'healthy' ? 'funcionando correctamente' : 'con latencia alta'}. Tiempo de respuesta: ${responseTime}ms`;

        return {
            status,
            message,
            lastCheck: new Date(),
        };
    } catch (error) {
        return {
            status: 'down',
            message: error instanceof Error ? error.message : 'Base de datos no accesible',
            lastCheck: new Date(),
        };
    }
}

async function checkCronJobsService(): Promise<ServiceStatus> {
    try {
        // Verificar si existen reportes programados activos
        const activeReports = await prisma.scheduledReport.count({
            where: { isActive: true }
        });

        // Verificar última ejecución de alertas (debería ser hoy si es después de las 08:00)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const alertsCreatedToday = await prisma.missingFileAlert.count({
            where: {
                createdAt: {
                    gte: today
                }
            }
        });

        const currentHour = new Date().getHours();
        const shouldHaveRunToday = currentHour >= 8;

        let status: ServiceStatus['status'] = 'healthy';
        let message = `Cron jobs funcionando. ${activeReports} reportes programados activos.`;

        if (shouldHaveRunToday && alertsCreatedToday === 0) {
            status = 'degraded';
            message = `Cron de alertas puede no haber ejecutado hoy. Alertas creadas hoy: ${alertsCreatedToday}`;
        }

        return {
            status,
            message,
            lastCheck: new Date(),
        };
    } catch (error) {
        return {
            status: 'down',
            message: error instanceof Error ? error.message : 'No se puede verificar cron jobs',
            lastCheck: new Date(),
        };
    }
}

async function getStatistics(): Promise<SystemStatus['statistics']> {
    // Estadísticas de usuarios
    const users = await getUserStatistics();

    // Estadísticas de alertas
    const alerts = await getAlertStatistics();

    // Estadísticas de reportes
    const reports = await getReportStatistics();

    return {
        users,
        alerts,
        reports,
    };
}

async function getUserStatistics(): Promise<UserStatistics> {
    const total = await prisma.user.count();

    // Contar por rol
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const managerCount = await prisma.user.count({ where: { role: 'MANAGER' } });
    const operatorCount = await prisma.user.count({ where: { role: 'OPERATOR' } });
    const viewerCount = await prisma.user.count({ where: { role: 'VIEWER' } });

    // Usuarios activos hoy (que hicieron login hoy)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeToday = await prisma.user.count({
        where: {
            lastLoginAt: {
                gte: today
            }
        }
    });

    return {
        total,
        byRole: {
            ADMIN: adminCount,
            MANAGER: managerCount,
            OPERATOR: operatorCount,
            VIEWER: viewerCount,
        },
        activeToday,
    };
}

async function getAlertStatistics(): Promise<AlertStatistics> {
    const total = await prisma.missingFileAlert.count();
    const pending = await prisma.missingFileAlert.count({ where: { status: 'PENDING' } });
    const resolved = await prisma.missingFileAlert.count({ where: { status: 'RESOLVED' } });
    const ignored = await prisma.missingFileAlert.count({ where: { status: 'IGNORED' } });
    const critical = await prisma.missingFileAlert.count({ where: { severity: 'CRITICAL' } });

    return {
        total,
        pending,
        resolved,
        ignored,
        critical,
    };
}

async function getReportStatistics(): Promise<ReportStatistics> {
    const total = await prisma.scheduledReport.count();
    const active = await prisma.scheduledReport.count({ where: { isActive: true } });

    // Reportes ejecutados hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executedToday = await prisma.scheduledReport.count({
        where: {
            lastRunAt: {
                gte: today
            }
        }
    });

    // Reportes programados para el futuro
    const scheduled = await prisma.scheduledReport.count({
        where: {
            isActive: true,
            nextRunAt: {
                gt: new Date()
            }
        }
    });

    return {
        total,
        active,
        executedToday,
        scheduled,
    };
}

function getPerformanceMetrics(startTime: number): SystemStatus['performance'] {
    const uptime = process.uptime();

    // CPU info
    const cpus = os.cpus();
    const cpu: CpuInfo = {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        usage: Math.round(os.loadavg()[0] * 100) / cpus.length,
    };

    // Memory info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const memory: MemoryInfo = {
        total: Math.round(totalMem / 1024 / 1024), // MB
        free: Math.round(freeMem / 1024 / 1024), // MB
        used: Math.round(usedMem / 1024 / 1024), // MB
        usagePercentage: Math.round((usedMem / totalMem) * 100),
    };

    // Response time de esta request
    const responseTime = Date.now() - startTime;

    return {
        uptime: Math.floor(uptime),
        cpu,
        memory,
        responseTime,
    };
}

async function getRecentLogs(): Promise<RecentLog[]> {
    const logs: RecentLog[] = [];

    try {
        const logsDir = path.join(process.cwd(), 'logs');

        // Buscar archivo de log más reciente
        const logFiles = fs.readdirSync(logsDir)
            .filter(f => f.startsWith('backend_') && f.endsWith('.log'))
            .sort()
            .reverse();

        if (logFiles.length > 0) {
            const latestLog = path.join(logsDir, logFiles[0]);
            const content = fs.readFileSync(latestLog, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim()).slice(-20); // Últimas 20 líneas

            for (const line of lines) {
                try {
                    // Intentar parsear como JSON
                    const logEntry = JSON.parse(line);
                    logs.push({
                        timestamp: logEntry.timestamp || new Date().toISOString(),
                        level: logEntry.level || 'info',
                        message: logEntry.message || line.substring(0, 100),
                        category: logEntry.category,
                    });
                } catch {
                    // Si no es JSON, parsear como texto plano
                    const match = line.match(/\[(.*?)\]\s+\[(\w+)\]\s+(.*)/);
                    if (match) {
                        logs.push({
                            timestamp: match[1],
                            level: match[2].toLowerCase(),
                            message: match[3].substring(0, 100),
                        });
                    }
                }
            }
        }
    } catch (error) {
        logger.error('Error leyendo logs recientes', { error });
    }

    return logs.slice(-10); // Retornar solo últimos 10
}

export default router;

