---
id: 003
title: Substituir Vuex 4 por Pinia
slug: substituir-vuex-pinia
category: arquitetura
wave: 4
model: opus
priority: P1
estimate_hours: 16
status: done
depends_on: [004, 005]
blocks: [001, 002]
audit_items: [3]
---

# [003] Substituir Vuex 4 por Pinia

## Contexto

O store Vuex atual tem uma única mutation genérica `setData` que aceita qualquer dot-notation string para escrever em qualquer parte do state. Isso torna o estado global não-tipável e impossível de rastrear estaticamente — não há como saber quem escreve `modules.media.config.slide` sem grepar o projeto inteiro.

O `actions.js` está vazio. Os `getters.js` têm `getData` (dot-notation read) e `exists` — padrão genérico que impede o TypeScript de inferir o tipo do valor retornado. Toda a lógica real está nos helpers `AppData.js` e `UserData.js` que fazem `store.commit("setData", ...)` diretamente.

Pinia resolve esses problemas: stores são módulos TypeScript com tipagem automática, `defineStore()` substitui `createStore()`, `state` é uma factory function, actions são funções async-safe, e não há mutations — modificações diretas no state são permitidas dentro de actions ou com `$patch()`. DevTools do Pinia são melhores que os do Vuex.

A task #004 (unificar Storage/AppData/UserData) e #005 (mutations tipadas) devem estar done antes — elas eliminam os `store.commit("setData", ...)` dispersos, deixando apenas os `useAppStore()` e `useUserDataStore()` de Pinia.

## Objetivo

- `vuex` removido de `package.json`.
- `src/store/` substituído por `src/stores/` com Pinia stores tipadas.
- `AppData.js` e `UserData.js` usam `useAppStore()` e `useUserDataStore()` de Pinia.
- Zero ocorrências de `store.commit`, `store.getters`, `useStore()` de Vuex.

## Escopo

### Dentro
- Criar `src/stores/appStore.js` e `src/stores/userDataStore.js` com Pinia.
- Migrar `AppData.js` e `UserData.js` para usar as novas stores.
- Remover `src/store/` (index.js, state.js, mutations.js, actions.js, getters.js).
- Atualizar `main.js`: substituir `app.use(store)` por `app.use(createPinia())`.
- Remover `vuex` e adicionar `pinia` ao `package.json`.

### Fora
- **NÃO** mudar a API pública de `AppData.js` e `UserData.js` — callers existentes continuam funcionando.
- **NÃO** migrar para TypeScript nesta task (isso é #002) — Pinia funciona com JS puro.
- **NÃO** criar stores adicionais além de `appStore` e `userDataStore` — manter mínimo.

## Arquivos afetados

- [src/main.js](../../src/main.js) — substituir `app.use(store)` por `app.use(createPinia())`
- [src/store/index.js](../../src/store/index.js) → deletar
- [src/store/state.js](../../src/store/state.js) → deletar
- [src/store/mutations.js](../../src/store/mutations.js) → deletar
- [src/store/actions.js](../../src/store/actions.js) → deletar
- [src/store/getters.js](../../src/store/getters.js) → deletar
- [src/helpers/AppData.js](../../src/helpers/AppData.js) — usar `useAppStore()`
- [src/helpers/UserData.js](../../src/helpers/UserData.js) — usar `useUserDataStore()`
- [src/helpers/Storage.js](../../src/helpers/Storage.js) — verificar se acessa store diretamente
- `src/stores/appStore.js` (criar)
- `src/stores/userDataStore.js` (criar)

## Pré-requisitos

- `#004` done — Storage unificado (elimina acessos dispersos ao store).
- `#005` done — mutations tipadas (elimina `store.commit("setData", ...)` espalhados).
- Verificar callers restantes antes de remover o Vuex:
  ```bash
  grep -rn "useStore\|store\.commit\|store\.getters\|store\.state" src/ --include="*.js" --include="*.vue"
  ```

## Plano de execução

1. Branch `refactor/003-pinia`.

2. Instalar Pinia:
   ```bash
   npm install pinia
   ```

3. Inventariar state atual em `src/store/state.js` — mapear estrutura top-level.

4. Criar `src/stores/appStore.js`:
   ```js
   import { defineStore } from 'pinia';
   export const useAppStore = defineStore('app', {
     state: () => ({ /* estrutura atual de state.js */ }),
     getters: {
       getData: (state) => (path) => { /* mesmo dot-notation de getters.js */ },
     },
     actions: {
       setData(path, value) { /* mesmo comportamento de mutations.js setData */ },
     },
   });
   ```

5. Criar `src/stores/userDataStore.js`:
   ```js
   import { defineStore } from 'pinia';
   export const useUserDataStore = defineStore('userData', {
     state: () => ({ /* user_data de state.js */ }),
     actions: {
       set(param, value) { /* mesma lógica de UserData.js */ },
       get(param, ifnull = null) { /* mesma lógica */ },
       save() { /* debounced localStorage */ },
     },
   });
   ```

6. Atualizar `AppData.js` para usar `useAppStore()` em vez de `store.commit`/`store.getters`.

7. Atualizar `UserData.js` para usar `useUserDataStore()`.

8. Atualizar `main.js`:
   ```js
   import { createPinia } from 'pinia';
   // ...
   app.use(createPinia()); // em vez de app.use(store)
   ```

9. Verificar zero callers do Vuex:
   ```bash
   grep -rn "from '@/store'\|from '../store'\|useStore()" src/ --include="*.js" --include="*.vue"
   ```

10. Remover `src/store/` e `vuex` do `package.json`:
    ```bash
    npm uninstall vuex
    ```

11. `npm run build` e `npm run dev` — verificar que app carrega.

12. Smoke completo: abrir módulo, trocar tema, mudar idioma, abrir música.

13. Commit: `[003] Replace Vuex with Pinia (appStore + userDataStore)`.

## Validação

- [ ] `grep -rn "from 'vuex'\|from '@/store'" src/` retorna 0.
- [ ] `grep -rn "store\.commit\|store\.getters\|store\.state" src/` retorna 0.
- [ ] `npm run build` passa.
- [ ] `npm run dev` — app abre, estado persiste entre reloads.
- [ ] Smoke: trocar tema → persiste após reload.
- [ ] Smoke: trocar idioma PT→ES → persiste após reload.
- [ ] Smoke: abrir/fechar módulo → estado restaurado corretamente.
- [ ] Smoke Electron (se disponível): `userData/` persiste entre sessões.

## Riscos / atenções

- **Popup window**: `AppData.js` sincroniza estado para janelas popup via `window.postMessage`. Verificar que esse mecanismo funciona com Pinia (pode precisar de plugin de sync ou manter o `postMessage` manual).
- **Vuex DevTools**: se o time usa Vue DevTools com Vuex, migrar para Pinia DevTools (funciona naticamente no DevTools 6+).
- **`state.js` com estrutura profunda**: ao criar o `defineStore`, garantir que a estrutura de state replica exatamente o shape atual — qualquer campo faltando quebra getters que dependem do path completo.
- **`$patch()` vs action**: para updates atômicos de múltiplos campos, usar `$patch({ ... })` em vez de múltiplos `setData()`.
- **Hidratação no Electron**: `Storage.js` hidrata async — garantir que a store Pinia aguarda `hydrate()` antes de mount (já feito em `main.js` com `$storage.hydrate().then(...)`).

## Referências

- Item audit: #3.
- [Pinia docs](https://pinia.vuejs.org/).
- [Migração Vuex → Pinia](https://pinia.vuejs.org/cookbook/migration-vuex.html).
- [src/store/](../../src/store/) — estado atual.

---

## Notas pós-execução

Executado em 2026-05-04, branch `refactor/003-pinia`.

- `src/stores/appStore.js` e `src/stores/userDataStore.js` criados com Pinia `defineStore`.
- `AppData.js` e `UserData.js` migrados para `useAppStore()` / `useUserDataStore()`.
- `main.js` usa `createPinia()` (sem `app.use(store)` do Vuex).
- `src/store/` (5 arquivos) removido.
- `vuex` desinstalado via `npm uninstall vuex`.
- `vite.config.js` `manualChunks.vendor-vue`: substituído `vuex` por `pinia`.
- `npm run build` e `npm run test` (66 unit tests) passando.
- Zero referências a `from 'vuex'`, `store.commit`, `store.getters`, `store.state` em `src/`.
