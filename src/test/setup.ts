import { afterEach } from '@jest/globals';
import { config } from 'dotenv';
import { logger } from '../utils/logger';
import { MockDatabase } from './mocks/database';
import { clearMailMocks } from './mocks/nodemailer';

// Cargar variables de entorno
config();

// Configurar logger para pruebas
logger.transports.forEach((t: any) => {
    t.silent = true;
});

// Mock de base de datos
jest.mock('../config/database', () => ({
    Database: MockDatabase
}));

// Limpiar mocks después de cada prueba
afterEach(() => {
    jest.clearAllMocks();
    clearMailMocks();
    MockDatabase.getInstance().clearMocks();
});

// Configurar timeout global para pruebas
jest.setTimeout(10000);
