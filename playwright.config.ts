import { defineConfig } from "@playwright/test";
// A dedicated server avoids reusing an authenticated development session.
const testPort = 5185;
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.pw.ts",
  timeout: 60000,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${testPort}`,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    actionTimeout: 10000,
  },
  webServer: {
    command:
      `npm run dev -- --host 127.0.0.1 --port ${testPort} --strictPort`,
    url: `http://127.0.0.1:${testPort}`,
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '',
      SUPABASE_URL: '', SUPABASE_ANON_KEY: '', SUPABASE_SERVER_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '', PIXABAY_API_KEY: '', GEMINI_API_KEY: '',
    },
  },
});
