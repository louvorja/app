---
id: 004
title: Unificar Storage → AppData → UserData numa camada tipada
slug: unificar-storage-appdata-userdata
category: arquitetura
wave: 4
model: opus
priority: P1
estimate_hours: 12
status: todo
depends_on: []
blocks: [003, 005]
audit_items: [4, 6]
---

# [004] Unificar Storage → AppData → UserData

## Contexto

O estado persistido do app passa por três camadas encadeadas que foram crescendo independentemente:

1. **`Storage.js` (311 linhas)** — wrapper de `localStorage`/`sessionStorage` no web e cache em memória + IPC no Electron. Responsável pela hidratação assíncrona no boot.
2. **`AppData.js` (75 linhas)** — wrapper de Vuex store com dot-notation. Serve dados voláteis de sessão. Sincroniza janelas popup via `window.postMessage`.
3. **`UserData.js` (49 linhas)** — wrapper de `AppData` com prefixo `user_data.`. Adiciona debounce de 300ms para persistência.

O problema: para salvar uma preferência do usuário (`theme: 'dark'`), o fluxo é:
```
UserData.set("theme", "dark")
  → AppData.set("user_data.theme", "dark")
    → store.commit("setData", ["user_data", "theme", "dark"])
      → state.user_data.theme = "dark"
        → Storage.set("user_data", JSON.stringify(state.user_data))  [debounce 300ms]
```

Quatro saltos para um setter simples. Nenhuma tipagem. Qualquer typo no dot-path passa silenciosamente. Debug requer conhecer os 4 arquivos.

Com Pinia (#003), as stores `useAppStore` e `useUserDataStore` substituem Vuex, mas `Storage.js` ainda precisa existir como adapter web/Electron. A oportunidade aqui é documentar claramente as responsabilidades e eliminar a redundância entre as camadas.

## Objetivo

- `AppData.js` documentado com JSDoc claro: "estado volátil de sessão, não persiste entre reloads".
- `UserData.js` documentado com JSDoc: "preferências do usuário, persiste via Storage".
- `Storage.js` documentado com JSDoc: "adapter de persistência (localStorage no web, IPC no Electron)".
- Qualquer duplicação de lógica eliminada.
- Fronteira clara: nenhum componente ou módulo acessa `Storage` diretamente — só via `AppData`/`UserData`.

## Escopo

### Dentro
- Auditar e documentar as 3 camadas com JSDoc.
- Verificar e eliminar qualquer acesso direto a `Storage` fora dos helpers autorizados.
- Criar interface `UserDataState` com todos os campos conhecidos do `user_data`.
- Garantir que nenhum módulo importa `Storage` diretamente.

### Fora
- **NÃO** mesclar os 3 arquivos num único — a separação de responsabilidades faz sentido.
- **NÃO** reescrever a lógica de sincronização Electron — isso é D1 do roadmap desktop.
- **NÃO** adicionar TypeScript nesta task (isso é #002).
- **NÃO** migrar para Pinia (isso é #003) — esta task prepara o terreno.

## Arquivos afetados

- [src/helpers/Storage.js](../../src/helpers/Storage.js) — adicionar JSDoc + auditar interface pública
- [src/helpers/AppData.js](../../src/helpers/AppData.js) — JSDoc + documentar responsabilidade
- [src/helpers/UserData.js](../../src/helpers/UserData.js) — JSDoc + interface UserDataState

## Pré-requisitos

- Nenhuma dependência de task prévia.
- Leitura de `Storage.js` completo antes de começar.

## Plano de execução

1. Branch `refactor/004-unificar-storage-layers`.

2. Ler `Storage.js` completo — mapear:
   - Quais métodos são públicos (`set`, `get`, `remove`, `removeAll`, `hydrate`, `save`).
   - Quais são internos (`_desktopCache`, `_toKey`, etc.).
   - Como funciona a hidratação no Electron vs web.

3. Verificar acessos diretos a `Storage` fora dos helpers:
   ```bash
   grep -rn "import.*Storage\|from.*Storage" src/ --include="*.js" --include="*.vue" | grep -v "AppData\|UserData\|Storage\.js"
   ```
   Qualquer resultado é um acoplamento não-autorizado — criar issue ou corrigir.

4. Ler `AppData.js` e `UserData.js` — mapear estado real em `user_data` lendo `state.js`.

5. Criar comentário de "arquitetura" no topo de cada arquivo:
   ```js
   /**
    * Storage.js — Adapter de persistência.
    * 
    * Responsabilidade: único ponto de leitura/escrita em localStorage (web) ou
    * userData IPC (Electron). Não contém lógica de negócio.
    * 
    * Quem usa: AppData.js (via $storage.save/load), não usar diretamente em módulos.
    */
   ```

6. Criar interface JSDoc `@typedef UserDataState` em `UserData.js` com todos os campos
   conhecidos: `theme`, `language`, `layout`, `remote`, `modules`, etc.

7. Documentar debounce de 300ms em `UserData.save()` — explicar por quê existe.

8. Documentar o `postMessage` de `AppData.set()` — explica sincronia com popup window.

9. `npm run build` e `npm run lint`.

10. Commit: `[004] Document and clarify Storage/AppData/UserData layer boundaries`.

## Validação

- [ ] `grep -rn "import.*Storage" src/ --include="*.js" --include="*.vue"` retorna apenas `AppData.js` e `UserData.js` (ou `Storage.js` si mesma).
- [ ] JSDoc em todos os métodos públicos dos 3 arquivos.
- [ ] `@typedef UserDataState` com campos: `theme`, `language`, `layout`, `remote`, `modules`.
- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.

## Riscos / atenções

- **Acoplamento em módulos legados**: módulos antigos podem importar `Storage` diretamente. Se encontrar, avaliar se deve corrigir nesta task ou criar issue separada.
- **Hidratação async**: `Storage.hydrate()` é async e o app não monta até ela completar. Não alterar essa sequência.
- **Popup window sync**: o `postMessage` em `AppData.set()` é crítico para sincronizar estado entre janela principal e popup. Documentar claramente para não ser removido por engano.

## Referências

- Item audit: #4, #6.
- [src/helpers/Storage.js](../../src/helpers/Storage.js) — 311 linhas.
- [src/helpers/AppData.js](../../src/helpers/AppData.js) — 75 linhas.
- [src/helpers/UserData.js](../../src/helpers/UserData.js) — 49 linhas.
- Roadmap D1 — persistência em `app.getPath("userData")` no Electron.

---

## Notas pós-execução

Executado em 2026-05-04 (branch `refactor/004-unificar-storage-layers`).

**Resultado da auditoria de callers de Storage:**
- `src/helpers/UserData.js` — autorizado (persiste user_data)
- `src/helpers/Database.js` — exceção autorizada documentada (cache sessionStorage de JSONs do banco)
- `src/main.js` — autorizado (chama `hydrate()` antes de montar o app)
- Nenhum componente ou módulo importa Storage diretamente — fronteira respeitada.

**O que foi entregue:**
- `AppData.js`: header JSDoc explicando responsabilidade de estado volátil + popup sync. JSDoc em todos os métodos (set, get, getFlatten, addElement, removeElement, toggle, exists, flatten).
- `UserData.js`: header JSDoc com fluxo completo. `@typedef UserDataState` (theme, language, layout, remote, favorites, history, modules) + `@typedef RemoteConfig`. JSDoc em todos os métodos (save, load, set, setIfNull, get). Debounce de 300ms documentado.
- `Storage.js`: header expandido com lista de callers autorizados e orientação para componentes/módulos não importarem diretamente.

**Validações:**
- `npm run build` ✅ sem erros
- `npm run lint` ✅ 1 erro pré-existente em `scripts/validate-manifests.mjs` (não relacionado a esta task)
