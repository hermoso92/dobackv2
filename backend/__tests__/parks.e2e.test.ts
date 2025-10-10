import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app'; // tu instancia de Express

const JWT_ADMIN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVkNmEwZTU5LTU1MTMtNGUzZC1hNTRiLTAyZGNkMDE4NzE0NSIsImVtYWlsIjoiYWRtaW5AZGVtby5jb20iLCJyb2xlIjoiQURNSU4iLCJvcmdhbml6YXRpb25JZCI6ImY5NGY0NTExLWM4NzYtNDE5MS04ZGNlLWVkY2EyYTg0NzIxYyIsImlhdCI6MTc1MzE5NTE1MCwiZXhwIjoxNzUzNzk5OTUwfQ.fRBJiWIyrAOgJNadWym-1XgNayPvvwN2mGxcmvEbF-M';
const JWT_USER = 'REEMPLAZA_POR_JWT_USER';

const testPark = {
    name: 'Parque QA',
    identifier: 'QA01',
    geometry: { type: 'Point', coordinates: [-3.7, 40.4], radius: 100 }
};

describe('Parks API', () => {
    let createdId: string;

    it('debe rechazar sin JWT', async () => {
        const res = await request(app).get('/api/parks');
        expect(res.status).toBe(401);
    });

    it('debe listar parques para admin', async () => {
        const res = await request(app)
            .get('/api/parks')
            .set('Authorization', `Bearer ${JWT_ADMIN}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('no debe permitir crear parque a USER', async () => {
        const res = await request(app)
            .post('/api/parks')
            .set('Authorization', `Bearer ${JWT_USER}`)
            .send(testPark);
        expect(res.status).toBe(403);
    });

    it('debe permitir crear parque a ADMIN', async () => {
        const res = await request(app)
            .post('/api/parks')
            .set('Authorization', `Bearer ${JWT_ADMIN}`)
            .send(testPark);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        createdId = res.body.id;
    });

    it('debe obtener el parque creado', async () => {
        const res = await request(app)
            .get(`/api/parks/${createdId}`)
            .set('Authorization', `Bearer ${JWT_ADMIN}`);
        expect(res.status).toBe(200);
        expect(res.body.identifier).toBe(testPark.identifier);
    });

    it('debe permitir editar parque a ADMIN', async () => {
        const res = await request(app)
            .put(`/api/parks/${createdId}`)
            .set('Authorization', `Bearer ${JWT_ADMIN}`)
            .send({ name: 'Parque QA Editado' });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Parque QA Editado');
    });

    it('debe permitir borrar parque a ADMIN', async () => {
        const res = await request(app)
            .delete(`/api/parks/${createdId}`)
            .set('Authorization', `Bearer ${JWT_ADMIN}`);
        expect(res.status).toBe(204);
    });

    it('debe devolver 404 al buscar parque borrado', async () => {
        const res = await request(app)
            .get(`/api/parks/${createdId}`)
            .set('Authorization', `Bearer ${JWT_ADMIN}`);
        expect(res.status).toBe(404);
    });
}); 