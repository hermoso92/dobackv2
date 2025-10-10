import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app';
import { prisma } from '../../vitest.setup';

describe('Auth Integration Tests', () => {
    let testOrganization: any;
    let testUser: any;
    let authToken: string;

    beforeAll(async () => {
        // Crear organización de prueba
        testOrganization = await prisma.organization.create({
            data: {
                name: 'Organización de Pruebas',
                apiKey: 'test-api-key-' + Date.now()
            }
        });

        // Crear usuario de prueba
        const hashedPassword = await bcrypt.hash('password123', 10);
        testUser = await prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Usuario de Prueba',
                password: hashedPassword,
                role: 'ADMIN',
                organizationId: testOrganization.id,
                status: 'ACTIVE'
            }
        });
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        await prisma.user.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.organization.delete({
            where: { id: testOrganization.id }
        });
    });

    beforeEach(async () => {
        // Limpiar tokens antes de cada test
        authToken = '';
    });

    describe('POST /api/auth/login', () => {
        it('debe hacer login exitoso con credenciales válidas', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.user.role).toBe('ADMIN');

            // Guardar token para otros tests
            authToken = response.body.data.token;
        });

        it('debe rechazar login con credenciales inválidas', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Credenciales');
        });

        it('debe rechazar login con email inexistente', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('debe validar datos requeridos', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('requeridos');
        });
    });

    describe('POST /api/auth/register', () => {
        it('debe registrar usuario exitosamente', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    name: 'Nuevo Usuario',
                    password: 'password123',
                    role: 'OPERATOR',
                    organizationId: testOrganization.id
                });

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.email).toBe('newuser@example.com');
            expect(response.body.data.role).toBe('OPERATOR');

            // Limpiar usuario creado
            await prisma.user.delete({
                where: { email: 'newuser@example.com' }
            });
        });

        it('debe rechazar registro con email duplicado', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com', // Email ya existe
                    name: 'Usuario Duplicado',
                    password: 'password123',
                    role: 'OPERATOR',
                    organizationId: testOrganization.id
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('registrado');
        });

        it('debe validar datos requeridos en registro', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'incomplete@example.com'
                    // Faltan otros campos requeridos
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/change-password', () => {
        beforeEach(async () => {
            // Obtener token de autenticación
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            authToken = loginResponse.body.data.token;
        });

        it('debe cambiar contraseña exitosamente', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'password123',
                    newPassword: 'newpassword123'
                });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('exitosamente');

            // Restaurar contraseña original
            const hashedPassword = await bcrypt.hash('password123', 10);
            await prisma.user.update({
                where: { id: testUser.id },
                data: { password: hashedPassword }
            });
        });

        it('debe rechazar cambio con contraseña actual incorrecta', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123'
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('incorrecta');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/change-password')
                .send({
                    currentPassword: 'password123',
                    newPassword: 'newpassword123'
                });

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/auth/reset-password', () => {
        it('debe resetear contraseña exitosamente', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: 'test@example.com'
                });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('enviada');
        });

        it('debe manejar email inexistente', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: 'nonexistent@example.com'
                });

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('encontrado');
        });
    });

    describe('POST /api/auth/logout', () => {
        beforeEach(async () => {
            // Obtener token de autenticación
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            authToken = loginResponse.body.data.token;
        });

        it('debe hacer logout exitosamente', async () => {
            // Act
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('exitoso');
        });
    });

    describe('GET /api/auth/validate-token', () => {
        beforeEach(async () => {
            // Obtener token de autenticación
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            authToken = loginResponse.body.data.token;
        });

        it('debe validar token exitosamente', async () => {
            // Act
            const response = await request(app)
                .get('/api/auth/validate-token')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('userId');
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data.email).toBe('test@example.com');
        });

        it('debe rechazar token inválido', async () => {
            // Act
            const response = await request(app)
                .get('/api/auth/validate-token')
                .set('Authorization', 'Bearer invalid-token');

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('debe rechazar request sin token', async () => {
            // Act
            const response = await request(app)
                .get('/api/auth/validate-token');

            // Assert
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Middleware de autenticación', () => {
        it('debe proteger rutas que requieren autenticación', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles');

            // Assert
            expect(response.status).toBe(401);
        });

        it('debe permitir acceso con token válido', async () => {
            // Obtener token de autenticación
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            const token = loginResponse.body.data.token;

            // Act
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', `Bearer ${token}`);

            // Assert
            expect(response.status).toBe(200);
        });
    });
});
