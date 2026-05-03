---
id: 062
title: manualChunks no Vite + bundle visualizer
slug: manualchunks-bundle-visualizer
category: tooling
wave: 2
model: sonnet
priority: P2
estimate_hours: 2
status: done
depends_on: []
blocks: []
audit_items: [62, 63]
---

# [062] manualChunks + bundle visualizer

## Contexto

`vite.config.js` não tem `manualChunks`. O Vite faz chunking automático, mas sem configuração explícita:
- Vuetify (enorme) pode ser bundlado junto com código da app.
- `vue-router`, `vue-i18n`, `vuex` podem acabar no chunk principal.
- Não há visibilidade do tamanho do bundle — ninguém sabe o que está pesado.

Adicionalmente, `jszip` está marcado como `external` no `rollupOptions.build` (workaround para `SljaConverter.js`) o que é correto mas precisa ser mantido documentado.

## Objetivo

- Adicionar `manualChunks` separando vendor críticos do código da app.
- Adicionar `rollup-plugin-visualizer` para gerar `dist/stats.html` a cada build.
- Verificar que o build final é correto (sem módulos perdidos).

## Escopo

### Dentro
- `vite.config.js` — adicionar `manualChunks` e visualizer.
- Instalar `rollup-plugin-visualizer` como devDep.

### Fora
- **NÃO** resolver o `jszip` external neste PR — cobre task #061 (já done).
- **NÃO** otimizar lazy-loading de módulos do app ainda — vem depois.

## Arquivos afetados

- `vite.config.js`
- `package.json` (devDep: rollup-plugin-visualizer)

## Plano de execução

1. **Branch:** `git checkout -b chore/062-manualchunks-bundle-visualizer`

2. **Instalar visualizer:**
   ```bash
   npm install -D rollup-plugin-visualizer
   ```

3. **Atualizar `vite.config.js`:**

   ```js
   import { visualizer } from "rollup-plugin-visualizer";

   // Adicionar ao array de plugins:
   plugins.push(
     visualizer({
       filename: "dist/stats.html",
       open: false,      // não abrir browser automaticamente
       gzipSize: true,
       brotliSize: true,
     })
   );

   // No return defineConfig:
   build: {
     rollupOptions: {
       external: ["jszip"],
       output: {
         manualChunks: {
           // Framework core — raramente muda
           "vendor-vue": ["vue", "vue-router", "vuex"],
           // Vuetify é enorme — chunk separado com longa vida no cache
           "vendor-vuetify": ["vuetify"],
           // i18n — muda com traduções mas não com features
           "vendor-i18n": ["vue-i18n"],
           // Utilitários de busca
           "vendor-fuse": ["fuse.js"],
         },
       },
     },
   },
   ```

4. **Build e inspecionar:**
   ```bash
   npm run build
   ls -lh dist/assets/   # ver chunks gerados e tamanhos
   open dist/stats.html  # ou abrir manualmente no browser
   ```

5. **Verificar que chunks fazem sentido:**
   - `vendor-vuetify.js` deve ser o maior chunk.
   - Código da app deve estar em chunks menores.
   - `dist/stats.html` deve mostrar mapa visual.

6. **Smoke:**
   ```bash
   npm run build
   npx serve dist -p 5002
   # Abrir http://localhost:5002 e navegar
   ```

7. **Commit + PR:**
   ```
   [062] Add manualChunks and bundle visualizer to vite.config.js
   ```

## Validação

- [ ] `dist/stats.html` gerado após `npm run build`.
- [ ] Chunks `vendor-vue`, `vendor-vuetify`, `vendor-i18n` visíveis em `dist/assets/`.
- [ ] App funciona corretamente após build (sem módulo faltando por chunk errado).
- [ ] `npm run build` passa sem warnings de chunk circular.

## Riscos / atenções

- **`manualChunks` com Vuetify autoImport**: o plugin `vite-plugin-vuetify` com `autoImport: true` faz tree-shaking dos componentes Vuetify. Se `vendor-vuetify: ["vuetify"]` colocar tudo no mesmo chunk, pode quebrar o tree-shaking. Testar e ajustar — pode ser necessário deixar o Vuetify no chunk automático.
- **`visualizer` em builds de CI**: `open: false` já garante que não tenta abrir browser em CI. Mas o plugin gera `dist/stats.html` sempre — confirmar que isso não é problema no deploy.

## Referências

- Item audit: #62, #63.
- rollup-plugin-visualizer: https://github.com/btd/rollup-plugin-visualizer
- Vite manualChunks: https://vite.dev/guide/build#chunking-strategy

---

## Notas pós-execução

- **Branch:** `chore/062-manualchunks-bundle-visualizer`
- **Chunks gerados:** `vendor-vue` (164 kB), `vendor-i18n` (54 kB), `vendor-fuse` (24 kB).
- **Resultado:** chunk principal `index.js` caiu de **380 kB → 162 kB** (gzip: 135 kB → 55 kB).
- **Vuetify fora do manualChunks** (conforme risco documentado): `vite-plugin-vuetify` com `autoImport: true` faz tree-shaking automático; forçar um chunk único quebraria isso. Os componentes Vuetify ficam distribuídos pelos chunks do app — comportamento correto.
- **ESM fix:** `rollup-plugin-visualizer` é ESM-only. `package.json` não tem `"type": "module"`, então o import estático falhava. Solução: `async` na função do config + `await import("rollup-plugin-visualizer")` dinâmico. Também aproveitou para migrar `const path = require("path")` → `import path from "path"`.
- **`dist/stats.html`** gerado (446 kB) com mapa visual completo do bundle.
