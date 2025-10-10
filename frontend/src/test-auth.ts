import { auth } from './services/auth';
import { logger } from './utils/logger';
import { t } from "./i18n";

async function testLogin() {
    try {
        logger.info('Iniciando prueba de login...');

        // Credenciales de prueba
        const credentials = {
            email: 'admin@DobackSoft.com',
            password: 'admin123'
        };

        logger.info('Intentando login con:', { email: credentials.email });

        // Intentar login
        const response = await auth.login(credentials);

        logger.info('Login exitoso:', {
            userId: response.user.id,
            email: response.user.email,
            role: response.user.role,
            tokenLength: response.access_token.length
        });

        // Verificar token
        const isValid = await auth.verifyToken();
        logger.info('Token verificado:', { isValid });

        // Obtener usuario actual
        const currentUser = auth.getUser();
        logger.info('Usuario actual:', {
            id: currentUser?.id,
            email: currentUser?.email,
            role: currentUser?.role
        });

        // Verificar autenticación
        const isAuthenticated = auth.isAuthenticated();
        logger.info('Estado de autenticación:', { isAuthenticated });

    } catch (error) {
        logger.error('Error en prueba de login:', error);
    }
}

// Ejecutar prueba
testLogin(); 