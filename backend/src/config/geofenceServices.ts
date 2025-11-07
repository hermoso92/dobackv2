import { PrismaClient } from '@prisma/client';
import { GeofenceRuleController } from '../controllers/geofenceRuleController';
import { RealTimeGeofenceController } from '../controllers/realTimeGeofenceController';
import { createGeofenceRulesRouter } from '../routes/geofenceRules';
import realTimeGeofenceRoutes from '../routes/realTimeGeofence';
import { GeofenceRuleEngine } from '../services/GeofenceRuleEngine';
import { RealTimeGeofenceService } from '../services/RealTimeGeofenceService';
import { WebSocketGeofenceService } from '../services/WebSocketGeofenceService';
import { logger } from '../utils/logger';

// Instancias globales de servicios de geocercas
let geofenceRuleEngine: GeofenceRuleEngine;
let geofenceRuleController: GeofenceRuleController;
let realTimeGeofenceController: RealTimeGeofenceController;
let realTimeGeofenceService: RealTimeGeofenceService;
let webSocketGeofenceService: WebSocketGeofenceService;
let geofenceRulesRouter: any;
let realTimeGeofenceRouter: any;

export const initializeGeofenceServices = (prisma: PrismaClient) => {
    try {
        logger.info('Inicializando servicios de geocercas...');

        // 1. Inicializar servicio base de geocercas
        realTimeGeofenceService = new RealTimeGeofenceService(prisma);

        // 2. Inicializar controladores (no necesitan motor de reglas para funcionar)
        geofenceRuleController = new GeofenceRuleController(prisma);
        realTimeGeofenceController = new RealTimeGeofenceController(prisma);

        // 3. Crear routers
        geofenceRulesRouter = createGeofenceRulesRouter(geofenceRuleController);
        realTimeGeofenceRouter = realTimeGeofenceRoutes;

        logger.info('✅ Servicios básicos de geocercas inicializados correctamente');
        logger.info('ℹ️ Motor de reglas y WebSocket se inicializarán cuando el servidor HTTP esté disponible');

        return {
            realTimeGeofenceService,
            geofenceRuleController,
            realTimeGeofenceController,
            geofenceRulesRouter,
            realTimeGeofenceRouter
        };
    } catch (error) {
        logger.error('❌ Error inicializando servicios de geocercas:', error);
        // No lanzar error para no bloquear el inicio del servidor
        logger.warn('⚠️ Continuando sin algunos servicios de geocercas');
        return null;
    }
};

export const getGeofenceServices = () => {
    if (!geofenceRuleController || !realTimeGeofenceController) {
        logger.warn('⚠️ Servicios de geocercas no completamente inicializados');
        return null;
    }

    return {
        geofenceRuleEngine,
        geofenceRuleController,
        realTimeGeofenceController,
        realTimeGeofenceService,
        webSocketGeofenceService,
        geofenceRulesRouter,
        realTimeGeofenceRouter
    };
};
