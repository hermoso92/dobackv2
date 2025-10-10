import { authService } from './services/auth';
import { t } from "./i18n";

async function testLogin() {
    try {
        console.log('Iniciando prueba de login...');
        const result = await authService.login('admin@cosigein.com', 'admin123');
        console.log('Login exitoso:', result);
        console.log('Usuario autenticado:', result.user);
        console.log('Token de acceso:', result.access_token);
    } catch (error) {
        console.error('Error en el login:', error);
    }
}

testLogin(); 