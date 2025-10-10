import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 60000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: false,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: 100,
    },
  },
  expect: {
    timeout: 10000,
  },
  // La configuración de webServer es opcional y solo para validación,
  // ya que estamos utilizando servidores existentes
};

export default config; 