import { Router } from 'express';
import multer from 'multer';
import { Database } from '../config/database';
import { StabilityController } from '../controllers/StabilityController';
import { StabilityMeasurementsRepository } from '../repositories/StabilityMeasurementsRepository';
import { StabilityAnalysisService } from '../services/StabilityAnalysisService';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Inicializar dependencias
const db = new Database();
const measurementRepository = new StabilityMeasurementsRepository(db);
const analysisService = new StabilityAnalysisService();
const stabilityController = new StabilityController(analysisService, measurementRepository);

// Rutas de análisis de estabilidad
router.post('/upload/:sessionId', upload.single('file'), (req, res, next) => {
    stabilityController.uploadData(req, res).catch(next);
});

router.get('/metrics/:sessionId', (req, res, next) => {
    stabilityController.getMetrics(req, res).catch(next);
});

router.get('/events/:sessionId', (req, res, next) => {
    stabilityController.getEvents(req, res).catch(next);
});

router.get('/analysis/:sessionId', (req, res, next) => {
    stabilityController.generateAnalysis(req, res).catch(next);
});

router.get('/export/csv/:sessionId', (req, res, next) => {
    stabilityController.exportCSV(req, res).catch(next);
});

router.get('/export/json/:sessionId', (req, res, next) => {
    stabilityController.exportJSON(req, res).catch(next);
});

// Nuevo endpoint para análisis directo
router.post('/analyze', upload.single('file'), (req, res, next) => {
    stabilityController.analyzeData(req, res).catch(next);
});

export default router; 