import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/database';
import { createTestUser, generateTestToken } from '../helpers/auth';

describe('Eventos Routes', () => {
    let token: string;
    let testUser: any;

    beforeAll(async () => {
        testUser = await createTestUser();
        token = generateTestToken(testUser);
    });

    afterAll(async () => {
        await prisma.user.delete({
            where: { id: testUser.id }
        });
    });

    describe('POST /api/eventos', () => {
        it('should create a new event', async () => {
            const eventData = {
                nombre: 'Test Event',
                tipo: 'ESTABILIDAD',
                descripcion: 'Test event description',
                severidad: 'INFO',
                prioridad: 1,
                condiciones: [
                    {
                        variable: 'inclinacion',
                        operador: '>',
                        valor: 30
                    }
                ],
                variablesAMostrar: ['inclinacion', 'velocidad'],
                vehiculos: ['test-vehicle-id']
            };

            const response = await request(app)
                .post('/api/eventos')
                .set('Authorization', `Bearer ${token}`)
                .send(eventData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.nombre).toBe(eventData.nombre);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/eventos')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/eventos', () => {
        it('should list events', async () => {
            const response = await request(app)
                .get('/api/eventos')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter events by type', async () => {
            const response = await request(app)
                .get('/api/eventos?tipo=ESTABILIDAD')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach((event: any) => {
                expect(event.tipo).toBe('ESTABILIDAD');
            });
        });
    });

    describe('GET /api/eventos/:id', () => {
        let eventId: string;

        beforeAll(async () => {
            const event = await prisma.evento.create({
                data: {
                    nombre: 'Test Event',
                    tipo: 'ESTABILIDAD',
                    descripcion: 'Test event description',
                    severidad: 'INFO',
                    prioridad: 1,
                    condiciones: [
                        {
                            variable: 'inclinacion',
                            operador: '>',
                            valor: 30
                        }
                    ],
                    variablesAMostrar: ['inclinacion', 'velocidad'],
                    vehiculos: ['test-vehicle-id']
                }
            });
            eventId = event.id;
        });

        afterAll(async () => {
            await prisma.evento.delete({
                where: { id: eventId }
            });
        });

        it('should get event by id', async () => {
            const response = await request(app)
                .get(`/api/eventos/${eventId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(eventId);
        });

        it('should return 404 for non-existent event', async () => {
            const response = await request(app)
                .get('/api/eventos/non-existent-id')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/eventos/:id', () => {
        let eventId: string;

        beforeAll(async () => {
            const event = await prisma.evento.create({
                data: {
                    nombre: 'Test Event',
                    tipo: 'ESTABILIDAD',
                    descripcion: 'Test event description',
                    severidad: 'INFO',
                    prioridad: 1,
                    condiciones: [
                        {
                            variable: 'inclinacion',
                            operador: '>',
                            valor: 30
                        }
                    ],
                    variablesAMostrar: ['inclinacion', 'velocidad'],
                    vehiculos: ['test-vehicle-id']
                }
            });
            eventId = event.id;
        });

        afterAll(async () => {
            await prisma.evento.delete({
                where: { id: eventId }
            });
        });

        it('should update event', async () => {
            const updateData = {
                nombre: 'Updated Event',
                severidad: 'WARNING'
            };

            const response = await request(app)
                .put(`/api/eventos/${eventId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.nombre).toBe(updateData.nombre);
            expect(response.body.severidad).toBe(updateData.severidad);
        });
    });

    describe('DELETE /api/eventos/:id', () => {
        let eventId: string;

        beforeEach(async () => {
            const event = await prisma.evento.create({
                data: {
                    nombre: 'Test Event',
                    tipo: 'ESTABILIDAD',
                    descripcion: 'Test event description',
                    severidad: 'INFO',
                    prioridad: 1,
                    condiciones: [
                        {
                            variable: 'inclinacion',
                            operador: '>',
                            valor: 30
                        }
                    ],
                    variablesAMostrar: ['inclinacion', 'velocidad'],
                    vehiculos: ['test-vehicle-id']
                }
            });
            eventId = event.id;
        });

        it('should delete event', async () => {
            const response = await request(app)
                .delete(`/api/eventos/${eventId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(204);

            const deletedEvent = await prisma.evento.findUnique({
                where: { id: eventId }
            });
            expect(deletedEvent).toBeNull();
        });
    });

    describe('POST /api/eventos/evaluar/:vehiculoId', () => {
        it('should evaluate events for vehicle', async () => {
            const vehicleId = 'test-vehicle-id';
            const data = {
                datos: {
                    inclinacion: 35,
                    velocidad: 60
                }
            };

            const response = await request(app)
                .post(`/api/eventos/evaluar/${vehicleId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(data);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });
    });
});
