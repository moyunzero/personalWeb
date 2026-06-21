import { defineConfig } from '@playwright/test';

const baseURL = 'http://localhost:4321/personalWeb/';

export default defineConfig({
    testDir: 'tests/e2e',
    timeout: 30_000,
    retries: 0,
    use: {
        baseURL,
        headless: true,
        channel: 'chrome',
    },
    webServer: {
        command: 'yarn preview',
        url: `${baseURL}/`,
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
