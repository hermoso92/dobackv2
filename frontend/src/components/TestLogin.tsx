import React, { useEffect } from 'react';
import { authService } from '../services/auth';
import { logger } from '../utils/logger';
export const TestLogin: React.FC = () => {
    useEffect(() => {
        const autoLogin = async () => {
            try {
                logger.info('Iniciando login automático...');
                const result = await authService.login('admin@cosigein.com', 'admin123');
                logger.info('Login exitoso:', result);
                logger.info('Usuario autenticado:', result.user);
                logger.info('Token de acceso:', result.access_token);
            } catch (error) {
                logger.error('Error en el login:', error);
            }
        };

        autoLogin();
    }, []);

    return null;
}; 