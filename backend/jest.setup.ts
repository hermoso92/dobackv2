import { createMockPrisma } from './src/test/utils';

// Configurar variables de entorno para tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/DobackSoft_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASS = 'test-password';
process.env.EMAIL_FROM = 'noreply@test.com';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.PASSWORD_MIN_LENGTH = '8';
process.env.PASSWORD_MAX_LENGTH = '100';
process.env.TELEMETRY_INTERVAL_MS = '1000';
process.env.TELEMETRY_BATCH_SIZE = '100';
process.env.ALERT_CHECK_INTERVAL_MS = '5000';
process.env.ALERT_THRESHOLD = '0.8';
process.env.MAINTENANCE_CHECK_INTERVAL_MS = '3600000';
process.env.MAINTENANCE_NOTIFICATION_DAYS = '7';
process.env.LOG_LEVEL = 'error';
process.env.LOG_FILE = 'logs/test.log';
process.env.WS_PORT = '3002';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Configurar cliente de Prisma mock global para tests
const mockPrisma = createMockPrisma();

// Hacer el mock global
global.prisma = mockPrisma;

beforeAll(() => {
    // No necesitamos limpiar la base de datos porque estamos usando un mock
});

afterAll(async () => {
    // No necesitamos desconectar porque estamos usando un mock
});

// Configurar matchers personalizados de Jest
expect.extend({
    toBeValidDate(received) {
        const pass = received instanceof Date && !isNaN(received.getTime());
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid date`,
                pass: true
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid date`,
                pass: false
            };
        }
    },
    toBeValidUUID(received) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const pass = uuidRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid UUID`,
                pass: true
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid UUID`,
                pass: false
            };
        }
    },
    toBeValidEmail(received) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const pass = emailRegex.test(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid email`,
                pass: true
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid email`,
                pass: false
            };
        }
    }
});
