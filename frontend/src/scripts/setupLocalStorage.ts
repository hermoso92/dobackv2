import { LocalStorage } from 'node-localstorage';
// Inicializar localStorage
const localStorage = new LocalStorage('./localStorage');

// Configurar el token de prueba
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJvcmdhbml6YXRpb25JZCI6Ijk0NDU2OGUyLTgyZGEtNDI4NS1iMmIyLTM5MWQ4NmE4YTQxMCJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Configurar localStorage con datos de prueba
localStorage.setItem('auth_token', testToken);
localStorage.setItem('refresh_token', 'test-refresh-token');
localStorage.setItem('auth_user', JSON.stringify({
    id: '123',
    email: 'test@example.com',
    role: 'admin',
    organizationId: '944568e2-82da-4285-b2b2-391d86a8a410'
}));

// Asignar localStorage a globalThis para que esté disponible globalmente
(globalThis as any).localStorage = localStorage;

export default localStorage; 