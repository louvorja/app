/**
 * Smoke E2E: abrir liturgia → adicionar item → item aparece na lista
 */
import { test, expect } from "@playwright/test";

test("adicionar item à liturgia", async ({ page }) => {
  // Intercepta todas as requisições ao banco de dados mock para evitar alertas de erro
  await page.route("http://e2e.mock/**", (route) => route.fulfill({ json: [] }));

  await page.goto("/");

  // Aguardar ribbon aparecer (indica que o Vue montou e a inicialização concluiu)
  await page.locator("#ribbon-tab-collections").waitFor({ state: "visible", timeout: 20000 });

  // Aguardar ModuleManager registrar todos os módulos (import_modules = true)
  await page
    .locator('[data-testid="modules-ready"]')
    .waitFor({ state: "attached", timeout: 15000 });

  // Aguardar rede ficar idle: async components (Index.vue) são carregados do Vite
  // na primeira renderização de Modules.vue — networkidle sinaliza que todos terminaram
  await page.waitForLoadState("networkidle", { timeout: 30000 });

  // Abrir módulo liturgia via ribbon
  await page.locator("#ribbon-tab-collections").click();
  await page.locator('[data-testid="ribbon-btn-liturgy"]').click();

  // Aguardar o módulo liturgia renderizar
  await expect(page.locator(".liturgy-page")).toBeVisible({ timeout: 10000 });

  // Clicar no botão "Adicionar"
  await page.locator('[data-testid="liturgy-add-item"]').last().click();
  await expect(page.locator(".lit-dialog")).toBeVisible({ timeout: 3000 });
  await page.locator('[data-testid="item-name"]').fill("Item de Teste E2E");
  await page.locator('[data-testid="item-save"]').click();
  await expect(page.locator(".liturgy-body")).toContainText("Item de Teste E2E", { timeout: 3000 });
});
