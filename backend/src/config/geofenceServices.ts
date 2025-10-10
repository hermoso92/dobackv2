import { PrismaClient } from '@prisma/client';
import { GeofenceRuleController } from '../controllers/geofenceRuleController';
import { RealTimeGeofenceController } from '../controllers/realTimeGeofenceController';
import { createGeofenceRulesRouter } from '../routes/geofenceRules';
import realTimeGeofenceRoutes from '../routes/realTimeGeofence';
import { GeofenceRuleEngine } from '../services/GeofenceRuleEngine';
import { logger } from '../utils/logger';

// Instancias globales de servicios de geocercas
let geofenceRuleEngine: GeofenceRuleEngine;
let geofenceRuleController: GeofenceRuleController;
let realTimeGeofenceController: RealTimeGeofenceController;
let geofenceRulesRouter: any;
let realTimeGeofenceRouter: any;

export const initializeGeofenceServices = (prisma: PrismaClient) => {
    try {
        logger.info('Inicializando servicios de geocercas...');

        // Inicializar motor de reglas
        geofenceRuleEngine = new GeofenceRuleEngine(prisma);

        // Inicializar controladores
        geofenceRuleController = new GeofenceRuleController(prisma, geofenceRuleEngine);
        realTimeGeofenceController = new RealTimeGeofenceController(prisma, geofenceRuleEngine);

        // Crear routers
        geofenceRulesRouter = createGeofenceRulesRouter(geofenceRuleController);
        realTimeGeofenceRouter = realTimeGeofenceRoutes;

        logger.info('Servicios de geocercas inicializados correctamente');

        return {
            geofenceRuleEngine,
            geofenceRuleController,
            realTimeGeofenceController,
            geofenceRulesRouter,
            realTimeGeofenceRouter
        };
    } catch (error) {
        logger.error('Error inicializando servicios de geocercas:', error);
        throw error;
    }
};

export const getGeofenceServices = () => {
    if (!geofenceRuleEngine || !geofenceRuleController || !realTimeGeofenceController) {
        throw new Error('Servicios de geocercas no inicializados');
    }

    return {
        geofenceRuleEngine,
        geofenceRuleController,
        realTimeGeofenceController,
        geofenceRulesRouter,
        realTimeGeofenceRouter
    };
};
