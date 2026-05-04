---
id: 089
title: Setup Playwright + smoke E2E (abrir módulo → música → slide em /projection)
slug: setup-playwright
category: testes
wave: 4
model: opus
priority: P1
estimate_hours: 8
status: done
depends_on: [088]
blocks: []
audit_items: [89]
---

# [089] Setup Playwright + smoke E2E

## Contexto

O projeto não tem testes de integração ou E2E. O fluxo crítico — abrir módulo de músicas, selecionar uma música, verificar que o slide aparece na rota `/projection` — é testado apenas manualmente antes de cada release. Regressões nesse fluxo já passaram despercebidas.

Playwright é a escolha ideal: suporta múltiplas páginas/contextos simultaneamente (necessário para testar janela principal + `/projection` ao mesmo tempo), tem modo headless com Chromium embutido, e integra com Vitest via `@playwright/test`.

O smoke E2E cobre o caminho crítico de uso (abrir música → slide projetado), não edge cases — esses ficam para testes unitários (#088). O objetivo é detectar regressões de integração que testes unitários não capturam.

## Objetivo

- `npm run test:e2e` executa o smoke E2E e retorna exit 0.
- Smoke cobre: abrir módulo musics → buscar "aleluia" → clicar na música → slide aparece em `/projection`.
- Segundo smoke: abrir liturgy → adicionar item → verificar que aparece na lista.

## Escopo

### Dentro
- `playwright.config.js` apontando para `http://localhost:5002`.
- Smoke 1: musics → abrir música → slide em `/projection`.
- Smoke 2: liturgy → adicionar item → item na lista.
- `npm run test:e2e` — requer `npm run dev` rodando ou usa `webServer` do Playwright para subir automaticamente.

### Fora
- **NÃO** testar fluxos de edge case — apenas happy path.
- **NÃO** testar módulos Electron nativos (Electron tem limitações com Playwright — escopo separado).
- **NÃO** testar visual (isso é #090 com Percy/Chromatic).
- **NÃO** subir servidor de banco real — usar `VITE_URL_DATABASE` mockado ou arquivos locais em `./files/`.

## Arquivos afetados

- `playwright.config.js` (criar)
- `package.json` — adicionar script `test:e2e`
- `e2e/smoke.spec.js` (criar)
- `e2e/liturgy.spec.js` (criar)

## Pré-requisitos

- `#088` done — Vitest funcionando (ambiente de testes estabelecido).
- `npm run dev` deve estar funcional na porta 5002.
- Banco de dados acessível via `VITE_URL_DATABASE` para buscar músicas reais, OU arquivos locais em `./files/`.

## Plano de execução

1. Branch `chore/089-setup-playwright`.

2. Instalar Playwright:
   ```bash
   npm install -D @playwright/test
   npx playwright install chromium
   ```

3. Criar `playwright.config.js`:
   ```js
   import { defineConfig } from '@playwright/test';
   export default defineConfig({
     testDir: './e2e',
     use: {
       baseURL: 'http://localhost:5002',
       screenshot: 'only-on-failure',
       video: 'retain-on-failure',
     },
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:5002',
       reuseExistingServer: !process.env.CI,
       timeout: 30_000,
     },
   });
   ```

4. Criar `e2e/smoke.spec.js`:
   ```js
   import { test, expect } from '@playwright/test';
   
   test('abrir música → slide aparece em /projection', async ({ browser }) => {
     const mainCtx = await browser.newContext();
     const mainPage = await mainCtx.newPage();
     const projPage = await mainCtx.newPage();
     
     await projPage.goto('/projection');
     await mainPage.goto('/');
     
     // Abrir módulo musics
     await mainPage.click('[data-testid="module-musics"]');
     // Buscar música
     await mainPage.fill('[data-testid="search-input"]', 'aleluia');
     // Clicar no primeiro resultado
     await mainPage.click('[data-testid="music-row"]:first-child');
     
     // Verificar que slide aparece na projeção
     await expect(projPage.locator('[data-testid="slide-content"]')).toBeVisible({ timeout: 3000 });
   });
   ```

5. Adicionar `data-testid` nos elementos críticos:
   - `[data-testid="module-musics"]` — botão de abertura do módulo musics.
   - `[data-testid="search-input"]` — input de busca.
   - `[data-testid="music-row"]` — linha da DataTable.
   - `[data-testid="slide-content"]` — conteúdo do slide em /projection.

6. Criar `e2e/liturgy.spec.js`:
   ```js
   test('adicionar item à liturgia', async ({ page }) => {
     await page.goto('/');
     await page.click('[data-testid="module-liturgy"]');
     await page.click('[data-testid="liturgy-add-item"]');
     // Preencher form e salvar
     await page.fill('[data-testid="item-title"]', 'Teste item');
     await page.click('[data-testid="item-save"]');
     await expect(page.locator('[data-testid="liturgy-item"]')).toContainText('Teste item');
   });
   ```

7. Adicionar `data-testid` nos componentes de liturgy.

8. Adicionar script em `package.json`:
   ```json
   "test:e2e": "playwright test"
   ```

9. `npm run test:e2e` — verificar que passam.

10. Commit: `[089] Setup Playwright + E2E smoke tests`.

## Validação

- [x] `npm run test:e2e` passa com 0 falhas.
- [x] Screenshot de falha é gerada automaticamente em caso de erro.
- [x] `npm run build` ainda passa.
- [x] Smoke de abertura de música funciona.
- [x] Smoke de liturgy funciona.

## Riscos / atenções

- **BroadcastChannel e múltiplas páginas**: Playwright pode abrir contextos separados que não compartilham BroadcastChannel. Usar `browser.newContext()` para ambas as páginas (mesmo contexto de browser) resolve isso.
- **Banco de dados real**: o smoke de músicas precisa de uma música "aleluia" — verificar se existe no banco de teste ou mockar. Alternativa: usar `./files/` local com subset do banco.
- **`data-testid`**: adicionar atributos sem alterar visual — usar `v-bind="{ 'data-testid': 'nome' }"` ou apenas `data-testid="nome"` diretamente no template.
- **CI**: o Playwright tem `--reporter=html` que gera um relatório navegável. Configurar para salvar como artifact no CI (#093).
- **Timeouts**: BroadcastChannel pode ter latência de 100-500ms — usar `timeout: 3000` no `expect`.

## Referências

- Item audit: #89.
- [Playwright docs](https://playwright.dev/).
- [playwright.config.js API](https://playwright.dev/docs/api/class-testconfig).
- [src/views/Projection.vue](../../src/views/Projection.vue) — destino do smoke.

---

## Notas pós-execução

**Bugs corrigidos durante a implementação:**

1. **`$media` não estava em `globalProperties`** (`src/main.js`): o refactor #016 migrou `helpers/Media.js` → `composables/useMedia.js` e adicionou-o ao `globalProperties` como `$media: Media`. Sem isso, `this.$media.open()` em `MusicMenuTable.vue` falhava silenciosamente.

2. **`useMedia.open()` sem broadcast inicial em modo no-audio** (`src/composables/useMedia.js`): no caminho sem áudio, `_slides.setSlides()` era chamado mas nunca havia `broadcastSlide()`. A projeção só recebia slide quando o usuário navegava manualmente. Adicionado `_slides.broadcastSlide()` ao final do `else` branch.

3. **`DataCloneError` em `broadcastSlide()`** (`src/composables/useSlides.js`): `slide.value` e `nextSlide.value` são Vue Proxy (computed de `ref([])`). O BroadcastChannel usa structured clone algorithm que não serializa Proxy. Fix: `toRaw()` antes de enviar.

4. **Vitest coletava arquivos `e2e/`** (`vitest.config.js`): adicionado `exclude: ["**/node_modules/**", "**/e2e/**"]` para separar os dois suites.

**Artefatos criados:**
- `playwright.config.js` — config com webServer Vite, VITE_URL_DATABASE=http://e2e.mock
- `e2e/smoke.spec.js` — música → slide em /projection (BroadcastChannel + mock de banco)
- `e2e/liturgy.spec.js` — abrir liturgia → adicionar item → verificar na lista
- `e2e/smoke_debug.spec.js` — sanity check do BroadcastChannel
- `e2e/fixtures/pt_musics.json` + `music_1.json` — dados determinísticos
