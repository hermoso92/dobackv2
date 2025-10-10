import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
export const app = express();
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { apiRoutes } from './routes';
import { loggerMiddleware } from './utils/logger';

// Cargar variables de entorno
config();

// Crear aplicación Express
const app = express();

// Middleware básico
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// Rutas
app.use('/api', apiRoutes);

// Manejadores de errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app; 