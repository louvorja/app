---
id: 090
title: Regressão visual (Percy/Chromatic) para Ribbon e Player
slug: regressao-visual-percy
category: testes
wave: 4
model: opus
priority: P2
estimate_hours: 6
status: todo
depends_on: [089]
blocks: []
audit_items: [90]
---

# [090] Regressão visual com Percy ou Chromatic

## Contexto

O projeto tem dois componentes de UI críticos onde regressões visuais são comuns e difíceis de detectar em code review: o **RibbonBar** (barra de apps horizontal com botões de módulo) e o **Player** (controles de reprodução de slides + áudio). Mudanças em tokens CSS, Vuetify ou `<style scoped>` podem quebrar o layout visual sem quebrar nenhum teste funcional.

Testes de regressão visual tiram screenshots de referência e comparam pixel a pixel a cada PR. Diferenças acima de um threshold são sinalizadas para revisão humana. Isso não substitui code review — complementa, capturando regressões que o olho humano em diff de código não detecta.

**Percy** (BrowserStack) e **Chromatic** (Storybook) são as duas opções principais:
- **Percy**: integra diretamente com Playwright (via `@percy/playwright`) sem precisar de Storybook. Mais simples para este projeto que não tem Storybook.
- **Chromatic**: exige Storybook, mas tem visual diffs mais sofisticados e UI de aprovação melhor.

**Recomendação**: Percy, pois integra com o Playwright já sendo configurado em #089.

## Objetivo

- Screenshots de referência do Ribbon e Player capturadas e salvas em Percy.
- `npm run test:visual` executa capturas e faz diff vs baseline.
- Mudanças que alteram o visual de Ribbon ou Player são sinalizadas no PR.

## Escopo

### Dentro
- Conta Percy (free tier: 5.000 snapshots/mês).
- `@percy/playwright` integrado com `playwright.config.js`.
- Snapshots de: RibbonBar (dark + light), Player (aberto + minimizado), estado vazio.
- `PERCY_TOKEN` como env var para CI.

### Fora
- **NÃO** capturar snapshots de todos os módulos — apenas Ribbon + Player.
- **NÃO** usar Storybook (não existe no projeto).
- **NÃO** bloquear PR em CI automaticamente nesta task — apenas notificar (aprovação manual).

## Arquivos afetados

- `package.json` — adicionar script `test:visual`
- `e2e/visual.spec.js` (criar)
- `playwright.config.js` — adicionar projeto Percy
- `.env.example` — adicionar `PERCY_TOKEN=`

## Pré-requisitos

- `#089` done — Playwright configurado.
- Conta Percy criada (https://percy.io/) com projeto "louvorja".
- `PERCY_TOKEN` disponível como env var.

## Plano de execução

1. Branch `chore/090-visual-regression`.

2. Criar conta Percy em https://percy.io/ e criar projeto "louvorja".

3. Instalar Percy:
   ```bash
   npm install -D @percy/playwright @percy/cli
   ```

4. Criar `e2e/visual.spec.js`:
   ```js
   import { test } from '@playwright/test';
   import percySnapshot from '@percy/playwright';
   
   test('Ribbon - tema escuro', async ({ page }) => {
     await page.goto('/');
     await page.waitForLoadState('networkidle');
     await percySnapshot(page, 'Ribbon dark');
   });
   
   test('Ribbon - tema claro', async ({ page }) => {
     await page.goto('/');
     // Trocar para tema claro via UserData
     await page.evaluate(() => {
       window.__vue_app__.config.globalProperties.$userdata?.set('theme', 'light');
     });
     await page.waitForTimeout(500);
     await percySnapshot(page, 'Ribbon light');
   });
   
   test('Player - aberto com música', async ({ page }) => {
     await page.goto('/');
     // Abrir Player com música mockada se disponível
     await percySnapshot(page, 'Player opened');
   });
   ```

5. Adicionar script:
   ```json
   "test:visual": "percy exec -- playwright test e2e/visual.spec.js"
   ```

6. Adicionar `PERCY_TOKEN=` ao `.env.example`.

7. Verificar: `PERCY_TOKEN=<token> npm run test:visual` — snapshots aparecem no Percy.

8. Aprovar snapshots como baseline no Percy UI.

9. Commit: `[090] Add Percy visual regression tests for Ribbon and Player`.

## Validação

- [ ] `npm run test:visual` (com `PERCY_TOKEN` válido) envia snapshots ao Percy.
- [ ] Snapshots aparecem no dashboard Percy com status "approved".
- [ ] Segundo run sem mudanças → "no changes" no Percy.
- [ ] `.env.example` tem `PERCY_TOKEN=` documentado.
- [ ] `npm run build` passa.

## Riscos / atenções

- **Custo Percy**: free tier tem 5.000 snapshots/mês. Com 3 snapshots por run e CI rodando a cada push, o limite é ~1.600 runs/mês — suficiente para o projeto.
- **Snapshots flaky por animações**: desabilitar CSS animations no Playwright antes de capturar:
  ```js
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
  ```
- **Tema escuro/claro**: garantir que o estado de tema está estável antes do snapshot (aguardar `networkidle` ou `DOMContentLoaded`).
- **`window.__vue_app__`**: antipadrão — se globalProperties já foi removida em #012, usar `data-testid` ou localStorage para trocar tema nos testes.
- **Alternativa offline**: se Percy não for viável (custo, privacidade), usar `pixelmatch` com screenshots locais — mais complexo mas sem dependência externa.

## Referências

- Item audit: #90.
- [Percy docs](https://docs.percy.io/docs/playwright).
- [@percy/playwright](https://github.com/percy/percy-playwright).
- [e2e/ (após #089)](../../e2e/).

---

## Notas pós-execução

**Implementação concluída em 2026-05-05.**

Arquivos criados/alterados:
- `e2e/visual.spec.js` — 3 snapshots: RibbonBar dark, RibbonBar light, Player idle dark
- `package.json` — script `test:visual` + `@percy/playwright@^1.1.0` + `@percy/cli@^1.31.13`
- `.env.example` — `PERCY_TOKEN=` documentado

**Tema switching**: feito via `page.addInitScript()` que injeta `localStorage.setItem("user_data", JSON.stringify({theme: t}))` antes do boot do app — evita antipadrão de `window.__vue_app__` (globalProperties removidas em #012).

**Animações**: desabilitadas antes de cada snapshot via `page.addStyleTag()` com `transition: none !important; animation: none !important`.

**Validação pendente (requer ação do usuário)**:
1. Criar conta em https://percy.io/ e criar projeto "louvorja"
2. Definir `PERCY_TOKEN=<token>` no ambiente
3. Executar `npm run test:visual` para criar o baseline inicial
4. Aprovar snapshots no dashboard Percy como baseline
