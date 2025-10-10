import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.resolve('./logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

test.describe('Login Authentication Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page before each test
        await page.goto('/login');

        // Take screenshot of initial state
        await page.screenshot({ path: path.join(logsDir, 'login_initial.png') });

        // Verify login page has loaded properly
        await expect(page.locator('text=DobackSoft V2')).toBeVisible({ timeout: 10000 });
    });

    test('Login fails with incorrect credentials', async ({ page }) => {
        // Fill with incorrect credentials
        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        // Take screenshot of filled form
        await page.screenshot({ path: path.join(logsDir, 'login_incorrect_credentials.png') });

        // Submit the form
        await page.click('button[type="submit"]');

        // Expect error message to appear
        await expect(page.locator('div[role="alert"]')).toBeVisible({ timeout: 5000 });

        // Verify we're still on login page
        await expect(page).toHaveURL(/.*login/);

        // Take screenshot of error state
        await page.screenshot({ path: path.join(logsDir, 'login_error.png') });
    });

    test('Login succeeds with test credentials', async ({ page }) => {
        // Click the test credentials button
        await page.click('button:text("Usar credenciales de prueba")');

        // Verify fields are filled correctly
        const emailValue = await page.inputValue('input[type="email"]');
        const passwordValue = await page.inputValue('input[type="password"]');

        expect(emailValue).toBe('admin@DobackSoft.com');
        expect(passwordValue).toBe('password');

        // Take screenshot of filled form
        await page.screenshot({ path: path.join(logsDir, 'login_test_credentials.png') });

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for navigation to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Verify we're on the dashboard page
        await expect(page).toHaveURL(/.*dashboard/);

        // Take screenshot of dashboard
        await page.screenshot({ path: path.join(logsDir, 'dashboard_after_login.png') });
    });

    test('Login succeeds with manual entry of correct credentials', async ({ page }) => {
        // Manually enter the correct credentials
        await page.fill('input[type="email"]', 'admin@DobackSoft.com');
        await page.fill('input[type="password"]', 'password');

        // Take screenshot of filled form
        await page.screenshot({ path: path.join(logsDir, 'login_manual_credentials.png') });

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for navigation to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Verify we're on the dashboard page
        await expect(page).toHaveURL(/.*dashboard/);

        // Take screenshot of dashboard
        await page.screenshot({ path: path.join(logsDir, 'dashboard_manual_login.png') });
    });
}); 