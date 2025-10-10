import React, { useEffect } from 'react';
import { authService } from '../services/auth';
export const TestLogin: React.FC = () => {
    useEffect(() => {
        const autoLogin = async () => {
            try {
                console.log('Iniciando login automático...');
                const result = await authService.login('admin@cosigein.com', 'admin123');
                console.log('Login exitoso:', result);
                console.log('Usuario autenticado:', result.user);
                console.log('Token de acceso:', result.access_token);
            } catch (error) {
                console.error('Error en el login:', error);
            }
        };

        autoLogin();
    }, []);

    return null;
}; 