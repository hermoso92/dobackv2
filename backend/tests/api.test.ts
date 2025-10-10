import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app';

const prisma = new PrismaClient();

describe('API Endpoints', () => {
    let authToken: string;

    beforeAll(async () => {
        // Crear un usuario de prueba y generar token
        const testUser = await prisma.user.create({
            data: {
                email: 'test@example.com',
                name: 'Test User',
                password: 'hashedPassword',
                role: 'OPERATOR',
                organizationId: 1
            }
        });

        authToken = jwt.sign(
            { userId: testUser.id, role: testUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        await prisma.user.deleteMany({
            where: { email: 'test@example.com' }
        });
        await prisma.$disconnect();
    });

    describe('GET /api/vehicles', () => {
        it('should respond with 200 when authenticated', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should respond with 401 when not authenticated', async () => {
            const response = await request(app).get('/api/vehicles');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/sessions', () => {
        it('should respond with 400 when payload is empty', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should respond with 400 when vehicleId is missing', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    startTime: new Date().toISOString()
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('vehicleId');
        });

        it('should respond with 401 when not authenticated', async () => {
            const response = await request(app).post('/api/sessions').send({
                vehicleId: 1,
                startTime: new Date().toISOString()
            });

            expect(response.status).toBe(401);
        });
    });

    describe('Authentication Middleware', () => {
        const protectedRoutes = ['/api/vehicles', '/api/sessions', '/api/events', '/api/users'];

        protectedRoutes.forEach((route) => {
            it(`should block unauthorized access to ${route}`, async () => {
                const response = await request(app).get(route);
                expect(response.status).toBe(401);
            });

            it(`should block access with invalid token to ${route}`, async () => {
                const response = await request(app)
                    .get(route)
                    .set('Authorization', 'Bearer invalid-token');

                expect(response.status).toBe(401);
            });
        });

        it('should allow access with valid token', async () => {
            const response = await request(app)
                .get('/api/vehicles')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
        });
    });
});
