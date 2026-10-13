import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.pw.ts",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:5174",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    actionTimeout: 10000,
  },
  webServer: {
    command:
      "VITE_SUPABASE_URL='' VITE_SUPABASE_ANON_KEY='' npm run dev -- --host 127.0.0.1 --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !process.env.CI,
  },
});
