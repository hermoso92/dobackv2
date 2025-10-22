
import { AuthService } from '../../services/AuthService';
import { NotificationService } from '../../services/NotificationService';
import { UserService } from '../../services/UserService';
import { ValidationService } from '../../services/ValidationService';
import { createMockLogger } from '../../test/utils';
import { UserRole } from '../../types/enums';

describe('Authentication Flow Integration Tests', () => {
    let prisma: PrismaClient;
    let authService: AuthService;
    let notificationService: NotificationService;
    let userService: UserService;
    let validationService: ValidationService;
    let mockLogger: any;

    beforeAll(async () => {
        prisma = new PrismaClient();
        mockLogger = createMockLogger();
        notificationService = new NotificationService();
        userService = new UserService();
        validationService = new ValidationService();
        authService = new AuthService(notificationService);

        // Limpiar la base de datos de prueba
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Registration and Authentication Flow', () => {
        const testUser = {
            email: 'test@example.com',
            name: 'Test User',
            password: 'TestPass123!',
            role: UserRole.OPERATOR,
            organizationId: 1
        };

        it('should complete the full registration process', async () => {
            // 1. Validar datos de usuario
            const validationResult = validationService.validateUserData(testUser);
            expect(validationResult.isValid).toBe(true);
            expect(validationResult.errors).toHaveLength(0);

            // 2. Registrar usuario
            const registeredUser = await authService.register(testUser);
            expect(registeredUser).toBeDefined();
            expect(registeredUser.email).toBe(testUser.email);
            expect(registeredUser.name).toBe(testUser.name);
            expect(registeredUser.role).toBe(testUser.role);

            // 3. Verificar que se envió el email de verificación
            const notifications = await notificationService.getNotificationsByEmail(testUser.email);
            expect(notifications).toContainEqual(
                expect.objectContaining({
                    type: 'EMAIL',
                    subject: expect.stringContaining('Verificación de cuenta')
                })
            );
        });

        it('should complete the full login process', async () => {
            // 1. Intentar login
            const loginResult = await authService.login(testUser.email, testUser.password);
            expect(loginResult).toBeDefined();
            expect(loginResult.token).toBeDefined();
            expect(loginResult.user).toBeDefined();
            expect(loginResult.user.email).toBe(testUser.email);

            // 2. Validar token
            const tokenValidation = await authService.validateToken(loginResult.token);
            expect(tokenValidation).toBeDefined();
            expect(tokenValidation.email).toBe(testUser.email);
            expect(tokenValidation.role).toBe(testUser.role);

            // 3. Verificar registro de actividad
            const userActivity = await userService.getUserActivity(loginResult.user.id);
            expect(userActivity).toContainEqual(
                expect.objectContaining({
                    type: 'LOGIN',
                    status: 'SUCCESS'
                })
            );
        });

        it('should handle password reset flow', async () => {
            // 1. Solicitar reset de contraseña
            await authService.resetPassword(testUser.email);

            // 2. Verificar que se envió el email de reset
            const notifications = await notificationService.getNotificationsByEmail(testUser.email);
            expect(notifications).toContainEqual(
                expect.objectContaining({
                    type: 'EMAIL',
                    subject: expect.stringContaining('Restablecimiento de contraseña')
                })
            );

            // 3. Cambiar contraseña
            const newPassword = 'NewTestPass123!';
            await authService.changePassword(testUser.email, testUser.password, newPassword);

            // 4. Verificar que podemos hacer login con la nueva contraseña
            const loginResult = await authService.login(testUser.email, newPassword);
            expect(loginResult).toBeDefined();
            expect(loginResult.token).toBeDefined();
        });

        it('should handle session management', async () => {
            // 1. Login para obtener token
            const loginResult = await authService.login(testUser.email, testUser.password);

            // 2. Obtener sesiones activas
            const sessions = await authService.getUserSessions(loginResult.user.id);
            expect(sessions.length).toBeGreaterThan(0);

            // 3. Cerrar sesión
            await authService.logout(loginResult.user.id);

            // 4. Verificar que la sesión se cerró
            const updatedSessions = await authService.getUserSessions(loginResult.user.id);
            expect(updatedSessions.length).toBe(0);
        });

        it('should handle concurrent sessions', async () => {
            // 1. Crear múltiples sesiones
            const session1 = await authService.login(testUser.email, testUser.password);
            const session2 = await authService.login(testUser.email, testUser.password);
            const session3 = await authService.login(testUser.email, testUser.password);

            // 2. Verificar que todas las sesiones son válidas
            const sessions = await authService.getUserSessions(testUser.id);
            expect(sessions.length).toBe(3);

            // 3. Revocar todas las sesiones
            await authService.revokeAllSessions(testUser.id);

            // 4. Verificar que todas las sesiones fueron revocadas
            const updatedSessions = await authService.getUserSessions(testUser.id);
            expect(updatedSessions.length).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid registration data', async () => {
            const invalidUser = {
                email: 'invalid-email',
                name: '',
                password: '123',
                role: 'INVALID_ROLE',
                organizationId: -1
            };

            // 1. Validar datos inválidos
            const validationResult = validationService.validateUserData(invalidUser);
            expect(validationResult.isValid).toBe(false);
            expect(validationResult.errors.length).toBeGreaterThan(0);

            // 2. Intentar registro con datos inválidos
            await expect(authService.register(invalidUser)).rejects.toThrow();
        });

        it('should handle invalid login attempts', async () => {
            // 1. Intentar login con email inexistente
            await expect(
                authService.login('nonexistent@example.com', 'password123')
            ).rejects.toThrow('Usuario no encontrado');

            // 2. Intentar login con contraseña incorrecta
            await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
                'Contraseña incorrecta'
            );
        });

        it('should handle token validation errors', async () => {
            // 1. Intentar validar token inválido
            await expect(authService.validateToken('invalid-token')).rejects.toThrow(
                'Token inválido'
            );

            // 2. Intentar validar token expirado
            const expiredToken =
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMze3kqdaNpKC8xA9XR7_R8Q';
            await expect(authService.validateToken(expiredToken)).rejects.toThrow('Token inválido');
        });

        it('should handle password reset errors', async () => {
            // 1. Intentar reset con email inexistente
            await expect(authService.resetPassword('nonexistent@example.com')).rejects.toThrow(
                'Usuario no encontrado'
            );

            // 2. Intentar cambiar contraseña con token inválido
            await expect(
                authService.changePassword('test@example.com', 'wrongpassword', 'newpassword')
            ).rejects.toThrow('Contraseña actual incorrecta');
        });
    });
});
