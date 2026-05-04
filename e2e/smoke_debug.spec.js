/**
 * Testes auxiliares de diagnóstico do setup E2E.
 * Não fazem parte do suite de regressão — servem para depurar o ambiente.
 */
import { test, expect } from "@playwright/test";

test("sanity: BroadcastChannel funciona entre páginas no mesmo contexto", async ({ browser }) => {
  const context = await browser.newContext();

  const page1 = await context.newPage();
  const page2 = await context.newPage();

  await page1.goto("http://localhost:5002/projection");
  await page2.goto("http://localhost:5002/");

  await page1.evaluate(() => {
    window._bcReceived = null;
    const ch = new BroadcastChannel("louvorja");
    ch.addEventListener("message", (e) => {
      window._bcReceived = e.data;
    });
  });

  await page1.waitForTimeout(200);

  await page2.evaluate(() => {
    const ch = new BroadcastChannel("louvorja");
    ch.postMessage({ type: "TEST_BC", payload: { value: 42 } });
  });

  await page1.waitForTimeout(500);

  const received = await page1.evaluate(() => window._bcReceived);
  expect(received).not.toBeNull();
  expect(received?.type).toBe("TEST_BC");

  await context.close();
});
