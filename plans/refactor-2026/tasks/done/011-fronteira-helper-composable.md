---
id: 011
title: Reorganizar fronteira helper/composable
slug: fronteira-helper-composable
category: arquitetura
wave: 4
model: opus
priority: P2
estimate_hours: 12
status: done
depends_on: [012]
blocks: []
audit_items: [11, 12]
---

# [011] Reorganizar fronteira helper/composable

## Contexto

`src/helpers/` mistura dois tipos de artefatos com naturezas muito diferentes:

**Helpers puros** (JavaScript simples, sem Vue):
- `Path.js` — constrói URLs. Sem estado, sem reatividade.
- `Strings.js` — utilitários de string. Funções puras.
- `DateTime.js` — formatação de tempo. Funções puras.
- `Database.js` — carrega JSON com cache. Assíncrono, mas sem `ref()`.

**Helpers com acoplamento ao Vue/Vuex:**
- `AppData.js` — `store.commit("setData", ...)`. Depende do Vuex.
- `UserData.js` — depende de `AppData`.
- `Modules.js` — `$appdata.set/get`. Depende do store.
- `Media.js` — usa `AppData` + `Broadcast` + lógica reativa.
- `Favorites.js` — depende de `UserData`.
- `History.js` — depende de `UserData`.
- `Liturgy.js` — depende de `UserData` + `AppData`.

**Composables** (em `src/composables/` — já existem 10):
- `useBroadcastListener`, `useProjectionState`, `useAlbum`, etc.
- Usam `ref()`, `computed()`, `onMounted()` de Vue.
- Retornam estado reativo.

O problema: helpers como `Media.js` (719 linhas) são na prática composables não declarados — têm estado reativo implícito via AppData/Vuex. Ao serem injetados como `globalProperties`, qualquer componente os acessa sem explicitar a dependência. Isso dificulta testes e impossibilita TypeScript inferir tipos de retorno.

A regra de ouro que falta documentada: **helpers = módulos JS puros (exportam funções/objetos, não usam APIs Vue)**; **composables = funções que usam APIs Vue (`ref`, `computed`, lifecycle hooks) e são chamadas dentro de `setup()`**.

## Objetivo

- Regra documentada em `CLAUDE.md`: helpers vs composables.
- Audit de todos os 18 `globalProperties` — cada um classificado como "helper puro" ou "deve virar composable".
- Helpers impuros identificados com lista de tasks pendentes para migração.
- `src/helpers/` contém apenas helpers puros ao final.

## Escopo

### Dentro
- Documentar a regra helpers/composables em `CLAUDE.md`.
- Auditar os 18 `globalProperties` e classificar cada um.
- Criar lista de helpers que devem virar composables (sem implementar a migração — isso é tarefa de cada task específica).
- Mover helpers que já são puramente funcionais para confirmar que estão no lugar certo.

### Fora
- **NÃO** implementar a migração dos helpers impuros (isso é escopo de #016, #022, etc.).
- **NÃO** mover arquivos ainda — apenas documentar a classificação.
- **NÃO** alterar comportamento de nenhum arquivo.

## Arquivos afetados

- [CLAUDE.md](../../CLAUDE.md) — adicionar seção "Helpers vs Composables"
- [src/main.js](../../src/main.js) — adicionar comentário de classificação nos `globalProperties`
- [src/helpers/](../../src/helpers/) — JSDoc em cada helper indicando sua classificação

## Pré-requisitos

- `#012` done (globalProperties removidas) — sem isso, a fronteira ainda está misturada.
- Ler `src/helpers/` completo antes de começar.

## Plano de execução

1. Branch `refactor/011-fronteira-helper-composable`.

2. Inventariar todos os helpers em `src/helpers/`:
   ```bash
   ls src/helpers/
   ```

3. Para cada um dos 18 `globalProperties`, classificar:
   - `$userdata` (`UserData.js`) — acessa Vuex → **deve virar composable**
   - `$appdata` (`AppData.js`) — acessa Vuex → **deve virar composable**
   - `$modules` (`Modules.js`) — acessa AppData → **deve virar composable**
   - `$media` (`Media.js`) — estado reativo, BroadcastChannel → **deve virar composable** (#016)
   - `$alert` (`Alert.js`) — `setInterval` + store → **deve virar composable**
   - `$popup` (`Popup.js`) — `window.open` + store → **helper puro** (sem reatividade Vue)
   - `$database` (`Database.js`) — Promise, sessionStorage → **helper puro**
   - `$favorites` (`Favorites.js`) — UserData → **deve virar composable**
   - `$history` (`History.js`) — UserData → **deve virar composable**
   - `$broadcast` (`Broadcast.js`) — BroadcastChannel → **helper puro** (já tem composable #015)
   - `$liturgy` (`Liturgy.js`) — UserData → **deve virar composable**
   - `$platform` (`Platform.js`) — detecção de env → **helper puro**
   - `$shortcuts` (`Shortcuts.js`) — event listeners → **helper puro** (registra globalmente)
   - `$hotkeys` (`Hotkeys.js`) — event listeners → **helper puro**
   - `$string` (`Strings.js`) — funções puras → **helper puro**
   - `$datetime` (`DateTime.js`) — funções puras → **helper puro**
   - `$path` (`Path.js`) — funções puras → **helper puro**
   - `$dev` (`Dev.js`) — `AppData` → **deve virar composable ou env-gated**

4. Adicionar JSDoc em cada helper com `@category helper-puro` ou `@category deve-virar-composable`.

5. Adicionar seção em `CLAUDE.md`:
   ```markdown
   ## Helpers vs Composables
   
   **Regra:** helpers em `src/helpers/` são módulos JS puros — exportam funções/objetos,
   não usam APIs Vue (`ref`, `computed`, lifecycle hooks). São importáveis de qualquer
   contexto (Node, tests, Electron main process).
   
   **Composables** em `src/composables/` usam APIs Vue e devem ser chamados apenas
   dentro de `setup()`. Retornam estado reativo e cleanup automático.
   
   Helpers com acoplamento a Vuex/Pinia são candidatos a migração para composables.
   Ver tasks #011, #012, #016.
   ```

6. Commit: `[011] Document helper/composable boundary + audit globalProperties`.

## Validação

- [ ] `CLAUDE.md` tem seção "Helpers vs Composables" com a regra.
- [ ] JSDoc em todos os 18 helpers classificando cada um.
- [ ] Lista em `CLAUDE.md` ou task notes com helpers que precisam migrar para composable.
- [ ] `npm run build` passa (nenhum arquivo foi movido/alterado funcionalmente).

## Riscos / atenções

- **Esta task é documentação + auditoria**, não migração — o risco é baixo.
- **Classificação subjetiva**: `Alert.js` tem `setInterval` mas não usa `ref()` — pode ser "helper com side effects" em vez de composable. Decisão: se usa estado Vue reativo, é composable; se gerencia estado próprio com primitivos JS, é helper.
- **Helpers usados no Electron main process**: `Path.js`, `Platform.js`, `Database.js` são usados no main.cjs — não podem depender de Vue. Documentar esse constraint.

## Referências

- Item audit: #11, #12.
- [CLAUDE.md](../../CLAUDE.md) — documentação existente.
- [src/helpers/](../../src/helpers/) — todos os 18 helpers.
- [src/composables/](../../src/composables/) — composables existentes.

---

## Notas pós-execução

Executado em 2026-05-05. Task foi documentação+auditoria pura, sem migração de código.

**Classificação final (24 helpers):**
- 13 `helper-puro`: DateTime, Strings, ModuleTypes, Platform, SljaConverter, AudioBeep, Hotkeys, Shortcuts, BroadcastTypes, Broadcast, Path, Database, Storage
- 11 `deve-virar-composable`: AppData, UserData, Modules, ModuleManager, Favorites, History, Liturgy, Dev, Alert, Popup, CommandRegistry

**Decisões tomadas durante execução:**
- `Alert.js` classificado como `deve-virar-composable` pois já usa `watch()` Vue internamente (quasi-composable).
- `Database.ts` classificado como `helper-puro` apesar de importar `$alert` — ele não usa Pinia/Vue diretamente; a dependência é transitiva apenas para relatório de erros.
- `CommandRegistry.js` classificado como `deve-virar-composable` pois usa `Modules` (AppData) e `useMedia` composable.
- `Shortcuts.js` classificado como `helper-puro` pois no browser/PWA é no-op; não usa APIs Vue.

`TASK_COMPLETE: #011`
