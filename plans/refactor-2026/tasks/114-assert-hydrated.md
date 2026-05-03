---
id: 114
title: assertHydrated() em Storage.set/get no Electron
slug: assert-hydrated
category: electron
wave: electron
model: sonnet
priority: P1
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: [114]
---

# [114] assertHydrated() no Storage

## Contexto

`Storage.js` no Electron hidrata async via IPC. Se algum código tentar `Storage.set()` ou `Storage.get()` antes de `hydrate()` resolver, o cache em memória está vazio e silenciosamente retorna `null`/sobrescreve dados ainda não carregados.

`main.js` aguarda `hydrate()` antes de mount, mas helpers chamados em `index.js` de módulos (carregados via dynamic import) podem rodar fora dessa garantia. Adicionar `assertHydrated()` que lança erro explícito facilita debug.

## Objetivo

- Em modo Electron, `Storage.set/get` lançam erro se chamados antes de `hydrate()`.
- Mensagem clara: "Storage não foi hidratado — chame Storage.hydrate() antes".

## Escopo

### Dentro
- Adicionar guard em `set/get` no path Electron.

### Fora
- **NÃO** afetar path web (localStorage é síncrono).

## Arquivos afetados

- [src/helpers/Storage.js](../../src/helpers/Storage.js)

## Plano de execução

1. Branch `chore/114-assert-hydrated`.
2. Em `Storage.js`:
   ```js
   _assertHydrated() {
     if (Platform.isDesktop && !this._desktopHydrated) {
       throw new Error('Storage not hydrated. Call Storage.hydrate() first.');
     }
   }
   set(key, value, type) {
     this._assertHydrated();
     // ... resto
   }
   ```
3. Smoke Electron: app boota normalmente.
4. Commit: `[114] Assert hydrated in Storage.set/get on Electron`.

## Validação

- [x] `assertHydrated(op)` adicionada antes da função `hydrate()` no módulo.
- [x] `set()` chama `assertHydrated("set")` antes de escrever no cache Electron.
- [x] `get()` chama `assertHydrated("get")` antes de ler do cache Electron.
- [x] Path web (localStorage/sessionStorage) não afetado.
- [x] `npm run build` passa sem erros.

## Referências

- Item audit: #114.
