import { LocalStorage } from 'node-localstorage';
(globalThis as any).localStorage = new LocalStorage('./scratch');

// Configurar un token de prueba
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJvcmdhbml6YXRpb25JZCI6IjA5ZTA4ZmY4LWNkMjEtNGYyMi04NTQzLTM4OTU1NDM2MDc4NyJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
localStorage.setItem('auth_token', testToken);
localStorage.setItem('refresh_token', 'test-refresh-token');
localStorage.setItem('auth_user', JSON.stringify({
    id: '123',
    email: 'test@example.com',
    role: 'admin',
    organizationId: '09e08ff8-cd21-4f22-8543-389554360787'
}));

// Importar el script principal después de inicializar localStorage
dynamicImport();

async function dynamicImport() {
    await import('./createTestEvent');
} 