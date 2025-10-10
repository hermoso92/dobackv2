import { Router } from 'express';
import { ObservabilityController } from '../controllers/ObservabilityController';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';

const router = Router();
const observabilityController = new ObservabilityController();

// Aplicar middleware de autenticación y organización a todas las rutas
router.use(authenticate);
router.use(attachOrg);

// Rutas para gestión de logs
router.get('/logs', observabilityController.getLogs);
router.get('/logs/:id', observabilityController.getLog);
router.get('/logs/export', observabilityController.exportLogs);

// Rutas para gestión de métricas
router.get('/metrics', observabilityController.getMetrics);
router.get('/metrics/system', observabilityController.getSystemMetrics);
router.get('/metrics/performance', observabilityController.getPerformanceMetrics);
router.get('/metrics/export', observabilityController.exportMetrics);

// Rutas para health checks
router.get('/health', observabilityController.getHealth);
router.get('/health/:checkName', observabilityController.getHealthCheck);

// Rutas para gestión de alertas
router.get('/alerts', observabilityController.getAlerts);
router.get('/alerts/:id', observabilityController.getAlert);
router.post('/alerts/:id/acknowledge', observabilityController.acknowledgeAlert);
router.post('/alerts/:id/resolve', observabilityController.resolveAlert);

// Rutas para gestión de tests
router.get('/tests/suites', observabilityController.getTestSuites);
router.get('/tests/suites/:id', observabilityController.getTestSuite);
router.post('/tests/run', observabilityController.runTestSuite);
router.get('/tests/:id', observabilityController.getTestResult);

// Rutas para estadísticas de observabilidad
router.get('/stats', observabilityController.getObservabilityStats);

// Rutas para configuración de observabilidad
router.get('/settings', observabilityController.getObservabilitySettings);
router.put('/settings', observabilityController.updateObservabilitySettings);

export default router;
