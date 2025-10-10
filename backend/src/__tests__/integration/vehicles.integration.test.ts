import bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app';
import { prisma } from '../../vitest.setup';

describe('Vehicles Integration Tests', () => {
    let testOrganization: any;
    let testUser: any;
    let authToken: string;
    let testVehicle: any;

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

    describe('GET /api/vehicles', () => {
        it('debe obtener lista de vehículos exitosamente', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles');

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/vehicles', () => {
        it('debe crear vehículo exitosamente', async () => {
            // Arrange
            const vehicleData = {
                name: 'Vehículo de Prueba',
                identifier: 'VH001',
                type: 'AMBULANCE',
                description: 'Vehículo para pruebas de integración'
            };

            // Act
            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${authToken}`)
                .send(vehicleData);

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.name).toBe(vehicleData.name);
            expect(response.body.data.identifier).toBe(vehicleData.identifier);
            expect(response.body.data.type).toBe(vehicleData.type);

            // Guardar vehículo para otros tests
            testVehicle = response.body.data;
        });

        it('debe validar datos requeridos', async () => {
            // Act
            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Vehículo Incompleto'
                    // Faltan campos requeridos
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('requeridos');
        });

        it('debe rechazar identificador duplicado', async () => {
            // Arrange
            const vehicleData = {
                name: 'Otro Vehículo',
                identifier: 'VH001', // Mismo identificador
                type: 'FIRE_TRUCK'
            };

            // Act
            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${authToken}`)
                .send(vehicleData);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('duplicado');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .post('/api/vehicles')
                .send({
                    name: 'Vehículo Sin Auth',
                    identifier: 'VH002',
                    type: 'AMBULANCE'
                });

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/vehicles/:id', () => {
        it('debe obtener vehículo por ID exitosamente', async () => {
            // Act
            const response = await request(app)
                .get(`/api/vehicles/${testVehicle.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testVehicle.id);
            expect(response.body.data.name).toBe(testVehicle.name);
        });

        it('debe manejar vehículo no encontrado', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles/999')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('encontrado');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get(`/api/vehicles/${testVehicle.id}`);

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('PUT /api/vehicles/:id', () => {
        it('debe actualizar vehículo exitosamente', async () => {
            // Arrange
            const updateData = {
                name: 'Vehículo Actualizado',
                description: 'Descripción actualizada'
            };

            // Act
            const response = await request(app)
                .put(`/api/vehicles/${testVehicle.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.description).toBe(updateData.description);
        });

        it('debe manejar vehículo no encontrado', async () => {
            // Arrange
            const updateData = {
                name: 'Vehículo Inexistente'
            };

            // Act
            const response = await request(app)
                .put('/api/vehicles/999')
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
                .put(`/api/vehicles/${testVehicle.id}`)
                .send({
                    name: 'Vehículo Sin Auth'
                });

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /api/vehicles/:id', () => {
        it('debe eliminar vehículo exitosamente', async () => {
            // Act
            const response = await request(app)
                .delete(`/api/vehicles/${testVehicle.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('eliminado');
        });

        it('debe manejar vehículo no encontrado', async () => {
            // Act
            const response = await request(app)
                .delete('/api/vehicles/999')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('encontrado');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .delete('/api/vehicles/1');

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/vehicles/search', () => {
        beforeEach(async () => {
            // Crear vehículos para búsqueda
            await prisma.vehicle.createMany({
                data: [
                    {
                        name: 'Ambulancia 1',
                        identifier: 'AMB001',
                        type: 'AMBULANCE',
                        organizationId: testOrganization.id
                    },
                    {
                        name: 'Bombero 1',
                        identifier: 'BOM001',
                        type: 'FIRE_TRUCK',
                        organizationId: testOrganization.id
                    }
                ]
            });
        });

        it('debe buscar vehículos por nombre', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles/search')
                .query({ q: 'ambulancia' })
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('debe buscar vehículos por identificador', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles/search')
                .query({ q: 'AMB001' })
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('debe retornar array vacío si no hay resultados', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles/search')
                .query({ q: 'inexistente' })
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles/search')
                .query({ q: 'test' });

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/vehicles/stats', () => {
        it('debe obtener estadísticas de vehículos', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles/stats')
                .set('Authorization', `Bearer ${authToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('total');
            expect(response.body.data).toHaveProperty('byType');
            expect(response.body.data).toHaveProperty('active');
            expect(response.body.data).toHaveProperty('inactive');
        });

        it('debe requerir autenticación', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles/stats');

            // Assert
            expect(response.status).toBe(401);
        });
    });

    describe('Autorización por roles', () => {
        let operatorUser: any;
        let operatorToken: string;

        beforeAll(async () => {
            // Crear usuario con rol OPERATOR
            const hashedPassword = await bcrypt.hash('password123', 10);
            operatorUser = await prisma.user.create({
                data: {
                    email: 'operator@example.com',
                    name: 'Operador de Prueba',
                    password: hashedPassword,
                    role: 'OPERATOR',
                    organizationId: testOrganization.id,
                    status: 'ACTIVE'
                }
            });
        });

        beforeEach(async () => {
            // Obtener token de operador
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'operator@example.com',
                    password: 'password123'
                });
            operatorToken = loginResponse.body.data.token;
        });

        it('debe permitir a OPERATOR ver vehículos', async () => {
            // Act
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', `Bearer ${operatorToken}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('debe permitir a OPERATOR crear vehículos', async () => {
            // Arrange
            const vehicleData = {
                name: 'Vehículo Operador',
                identifier: 'VH_OP001',
                type: 'AMBULANCE'
            };

            // Act
            const response = await request(app)
                .post('/api/vehicles')
                .set('Authorization', `Bearer ${operatorToken}`)
                .send(vehicleData);

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });
    });
});
