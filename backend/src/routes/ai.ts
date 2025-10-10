import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';

const router = Router();
const aiController = new AIController();

// Aplicar middleware de autenticación y organización a todas las rutas
router.use(authenticate);
router.use(attachOrg);

// Rutas para explicaciones
router.get('/explanations', aiController.getExplanations);
router.get('/explanations/:id', aiController.getExplanation);
router.post('/explanations/generate', aiController.generateExplanation);

// Rutas para análisis
router.post('/analyze', aiController.performAnalysis);

// Rutas para chat
router.get('/chat/sessions', aiController.getChatSessions);
router.get('/chat/sessions/:id', aiController.getChatSession);
router.post('/chat/sessions', aiController.createChatSession);
router.post('/chat/sessions/:id/messages', aiController.sendChatMessage);

// Rutas para predicciones y patrones
router.get('/predictions', aiController.getPredictions);
router.get('/patterns', aiController.getPatterns);

// Rutas para sugerencias
router.post('/suggestions/generate', aiController.generateSuggestions);
router.post('/suggestions/:id/apply', aiController.applySuggestion);
router.post('/suggestions/:suggestionId/explain', aiController.explainSuggestion);
router.get('/suggestions/vehicles', aiController.getVehicleSpecificRecommendations);

// Rutas para módulos específicos
router.post('/modules/:module/explain', aiController.getModuleExplanation);

// Rutas para estadísticas y configuración
router.get('/stats', aiController.getAIStats);
router.get('/settings', aiController.getAISettings);
router.put('/settings', aiController.updateAISettings);

// NUEVA: Ruta para análisis optimizado
router.get('/analysis/optimized', aiController.getOptimizedAnalysis);

// NUEVA: Ruta para generar explicación contextual
router.post('/explanation/contextual', aiController.generateContextualExplanation);

export default router;
