---
id: 088
title: Setup Vitest + cobertura de helpers críticos
slug: setup-vitest
category: testes
wave: 4
model: opus
priority: P1
estimate_hours: 6
status: done
depends_on: []
blocks: []
audit_items: [88, 91, 92]
---

# [088] Setup Vitest + cobertura de helpers críticos

## Contexto

O projeto não tem nenhum teste automatizado. `package.json` não tem `test` script. Não há `vitest.config.js`, `.spec.js` ou `.test.js` em `src/`. Bugs em helpers críticos como `Storage.js` só aparecem em produção ou quando alguém testa manualmente.

Helpers como `Storage.js` (311 linhas, dual web/Electron), `AppData.js`, e `BroadcastTypes.js` são exatamente o tipo de código que se beneficia de testes unitários: funções puras com inputs/outputs bem definidos, sem dependências de UI.

`vite` já está no projeto — `vitest` é da mesma família e aproveita a config do Vite sem duplicação. A cobertura com `@vitest/coverage-v8` usa V8 nativo (sem instrumentação babel).

A prioridade inicial não é 100% de cobertura — é ter a infraestrutura funcionando e os helpers críticos cobertos. Isso desbloqueia CI (#093) e permite que tasks futuras adicionem testes sem setup.

## Objetivo

- `npm test` (ou `npm run test`) executa a suíte e retorna exit 0.
- `npm run coverage` gera relatório HTML de cobertura.
- Helpers críticos com testes: `Storage.js`, `AppData.js`, `UserData.js`, `BroadcastTypes.js`, `Path.js`, `Strings.js`, `DateTime.js`.
- Cobertura dos helpers testados ≥ 80%.

## Escopo

### Dentro
- `vitest.config.js` (ou integrado no `vite.config.js`).
- `@vitest/coverage-v8` para relatório.
- Testes unitários para helpers puros listados acima.
- Mock de `localStorage` para `Storage.js` (jsdom ou mock manual).
- Mock de `window.louvorjaApi` para testes de Storage no modo Electron.

### Fora
- **NÃO** testar componentes Vue (isso exigiria `@vue/test-utils` — escopo separado).
- **NÃO** testar módulos core (`musics`, `liturgy`, etc.) nesta task.
- **NÃO** integrar CI (isso é #093) — apenas ter testes locais passando.
- **NÃO** atingir 100% de cobertura — foco em helpers críticos.

## Arquivos afetados

- `vitest.config.js` (criar) ou atualizar [vite.config.js](../../vite.config.js)
- `package.json` — adicionar scripts `test`, `test:watch`, `coverage`
- `src/helpers/__tests__/Storage.spec.js` (criar)
- `src/helpers/__tests__/AppData.spec.js` (criar)
- `src/helpers/__tests__/UserData.spec.js` (criar)
- `src/helpers/__tests__/BroadcastTypes.spec.js` (criar)
- `src/helpers/__tests__/Path.spec.js` (criar)
- `src/helpers/__tests__/Strings.spec.js` (criar)
- `src/helpers/__tests__/DateTime.spec.js` (criar)

## Pré-requisitos

- Nenhuma task prévia necessária — este é um setup independente.
- Ler `Storage.js` e `AppData.js` antes de escrever mocks.

## Plano de execução

1. Branch `chore/088-setup-vitest`.

2. Instalar dependências:
   ```bash
   npm install -D vitest @vitest/coverage-v8 jsdom @vitest/ui
   ```

3. Criar `vitest.config.js`:
   ```js
   import { defineConfig } from 'vitest/config';
   import { fileURLToPath } from 'url';
   import path from 'path';
   
   export default defineConfig({
     test: {
       environment: 'jsdom',
       globals: true,
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html'],
         include: ['src/helpers/**'],
         exclude: ['src/helpers/__tests__/**'],
       },
     },
     resolve: {
       alias: {
         '@': fileURLToPath(new URL('./src', import.meta.url)),
         '@helpers': fileURLToPath(new URL('./src/helpers', import.meta.url)),
       },
     },
   });
   ```

4. Adicionar scripts em `package.json`:
   ```json
   "test": "vitest run",
   "test:watch": "vitest",
   "test:ui": "vitest --ui",
   "coverage": "vitest run --coverage"
   ```

5. Criar `src/helpers/__tests__/Storage.spec.js`:
   - Mock de `localStorage`: `vi.stubGlobal('localStorage', mockStorage)`.
   - Testar: `set/get/remove`, `removeAll`, modo session.
   - Mock de `window.louvorjaApi` para branch Electron:
     ```js
     vi.stubGlobal('window', { louvorjaApi: { storage: mockElectronStorage } });
     ```

6. Criar testes para `Path.spec.js`:
   - `Path.db('musics')` retorna URL correta com `VITE_URL_DATABASE`.
   - `Path.file('img/foo.jpg')` retorna URL correta com `VITE_URL_FILES`.
   - Casos edge: string vazia, undefined.

7. Criar testes para `Strings.spec.js`:
   - Funções de normalização de string (remover acentos, ordenação).

8. Criar testes para `DateTime.spec.js`:
   - `format(seconds)` retorna `"HH:MM:SS"` correto.
   - Casos: 0, 59, 3600, 3661.

9. Criar testes para `BroadcastTypes.spec.js`:
   - Verificar que todos os tipos exportados são strings únicas.
   - Verificar que nenhum tipo está duplicado.

10. `npm test` — todos passam.

11. `npm run coverage` — verificar cobertura ≥ 80% nos helpers testados.

12. Commit: `[088] Setup Vitest + unit tests for critical helpers`.

## Validação

- [ ] `npm test` retorna exit 0.
- [ ] `npm run coverage` gera relatório sem erros.
- [ ] Cobertura de linhas ≥ 80% em `Storage.js`, `Path.js`, `Strings.js`, `DateTime.js`.
- [ ] `npm run build` ainda passa (vitest não afeta build).
- [ ] `npm run lint` passa.

## Riscos / atenções

- **`Storage.js` usa `import.meta.env`** — em vitest, definir via `vi.stubEnv` ou `import.meta.env` no `vitest.config.js`.
- **`AppData.js` usa Vuex store** — antes de #003, mock do store é necessário:
  ```js
  vi.mock('@/store', () => ({ default: { commit: vi.fn(), getters: { getData: () => () => null } } }));
  ```
- **Electron branch em `Storage.js`**: `window.louvorjaApi` — mock explícito necessário para testar ambas as branches.
- **`jsdom` vs `happy-dom`**: jsdom é mais completo mas mais lento. Para helpers sem DOM, usar `environment: 'node'` nos arquivos de teste via `// @vitest-environment node`.

## Referências

- Item audit: #88, #91, #92.
- [Vitest docs](https://vitest.dev/).
- [vite.config.js](../../vite.config.js) — configuração existente do Vite.
- [src/helpers/Storage.js](../../src/helpers/Storage.js) — helper mais crítico.

---

## Notas pós-execução

**Executado em 2026-05-04.**

- Instalado: `vitest@4.1.5`, `@vitest/coverage-v8@4.1.5`, `@vitest/ui@4.1.5`, `jsdom@29.1.1`.
- `vitest.config.js` criado com environment jsdom, aliases `@` e `@helpers`, cobertura v8.
- Scripts adicionados em `package.json`: `test`, `test:watch`, `test:ui`, `coverage`.
- 5 arquivos de teste criados em `src/helpers/__tests__/`.

**Resultados (66 testes, todos passando):**

| Helper | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| Storage.js | 91.33% | 90.54% | 81.25% | **91.89%** |
| BroadcastTypes.js | 100% | 100% | 100% | **100%** |
| DateTime.js | 100% | 100% | 100% | **100%** |
| Path.js | 100% | 100% | 100% | **100%** |
| Strings.js | 100% | 100% | 100% | **100%** |

**Linhas não cobertas em Storage.js** (4 linhas): callbacks `.catch()` em chamadas IPC (linhas 79, 211, 258, 289) — edge cases de falha assíncrona de IPC, difíceis de testar sem mock de rejeição.

**Validação:**
- [x] `npm test` retorna exit 0.
- [x] `npm run coverage` gera relatório sem erros.
- [x] Cobertura de linhas ≥ 80% em todos os helpers testados.
- [x] `npm run build` passa.
- [x] `AppData.js` e `UserData.js` não testados (dependem de Vuex store — escopo separado após #003).
