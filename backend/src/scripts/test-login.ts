import axios from 'axios';
import { logger } from '../utils/logger';

const testLogin = async () => {
    try {
        const response = await axios.post(
            'http://localhost:9998/api/auth/login',
            {
                email: 'admin@cosigein.com',
                password: 'password123'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info('Login exitoso', {
            status: response.status,
            data: response.data
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            logger.error('Error en login', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                full: error.toJSON()
            });
            if (error.response?.data) {
                console.error('Respuesta del backend:', error.response.data);
            }
        } else {
            logger.error('Error desconocido', { error });
        }
        throw error;
    }
};

// Ejecutar el test
testLogin()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
