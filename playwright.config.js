import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './ui-tests',
  timeout: 300000,
  retries: 1,
  use: {
    baseURL: 'https://rhombusai.com',
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
