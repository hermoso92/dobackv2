import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app';
import { prisma } from '../../vitest.setup';

describe('Events Integration Tests', () => {
    let testOrganization: any;
    let testUser: any;
    let testVehicle: any;
    let testSession: any;
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

        // Crear vehículo de prueba
        testVehicle = await prisma.vehicle.create({
            data: {
                name: 'Vehículo de Prueba',
                identifier: 'VH001',
                type: 'AMBULANCE',
                organizationId: testOrganization.id
            }
        });

        // Crear sesión de prueba
        testSession = await prisma.session.create({
            data: {
                vehicleId: testVehicle.id,
                startTime: new Date('2024-01-15T10:00:00Z'),
                status: 'ACTIVE',
                organizationId: testOrganization.id
            }
        });
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        await prisma.event.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.session.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.vehicle.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.user.deleteMany({
            where: { organizationId: testOrganization.id }
        });
        await prisma.organization.delete({
            where: { id: testOrganization.id }
        });
    });

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

    describe('GET /api/events', () => {
        it('debe obtener lista de eventos exitosamente', async () => {
            // Act
            const response = await request(app)
                .get('/api/events')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get('/api/events');

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/events', () => {
        it('debe crear evento exitosamente', async () => {
            // Arrange
            const eventData = {
                type: 'OVERTURN',
                severity: 'HIGH',
                vehicleId: testVehicle.id,
                sessionId: testSession.id,
                latitude: 40.4168,
                longitude: -3.7038,
                details: {
                    speed: 45.5,
                    acceleration: 2.3,
                    roll: 15.2
                }
            };

            // Act
            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData);

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.type).toBe(eventData.type);
            expect(response.body.data.severity).toBe(eventData.severity);
            expect(response.body.data.vehicleId).toBe(eventData.vehicleId);
            expect(response.body.data.sessionId).toBe(eventData.sessionId);
        });

        it('debe validar datos requeridos', async () => {
            // Act
            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    type: 'OVERTURN'
                    // Faltan campos requeridos
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('requeridos');
        });

        it('debe validar tipo de evento', async () => {
            // Arrange
            const eventData = {
                type: 'INVALID_TYPE',
                severity: 'HIGH',
                vehicleId: testVehicle.id,
                sessionId: testSession.id,
                latitude: 40.4168,
                longitude: -3.7038
            };

            // Act
            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('debe validar severidad', async () => {
            // Arrange
            const eventData = {
                type: 'OVERTURN',
                severity: 'INVALID_SEVERITY',
                vehicleId: testVehicle.id,
                sessionId: testSession.id,
                latitude: 40.4168,
                longitude: -3.7038
            };

            // Act
            const response = await request(app)
                .post('/api/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .post('/api/events')
                .send({
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    vehicleId: testVehicle.id,
                    sessionId: testSession.id
                });

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/events/:id', () => {
        let testEvent: any;

        beforeEach(async () => {
            // Crear evento de prueba
            testEvent = await prisma.event.create({
                data: {
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    vehicleId: testVehicle.id,
                    sessionId: testSession.id,
                    latitude: 40.4168,
                    longitude: -3.7038,
                    organizationId: testOrganization.id,
                    details: {
                        speed: 45.5,
                        acceleration: 2.3,
                        roll: 15.2
                    }
                }
            });
        });

        it('debe obtener evento por ID exitosamente', async () => {
            // Act
            const response = await request(app)
                .get(`/api/events/${testEvent.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testEvent.id);
            expect(response.body.data.type).toBe(testEvent.type);
            expect(response.body.data.severity).toBe(testEvent.severity);
        });

        it('debe manejar evento no encontrado', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/999')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('encontrado');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get(`/api/events/${testEvent.id}`);

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/events/vehicle/:vehicleId', () => {
        it('debe obtener eventos por vehículo', async () => {
            // Act
            const response = await request(app)
                .get(`/api/events/vehicle/${testVehicle.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('debe manejar vehículo inexistente', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/vehicle/999')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get(`/api/events/vehicle/${testVehicle.id}`);

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/events/session/:sessionId', () => {
        it('debe obtener eventos por sesión', async () => {
            // Act
            const response = await request(app)
                .get(`/api/events/session/${testSession.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('debe manejar sesión inexistente', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/session/999')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get(`/api/events/session/${testSession.id}`);

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/events/date-range', () => {
        it('debe obtener eventos por rango de fechas', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/date-range')
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-01-31'
                })
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('debe validar parámetros de fecha', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/date-range')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('fecha');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/date-range')
                .query({
                    startDate: '2024-01-01',
                    endDate: '2024-01-31'
                });

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/events/critical', () => {
        it('debe obtener eventos críticos', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/critical')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/critical');

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/events/stats', () => {
        it('debe obtener estadísticas de eventos', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/stats')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('total');
            expect(response.body.data).toHaveProperty('byType');
            expect(response.body.data).toHaveProperty('bySeverity');
            expect(response.body.data).toHaveProperty('critical');
            expect(response.body.data).toHaveProperty('last24Hours');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get('/api/events/stats');

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/events/:id', () => {
        let testEvent: any;

        beforeEach(async () => {
            // Crear evento de prueba
            testEvent = await prisma.event.create({
                data: {
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    vehicleId: testVehicle.id,
                    sessionId: testSession.id,
                    latitude: 40.4168,
                    longitude: -3.7038,
                    organizationId: testOrganization.id
                }
            });
        });

        it('debe actualizar evento exitosamente', async () => {
            // Arrange
            const updateData = {
                severity: 'MEDIUM',
                notes: 'Evento revisado'
            };

            // Act
            const response = await request(app)
                .put(`/api/events/${testEvent.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.severity).toBe(updateData.severity);
            expect(response.body.data.notes).toBe(updateData.notes);
        });

        it('debe manejar evento no encontrado', async () => {
            // Arrange
            const updateData = {
                severity: 'MEDIUM'
            };

            // Act
            const response = await request(app)
                .put('/api/events/999')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('encontrado');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .put(`/api/events/${testEvent.id}`)
                .send({
                    severity: 'MEDIUM'
                });

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /api/events/:id', () => {
        let testEvent: any;

        beforeEach(async () => {
            // Crear evento de prueba
            testEvent = await prisma.event.create({
                data: {
                    type: 'OVERTURN',
                    severity: 'HIGH',
                    vehicleId: testVehicle.id,
                    sessionId: testSession.id,
                    latitude: 40.4168,
                    longitude: -3.7038,
                    organizationId: testOrganization.id
                }
            });
        });

        it('debe eliminar evento exitosamente', async () => {
            // Act
            const response = await request(app)
                .delete(`/api/events/${testEvent.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('eliminado');
        });

        it('debe manejar evento no encontrado', async () => {
            // Act
            const response = await request(app)
                .delete('/api/events/999')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('encontrado');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .delete(`/api/events/${testEvent.id}`);

            // Assert
            expect(response.status).toBe(401);
        });
    });
});
