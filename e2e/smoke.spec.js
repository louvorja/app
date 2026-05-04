/**
 * Smoke E2E: abrir música → slide aparece em /projection
 *
 * Usa dois contextos na mesma BrowserContext para que o BroadcastChannel("louvorja")
 * funcione entre a janela principal e /projection.
 * O banco de dados é interceptado via context.route() para dados determinísticos.
 */
import { test, expect } from "@playwright/test";
import ptMusics from "./fixtures/pt_musics.json";
import music1 from "./fixtures/music_1.json";

test("abrir música sem áudio → slide aparece em /projection", async ({ browser }) => {
  const context = await browser.newContext();

  // Catch-all: qualquer requisição ao banco mock retorna array vazio (evita alertas de erro)
  await context.route("http://e2e.mock/**", (route) => route.fulfill({ json: [] }));

  // Overrides específicos com dados determinísticos (registrados depois → avaliados antes, LIFO)
  await context.route("**/pt_musics*", (route) => route.fulfill({ json: ptMusics }));
  await context.route("**/music_1*", (route) => route.fulfill({ json: music1 }));

  // Abre projeção primeiro para garantir BroadcastChannel ativo antes do evento
  const projPage = await context.newPage();
  await projPage.goto("/projection");

  // Abre página principal
  const mainPage = await context.newPage();
  await mainPage.goto("/");

  // Aguardar o ribbon aparecer (indica que o Vue montou e a inicialização concluiu)
  await mainPage.locator("#ribbon-tab-collections").waitFor({ state: "visible", timeout: 20000 });

  // Aguardar ModuleManager registrar todos os módulos (import_modules = true)
  await mainPage
    .locator('[data-testid="modules-ready"]')
    .waitFor({ state: "attached", timeout: 15000 });

  // Aguardar rede ficar idle: async components (Index.vue) são carregados do Vite
  // na primeira renderização de Modules.vue — networkidle sinaliza que todos terminaram
  await mainPage.waitForLoadState("networkidle", { timeout: 30000 });

  // Clicar na aba Coletâneas (ID gerado pelo RibbonBar)
  await mainPage.locator("#ribbon-tab-collections").click();

  // Clicar no botão Músicas JA no ribbon
  await mainPage.locator('[data-testid="ribbon-btn-musics"]').click();

  // Aguardar a linha da música aparecer (DataTable carregou o mock)
  await expect(mainPage.locator('[data-testid="music-row-1"]')).toBeVisible({ timeout: 10000 });

  // Abrir a música sem áudio
  await mainPage.locator('[data-testid="music-row-1"] [data-testid="mmt-btn-no-audio"]').click();

  // Verificar que o slide (capa) aparece na projeção com o nome da música
  const slideContent = projPage.locator('[data-testid="slide-content"]');
  await expect(slideContent).toBeVisible({ timeout: 5000 });
  await expect(slideContent).toContainText("Aleluia");

  await context.close();
});
