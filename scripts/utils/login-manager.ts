import axios from 'axios';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { loggerApp } from '../../backend/src/utils/logger';

loadEnv({ path: path.resolve(__dirname, '../../config.env') });

const backendUrl = process.env.APP_URL;

if (!backendUrl) {
    loggerApp.error('APP_URL no está definido en config.env');
    process.exitCode = 1;
    throw new Error('Config env missing APP_URL');
}

const email = process.env.DOBACKSOFT_MANAGER_EMAIL ?? 'antoniohermoso92@manager.com';
const password = process.env.DOBACKSOFT_MANAGER_PASSWORD ?? 'password123';

async function login() {
    loggerApp.info('Solicitando token de acceso...', { backendUrl });

    const response = await axios.post(
        `${backendUrl}/api/auth/login`,
        {
            email,
            password
        },
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.data?.success) {
        throw new Error(`Login fallido: ${response.data?.message ?? 'respuesta sin éxito'}`);
    }

    const { access_token: accessToken, refresh_token: refreshToken, user } = response.data;

    loggerApp.info('Token obtenido correctamente', {
        organizationId: user.organizationId,
        userId: user.id
    });

    loggerApp.info(`Access token: ${accessToken}`);
    loggerApp.info(`Refresh token: ${refreshToken}`);
}

login().catch((error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    loggerApp.error('Error al solicitar token', {
        status,
        data: data ?? error.message
    });

    process.exitCode = 1;
});

