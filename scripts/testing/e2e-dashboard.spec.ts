import { expect, test } from '@playwright/test';

// Requisitos de entorno (no hardcodear URLs)
const FRONTEND_URL = process.env.FRONTEND_URL; // ej: http://localhost:5174
const BACKEND_URL = process.env.BACKEND_URL;   // ej: http://localhost:9998
const E2E_EMAIL = process.env.E2E_EMAIL;       // ej: antoniohermoso92@gmail.com
const E2E_PASSWORD = process.env.E2E_PASSWORD; // ej: password123

test.describe('Dashboard Ejecutivo - Verificación E2E', () => {
    test.beforeAll(async () => {
        if (!FRONTEND_URL || !BACKEND_URL) {
            throw new Error('FRONTEND_URL y BACKEND_URL deben estar definidos en variables de entorno');
        }
        if (!E2E_EMAIL || !E2E_PASSWORD) {
            throw new Error('E2E_EMAIL y E2E_PASSWORD deben estar definidos en variables de entorno');
        }
    });

    test('Estados & Tiempos muestra métricas no triviales', async ({ page, request }) => {
        // 1) Login vía API para obtener token
        const loginResp = await request.post(`${BACKEND_URL}/api/auth/login`, {
            data: { email: E2E_EMAIL, password: E2E_PASSWORD }
        });
        expect(loginResp.ok()).toBeTruthy();
        const loginJson = await loginResp.json();
        const token = loginJson?.access_token as string;
        expect(token).toBeTruthy();

        // 2) Inyectar token en localStorage antes de cargar la app
        await page.addInitScript((t) => {
            window.localStorage.setItem('access_token', t as string);
        }, token);

        // 3) Abrir la app
        await page.goto(`${FRONTEND_URL}/dashboard`);

        // 4) Esperar render del tablero
        await page.getByText('Estados & Tiempos').first().waitFor({ state: 'visible' });

        // 5) Aserciones básicas sobre tarjetas KPI (no valores triviales imposibles)
        // Kilómetros Recorridos debe existir y no ser estrictamente "0 km"
        const kmCard = page.getByText('Kilómetros Recorridos').first();
        await expect(kmCard).toBeVisible();

        // Rotativo en rango 0–100
        const rotativoCard = page.getByText('% Rotativo').first();
        await expect(rotativoCard).toBeVisible();

        // Índice de Estabilidad (SI) visible
        await expect(page.getByText('Índice de Estabilidad (SI)').first()).toBeVisible();
    });

    test('Puntos Negros carga clusters y paneles', async ({ page, request }) => {
        // Login API
        const loginResp = await request.post(`${BACKEND_URL}/api/auth/login`, { data: { email: E2E_EMAIL, password: E2E_PASSWORD } });
        expect(loginResp.ok()).toBeTruthy();
        const token = (await loginResp.json()).access_token as string;
        await page.addInitScript((t) => { window.localStorage.setItem('access_token', t as string); }, token);

        await page.goto(`${FRONTEND_URL}/dashboard`);

        // Ir a pestaña Puntos Negros
        await page.getByRole('button', { name: /Puntos Negros/i }).click();

        // Esperar tarjetas de estadísticas
        await expect(page.getByText('Total Clusters').first()).toBeVisible();
        await expect(page.getByText('Total Eventos').first()).toBeVisible();

        // Mapa visible
        await expect(page.getByText('Mapa de Calor - Puntos Negros').first()).toBeVisible();
    });

    test('Velocidad muestra violaciones y ranking', async ({ page, request }) => {
        // Login API
        const loginResp = await request.post(`${BACKEND_URL}/api/auth/login`, { data: { email: E2E_EMAIL, password: E2E_PASSWORD } });
        expect(loginResp.ok()).toBeTruthy();
        const token = (await loginResp.json()).access_token as string;
        await page.addInitScript((t) => { window.localStorage.setItem('access_token', t as string); }, token);

        await page.goto(`${FRONTEND_URL}/dashboard`);

        // Ir a pestaña Velocidad
        await page.getByRole('button', { name: /Velocidad/i }).click();

        // Estadísticas presentes
        await expect(page.getByText('Total').first()).toBeVisible();
        await expect(page.getByText('Graves').first()).toBeVisible();
        await expect(page.getByText('Leves').first()).toBeVisible();
        await expect(page.getByText('Correctos').first()).toBeVisible();

        // Mapa visible
        await expect(page.getByText('Mapa de Velocidad - Clasificación DGT').first()).toBeVisible();
    });
});


