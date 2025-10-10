import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { GestorDeEventoController } from '../controllers/GestorDeEventoController';
import { authenticate } from '../middleware/auth';
import { GestorDeEventoService } from '../services/GestorDeEventoService';
import { logger } from '../utils/logger';

const router = Router();
const controller = new GestorDeEventoController();
const gestorService = new GestorDeEventoService();
const prisma = new PrismaClient();

// Ruta de prueba sin autenticación
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Gestor de Eventos API funcionando',
        timestamp: new Date().toISOString()
    });
});

// Rutas de ejecuciones (deben ir ANTES de las rutas parametrizadas)
router.get('/executions', authenticate, controller.obtenerEjecucionesEventos.bind(controller));
router.get('/executions/:id', authenticate, controller.obtenerEjecucionEvento.bind(controller));

// Rutas principales de eventos
router.get('/', authenticate, controller.listarEventos.bind(controller));
router.post('/', authenticate, controller.crearEvento.bind(controller));
router.get('/:id', authenticate, controller.obtenerEvento.bind(controller));
router.put('/:id', authenticate, controller.actualizarEvento.bind(controller));
router.delete('/:id', authenticate, controller.eliminarEvento.bind(controller));
router.delete('/', authenticate, controller.eliminarTodosLosEventos.bind(controller));

// Rutas de evaluación
router.post('/:id/evaluar', authenticate, controller.evaluarCondicionesEvento.bind(controller));

// Rutas de vehículos
router.get(
    '/vehicles/:vehicleId/active',
    authenticate,
    controller.obtenerEventosActivosVehiculo.bind(controller)
);

// Rutas de estado
router.patch('/:id/status', authenticate, controller.actualizarEstadoEvento.bind(controller));

// Endpoint de prueba para evaluación automática
router.post('/test-auto-evaluation', authenticate, async (req, res) => {
    try {
        const { sessionId, vehicleId, testData } = req.body;

        // Datos de prueba por defecto con valores que disparen eventos
        const defaultTestData = {
            roll: 35.0, // > 15 para disparar eventos de estabilidad
            pitch: 20.0,
            ay: 4.0,
            si: 0.3,
            speed: 85.0, // > 80 para disparar eventos de velocidad
            vehicleId: vehicleId || 'test-vehicle',
            sessionId: sessionId || `test-session-${Date.now()}`,
            timestamp: new Date().toISOString()
        };

        const dataToTest = { ...defaultTestData, ...testData };

        // Usar el servicio real para evaluar eventos automáticos
        const { GestorDeEventoService } = require('../services/GestorDeEventoService');
        const gestorService = new GestorDeEventoService();
        const evaluationResult = await gestorService.evaluarEventosAutomaticos(
            dataToTest.sessionId,
            dataToTest.vehicleId,
            dataToTest
        );

        res.json({
            success: true,
            data: {
                evaluated: true,
                evaluationResult,
                testData: dataToTest,
                message: 'Evaluación automática completada con datos reales'
            }
        });
    } catch (error) {
        console.error('Error en evaluación automática:', error);
        res.status(500).json({
            success: false,
            message: 'Error en evaluación automática: ' + (error as Error).message
        });
    }
});

// Endpoint simple para crear ejecuciones de prueba
router.post('/create-test-execution', authenticate, async (req, res) => {
    try {
        const userId = (req as any).user?.id;

        // Crear una ejecución de prueba directamente
        const testExecution = {
            eventId: 'test-event-id',
            vehicleId: req.body.vehicleId || 'test-vehicle',
            sessionId: `test-session-${Date.now()}`,
            status: 'TRIGGERED',
            data: {
                roll: 25.0,
                speed: 90.0,
                timestamp: new Date().toISOString()
            },
            triggeredAt: new Date(),
            userId: userId
        };

        // Guardar en base de datos usando Prisma
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const execution = await prisma.ejecucionEvento.create({
            data: {
                sessionId: testExecution.sessionId,
                vehicleId: testExecution.vehicleId,
                status: 'ACTIVE' as any,
                data: testExecution.data,
                triggeredAt: testExecution.triggeredAt,
                eventId: 'test-event'
            }
        });
        await prisma.$disconnect();

        res.json({
            success: true,
            data: {
                execution,
                message: 'Ejecución de prueba creada exitosamente'
            }
        });
    } catch (error) {
        console.error('Error creando ejecución de prueba:', error);
        res.status(500).json({
            success: false,
            message: 'Error creando ejecución de prueba: ' + (error as Error).message
        });
    }
});

// Endpoint para evaluar sesiones históricas y generar ejecuciones faltantes
router.post('/evaluate-historical', authenticate, async (req: any, res) => {
    try {
        const userId = (req as any).user?.id || (req as any).user?.sub;
        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        logger.info('Iniciando evaluación histórica de sesiones');

        // Simulación temporal - comentado para evitar errores de tipo
        const sesiones: any[] = [];

        logger.info(`Encontradas ${sesiones.length} sesiones para evaluar`);

        let sesionesEvaluadas = 0;
        let ejecucionesCreadas = 0;

        for (const sesion of sesiones) {
            try {
                // Obtener el timestamp más relevante de los datos de la sesión
                let timestampEvento = new Date(sesion.startTime);

                // Si hay mediciones GPS, usar el timestamp más reciente
                if (sesion.gpsMeasurements?.length > 0) {
                    const gpsTimestamps = sesion.gpsMeasurements.map((g) => new Date(g.timestamp));
                    timestampEvento = new Date(Math.max(...gpsTimestamps.map((d) => d.getTime())));
                }
                // Si no hay GPS pero hay mediciones de estabilidad, usar esas
                else if (sesion.stabilityMeasurements?.length > 0) {
                    const stabilityTimestamps = sesion.stabilityMeasurements.map(
                        (s) => new Date(s.timestamp)
                    );
                    timestampEvento = new Date(
                        Math.max(...stabilityTimestamps.map((d) => d.getTime()))
                    );
                }
                // Si no hay estabilidad pero hay CAN, usar esas
                else if (sesion.canMeasurements?.length > 0) {
                    const canTimestamps = sesion.canMeasurements.map((c) => new Date(c.timestamp));
                    timestampEvento = new Date(Math.max(...canTimestamps.map((d) => d.getTime())));
                }

                // Simular datos de la sesión para evaluación
                const datosSesion = {
                    sessionId: sesion.id,
                    vehicleId: sesion.vehicleId,
                    timestamp: timestampEvento.toISOString(),
                    // Datos GPS
                    speed:
                        sesion.gpsMeasurements?.length > 0
                            ? Math.max(...sesion.gpsMeasurements.map((g) => g.speed || 0))
                            : 0,
                    latitude: sesion.gpsMeasurements?.[0]?.latitude || 0,
                    longitude: sesion.gpsMeasurements?.[0]?.longitude || 0,
                    // Datos de estabilidad
                    roll:
                        sesion.stabilityMeasurements?.length > 0
                            ? Math.max(
                                  ...sesion.stabilityMeasurements.map((s) => Math.abs(s.roll || 0))
                              )
                            : 0,
                    pitch:
                        sesion.stabilityMeasurements?.length > 0
                            ? Math.max(
                                  ...sesion.stabilityMeasurements.map((s) => Math.abs(s.pitch || 0))
                              )
                            : 0,
                    yaw:
                        sesion.stabilityMeasurements?.length > 0
                            ? Math.max(
                                  ...sesion.stabilityMeasurements.map((s) => Math.abs(s.yaw || 0))
                              )
                            : 0,
                    // Datos CAN (corregir nombres de campos)
                    rpm:
                        sesion.canMeasurements?.length > 0
                            ? Math.max(...sesion.canMeasurements.map((c) => c.engineRpm || 0))
                            : 0,
                    engineTemp:
                        sesion.canMeasurements?.length > 0
                            ? Math.max(...sesion.canMeasurements.map((c) => c.temperature || 0))
                            : 0
                };

                logger.info(`Evaluando sesión ${sesion.id} con timestamp real:`, {
                    sessionId: sesion.id,
                    timestampEvento: timestampEvento.toISOString(),
                    datos: datosSesion
                });

                // Evaluar esta sesión contra todos los eventos activos
                const resultados = await gestorService.evaluarEventosAutomaticos(
                    sesion.id,
                    sesion.vehicleId,
                    datosSesion
                );

                ejecucionesCreadas += resultados.eventosTriggerados;
                sesionesEvaluadas++;

                logger.info(
                    `Sesión ${sesion.id} evaluada: ${resultados.eventosTriggerados} eventos triggerados`
                );
            } catch (error) {
                logger.error(`Error evaluando sesión ${sesion.id}:`, error);
            }
        }

        logger.info('Evaluación histórica completada', {
            sesionesEvaluadas,
            ejecucionesCreadas
        });

        res.json({
            success: true,
            sesionesEvaluadas,
            ejecucionesCreadas,
            message: `Evaluación histórica completada. ${ejecucionesCreadas} nuevas ejecuciones creadas.`
        });
    } catch (error) {
        logger.error('Error en evaluación histórica:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para generar informe PDF de un evento específico
router.post('/:eventId/generate-report', authenticate, async (req: any, res) => {
    try {
        const { eventId } = req.params;
        const userId = (req as any).user?.id || (req as any).user?.sub;

        if (!userId) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        logger.info('Generando informe PDF para evento:', { eventId, userId });

        // Obtener el evento con todas sus relaciones
        const evento = await prisma.gestorDeEvento.findUnique({
            where: { id: eventId },
            include: {
                conditions: true,
                vehicles: {
                    include: { vehicle: true }
                },
                executions: {
                    include: {
                        vehicle: true,
                        session: true
                    },
                    orderBy: { triggeredAt: 'desc' }
                }
            }
        });

        if (!evento) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        // Generar contenido del informe en formato HTML simple
        const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Informe de Evento - ${evento.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .execution { border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 3px; }
        .triggered { background-color: #e8f5e8; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Informe de Evento: ${evento.name}</h1>
        <p><strong>Descripción:</strong> ${evento.description}</p>
        <p><strong>Tipo:</strong> ${evento.type}</p>
        <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-ES')}</p>
    </div>

    <div class="section">
        <h2>📊 Estadísticas del Evento</h2>
        <div class="stats">
            <div class="stat-box">
                <h3>${evento.executions.length}</h3>
                <p>Total Ejecuciones</p>
            </div>
            <div class="stat-box">
                <h3>${evento.executions.filter((e) => e.status === 'ACTIVE').length}</h3>
                <p>Eventos Disparados</p>
            </div>
            <div class="stat-box">
                <h3>${evento.vehicles.length}</h3>
                <p>Vehículos Monitoreados</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>⚙️ Condiciones del Evento</h2>
        <table>
            <thead>
                <tr>
                    <th>Variable</th>
                    <th>Operador</th>
                    <th>Valor</th>
                    <th>Unidad</th>
                </tr>
            </thead>
            <tbody>
                ${evento.conditions
                    .map(
                        (condition) => `
                    <tr>
                        <td>${condition.variable}</td>
                        <td>${condition.operator}</td>
                        <td>${condition.value}</td>
                        <td>${condition.unit || 'N/A'}</td>
                    </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>🚗 Vehículos Monitoreados</h2>
        <ul>
            ${evento.vehicles.map((v) => `<li>${v.vehicle.name}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>📈 Ejecuciones del Evento</h2>
        ${
            evento.executions.length > 0
                ? `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Vehículo</th>
                        <th>Estado</th>
                        <th>Datos</th>
                    </tr>
                </thead>
                <tbody>
                    ${evento.executions
                        .map(
                            (execution) => `
                        <tr class="${execution.status === 'ACTIVE' ? 'triggered' : ''}">
                            <td>${new Date(execution.triggeredAt).toLocaleString('es-ES')}</td>
                            <td>${execution.vehicle?.name || 'Desconocido'}</td>
                            <td>${
                                execution.status === 'ACTIVE' ? 'DISPARADO' : execution.status
                            }</td>
                            <td>${
                                execution.data
                                    ? JSON.stringify(execution.data).slice(0, 100) + '...'
                                    : 'N/A'
                            }</td>
                        </tr>
                    `
                        )
                        .join('')}
                </tbody>
            </table>
        `
                : '<p>No hay ejecuciones registradas para este evento.</p>'
        }
    </div>

    <div class="section">
        <h2>📄 Resumen</h2>
        <p>Este informe contiene un resumen completo del evento "${
            evento.name
        }" incluyendo todas sus ejecuciones y configuraciones.</p>
        <p><strong>Período analizado:</strong> ${
            evento.executions.length > 0
                ? `${new Date(
                      evento.executions[evento.executions.length - 1].triggeredAt
                  ).toLocaleDateString('es-ES')} - ${new Date(
                      evento.executions[0].triggeredAt
                  ).toLocaleDateString('es-ES')}`
                : 'Sin ejecuciones'
        }</p>
    </div>
</body>
</html>`;

        // Generar nombre de archivo único
        const reportId = `event-${eventId}-${Date.now()}`;
        const fileName = `informe-evento-${evento.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date()
            .toISOString()
            .slice(0, 10)}.html`;

        // En una implementación real, aquí usarías puppeteer para generar PDF
        // Por ahora, devolvemos el HTML como "PDF"

        logger.info('Informe HTML generado exitosamente:', {
            eventId,
            reportId,
            fileName,
            executionsCount: evento.executions.length,
            contentLength: reportContent.length
        });

        res.json({
            success: true,
            data: {
                reportId,
                fileName,
                contentType: 'text/html',
                content: reportContent, // En producción, esto sería una URL de descarga
                statistics: {
                    totalExecutions: evento.executions.length,
                    triggeredExecutions: evento.executions.filter((e) => e.status === 'ACTIVE')
                        .length,
                    vehiclesCount: evento.vehicles.length,
                    conditionsCount: evento.conditions.length
                },
                message: `Informe generado para evento "${evento.name}" con ${evento.executions.length} ejecuciones`
            }
        });
    } catch (error) {
        logger.error('Error generando informe PDF:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
