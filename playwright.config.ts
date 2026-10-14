import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    ...devices['Desktop Chrome'],
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader'],
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
});
