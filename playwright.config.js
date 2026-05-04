import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5002",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Em CI, --force garante re-otimização de deps após npm ci (que limpa node_modules/.vite/).
    // Localmente, evitar --force: limpar o cache a cada run gera 504 Outdated Optimize Dep
    // quando múltiplas páginas carregam simultaneamente durante a re-otimização.
    command: process.env.CI ? "node node_modules/.bin/vite --force" : "node node_modules/.bin/vite",
    url: "http://localhost:5002",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // URL fictícia interceptável pelo Playwright via page.route("http://e2e.mock/**")
      // Evita que os módulos mostrem alert de "Arquivo não encontrado" no boot
      VITE_URL_DATABASE: "http://e2e.mock",
      VITE_URL_FILES: "http://e2e.mock",
    },
  },
});
