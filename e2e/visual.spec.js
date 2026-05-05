/**
 * Testes de regressão visual com Percy.
 *
 * Captura snapshots do RibbonBar e Player nos temas escuro e claro.
 * Percy compara pixel a pixel com o baseline aprovado e sinaliza diferenças.
 *
 * Pré-requisito: PERCY_TOKEN deve estar definido (ver .env.example).
 * Executar via: npm run test:visual
 */
import { test } from "@playwright/test";
import percySnapshot from "@percy/playwright";

/** Configura página com tema e mocks antes de navegar. */
async function setupPage(page, theme = "dark") {
  // Injeta localStorage antes do boot do app para forçar o tema
  await page.addInitScript((t) => {
    localStorage.setItem("user_data", JSON.stringify({ theme: t }));
  }, theme);

  // Mock do banco: retorna arrays vazios para evitar alertas de "arquivo não encontrado"
  await page.route("http://e2e.mock/**", (route) => route.fulfill({ json: [] }));

  await page.goto("/");

  // Aguarda o ribbon aparecer (Vue montado + módulos registrados)
  await page.locator("#ribbon-tab-collections").waitFor({ state: "visible", timeout: 20000 });
  await page
    .locator('[data-testid="modules-ready"]')
    .waitFor({ state: "attached", timeout: 15000 });
  await page.waitForLoadState("networkidle", { timeout: 30000 });

  // Desabilita transições e animações para snapshots estáveis (evita diff por frames)
  await page.addStyleTag({
    content: "*, *::before, *::after { transition: none !important; animation: none !important; }",
  });
}

test("RibbonBar — tema escuro", async ({ page }) => {
  await setupPage(page, "dark");
  await percySnapshot(page, "RibbonBar dark");
});

test("RibbonBar — tema claro", async ({ page }) => {
  await setupPage(page, "light");
  await percySnapshot(page, "RibbonBar light");
});

test("Player — idle (sem música, tema escuro)", async ({ page }) => {
  await setupPage(page, "dark");
  await percySnapshot(page, "Player idle dark");
});
