import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/extension', timeout: 45000, workers: 1, retries: 0, reporter: [['list']], use: { reducedMotion: 'reduce' } });
