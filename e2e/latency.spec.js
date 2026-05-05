/**
 * Latência cross-window slide_change: GO_TO_SLIDE → useSlides → Projection
 *
 * Fluxo medido:
 *   projPage → GO_TO_SLIDE → mainPage/useSlides → SLIDE_CHANGE (com _ts)
 *     → projPage/useProjectionState → Date.now() - _ts = latência
 *
 * Por que não precisa de UI:
 *   useMedia.ts importa useSlides() a nível de módulo.
 *   main.js importa useMedia, então o listener de GO_TO_SLIDE é registrado
 *   assim que o app carrega — sem precisar montar Player ou carregar música.
 *
 * Meta: p95 < 50ms (spec D7 do roadmap desktop).
 */
import { test, expect } from "@playwright/test";

const N_ITERATIONS = 100;

test("latência slide_change cross-window p95 <50ms", async ({ browser }) => {
  test.setTimeout(60_000);

  const context = await browser.newContext();

  // Inicializa o array de latência antes de qualquer script da página
  await context.addInitScript(() => {
    window.__ljLatencyLog = [];
  });

  // Abre projeção primeiro: listener SLIDE_CHANGE ativo antes dos eventos
  const projPage = await context.newPage();
  await projPage.goto("/projection");

  // Abre janela principal para inicializar useSlides (via useMedia no main.js)
  const mainPage = await context.newPage();
  await mainPage.goto("/");

  // Aguarda a app montar (v-app indica que Vue + Pinia estão prontos)
  await mainPage.locator("#app-container").waitFor({ state: "attached", timeout: 30_000 });
  // Um rAF extra garante que o listener GO_TO_SLIDE do useSlides esteja registrado
  await mainPage.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

  // Aguarda projPage estar montada e com o listener SLIDE_CHANGE pronto
  await projPage.locator("body").waitFor({ state: "attached", timeout: 10_000 });
  await projPage.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

  // Garante que o log começa vazio
  await projPage.evaluate(() => {
    window.__ljLatencyLog = [];
  });

  // Executa N_ITERATIONS navegações:
  //   projPage envia GO_TO_SLIDE → mainPage/useSlides processa → emite SLIDE_CHANGE com _ts
  //   projPage/useProjectionState recebe → registra latência em window.__ljLatencyLog
  for (let i = 0; i < N_ITERATIONS; i++) {
    // Alterna entre slide 0 e 1 para evitar otimização de "mesma posição"
    const idx = i % 2;

    // Enviado de projPage (janela diferente da mainPage) → mainPage recebe
    await projPage.evaluate((index) => {
      const bc = new BroadcastChannel("louvorja");
      bc.postMessage({ type: "go_to_slide", payload: { index } });
      bc.close();
    }, idx);

    // Aguarda a medição desta iteração
    await projPage.waitForFunction(
      (count) => (window.__ljLatencyLog || []).length >= count,
      i + 1,
      { timeout: 2_000, polling: 16 }
    );
  }

  // Coleta medições
  const measurements = await projPage.evaluate(() => window.__ljLatencyLog || []);

  if (measurements.length === 0) {
    throw new Error(
      "Nenhuma medição capturada. Verifique:\n" +
        "  1. broadcastSlide() em useSlides.ts emite _ts: Date.now()\n" +
        "  2. useProjectionState.ts registra em window.__ljLatencyLog\n" +
        "  3. import.meta.env.DEV é true no Vite dev server"
    );
  }

  // Calcula percentis
  const sorted = [...measurements].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[sorted.length - 1]; // pior caso no conjunto

  console.log(
    `\nLatência slide_change cross-window (N=${measurements.length}):\n` +
      `  p50 = ${p50}ms\n` +
      `  p95 = ${p95}ms\n` +
      `  p99/max = ${p99}ms`
  );

  expect(p95, "p95 latência deve ser <50ms").toBeLessThan(50);

  await context.close();
});
