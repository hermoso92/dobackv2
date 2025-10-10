import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno de prueba
config({
    path: path.resolve(process.cwd(), '.env.test')
});

// Configurar variables de entorno por defecto para pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/DobackSoft_test';
