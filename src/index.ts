import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import sessionsUploadRoutes from './routes/sessionsUpload';
import stabilityRoutes from './routes/stability.routes';
import { logger } from './utils/logger';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/stability', stabilityRoutes);
app.use('/api/sesion', sessionsUploadRoutes);

// Manejador de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);

    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            message: err.message || 'Internal server error',
            code: err.code || 'INTERNAL_ERROR'
        }
    });
});

// Iniciar servidor
app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
}); 