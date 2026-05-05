# Backlog — Refactor 2026

Tabela mestre. Atualize a coluna `Status` ao final de cada sessão.

**Legendas:**
- **Modelo**: `O` = Opus 4.7, `S` = Sonnet 4.6, `H` = Híbrido (Opus planeja, Sonnet executa).
- **Prioridade**: `P0` urgente, `P1` alto, `P2` médio, `P3` baixo.
- **Estimativa**: horas-humano (não inclui revisão de PR).
- **Onda**: 1 higiene · 2 padronização · 3 refactor pesado · 4 migração técnica.

---

## Onda 1 — Higiene (rápido, baixo risco, alto sinal)

| ID  | Task                                                       | Modelo | Pri | Est | Status | Cobre items |
|-----|------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 007 | [Renomear `helpers/String.js` → `Strings.js`](tasks/done/007-rename-string-helper.md) | S | P0 | 1h | done | 7 |
| 008 | [Corrigir typo `toogle` → `toggle` (alias deprecated)](tasks/done/008-fix-toogle-typo.md) | S | P1 | 1h | done | 8 |
| 099 | [Remover helpers vazios (Window.js, Theme.js)](tasks/done/099-remover-helpers-vazios.md) | S | P2 | 0.5h | done | 99, 100 |
| 102 | [Remover debug em App.vue (Ctrl+Alt+D + console)](tasks/done/102-remover-debug-app.md) | S | P0 | 0.5h | done | 102 |
| 104 | [Remover blocos comentados ModuleManager/main](tasks/done/104-cleanup-dead-comments.md) | S | P2 | 0.5h | done | 104, 106 |
| 115 | [`console.log` em Storage.js → env-gated](tasks/done/115-storage-logs.md) | S | P1 | 0.5h | done | 115 |
| 119 | [Bug: `parseInt(num)` sem radix](tasks/done/119-bible-parseint-radix.md) | S | P2 | 0.25h | done | 119 |
| 120 | [Bug: `Math.max` sem proteção](tasks/done/120-bible-math-max-empty.md) | S | P2 | 0.25h | done | 120 |
| 103 | [Limpar refs legacy a `hymnal_1996`](tasks/done/103-cleanup-hymnal-1996.md) | S | P2 | 1h | done | 103 |
| 084 | [Remover token API hardcoded fallback](tasks/done/084-remove-token-fallback.md) | S | P1 | 0.5h | done | 84 |

---

## Onda 2 — Padronização visual + tooling

| ID  | Task                                                                | Modelo | Pri | Est | Status | Cobre items     |
|-----|---------------------------------------------------------------------|--------|-----|-----|--------|-----------------|
| 028 | [Aplicar tokens CSS — varredura e substituição de hex hardcoded](tasks/done/028-aplicar-tokens-css.md) | S | P1 | 4h | done | 28, 35, 38 |
| 029 | [Eliminar `!important` (resolver especificidade)](tasks/done/029-remover-important.md) | S | P2 | 1h | done | 29 |
| 030 | [Eliminar `:global(.v-theme--dark)` em scoped — usar tokens](tasks/done/030-remover-global-theme-dark.md) | S | P2 | 2h | done | 30 |
| 031 | [Substituir `rgb(var(--v-theme-primary))` por tokens LJ](tasks/done/031-reduzir-rgb-var.md) | S | P3 | 1h | done | 31 |
| 032 | [Extrair classes utilitárias `.lj-u-*`](tasks/done/032-extrair-classes-utilitarias.md) | S | P2 | 2h | done | 32 |
| 033 | [Mover `layout.scss` para `utilities.scss`](tasks/done/033-mover-layout-scss.md) | S | P3 | 0.5h | done | 33 |
| 034 | [Consolidar `@font-face DINCondensedBold` (2 lugares → 1)](tasks/done/034-consolidar-font-face.md) | S | P2 | 0.5h | done | 34 |
| 037 | [`Slide.vue` respeitar dark theme (cores hardcoded)](tasks/done/037-slide-dark-theme.md) | S | P2 | 1h | done | 37 |
| 052 | [Mover strings hardcoded para i18n (varredura completa)](tasks/done/052-mover-strings-hardcoded-i18n.md) | S | P1 | 3h | done | 52, 53, 54, 56 |
| 066 | [Migrar ESLint para flat config (eslint.config.js)](tasks/done/066-eslint-flat-config.md) | S | P3 | 1h | done | 66 |
| 067 | [Adicionar Prettier com config compartilhada](tasks/done/067-adicionar-prettier.md) | S | P2 | 1h | done | 67 |
| 068 | [Adicionar Husky + lint-staged](tasks/done/068-adicionar-husky-lint-staged.md) | S | P2 | 1h | done | 68 |
| 057 | [Auditar e travar `vue-router` em versão estável](tasks/done/057-travar-vue-router.md) | O | P1 | 2h | done | 57 |
| 058 | [RFC: travar Vuetify na versão estável](tasks/done/058-rfc-vuetify-decision.md) | O | P0 | 4h | done | 58, 59 |
| 060 | [Auditar dependências (webfontloader, core-js, etc)](tasks/done/060-audit-dependencias.md) | S | P3 | 1h | done | 60 |
| 061 | `jszip` external → import dinâmico em `SljaConverter.js` | S | P1 | 1h | done | 61 |
| 062 | [manualChunks no Vite + bundle visualizer](tasks/done/062-manualchunks-bundle-visualizer.md) | S | P2 | 2h | done | 62, 63 |
| 064 | [Adicionar aliases Vite (`@helpers`, `@modules`, `@components`)](tasks/done/064-aliases-vite.md) | S | P3 | 0.5h | done | 64 |
| 069 | [Documentar/corrigir porta dev (5002 vs 5173)](tasks/done/069-corrigir-porta-dev.md) | S | P2 | 0.5h | done | 69 |
| 070 | [Decidir destino de `npm run files`: documentar ou remover](tasks/done/070-destino-npm-run-files.md) | S | P3 | 0.5h | done | 70 |
| 113 | [Criar `.env.example` documentando VITE_*](tasks/done/113-env-example.md) | S | P2 | 0.5h | done | 113 |
| 014 | [JSON schema para `manifest.json` + validação na build](tasks/done/014-manifest-json-schema.md) | O | P2 | 3h | done | 13, 14 |

---

## Onda 3 — Refactor estrutural pesado

| ID  | Task                                                                 | Modelo | Pri | Est | Status | Cobre items   |
|-----|----------------------------------------------------------------------|--------|-----|-----|--------|---------------|
| 015 | [Contratos tipados para BroadcastChannel](tasks/done/015-broadcast-contratos-tipados.md) | O | P1 | 3h | done | 15, 26 |
| 025 | [Composable `useBroadcastListener` + cleanup automático](tasks/done/025-use-broadcast-listener.md) | O | P1 | 4h | done | 25, 26, 75 |
| 023 | [Eliminar duplicação Projection/ProjectionReturn](tasks/done/023-eliminar-duplicacao-projection.md) | O | P1 | 6h | done | 23, 24, 27 |
| 016 | [Quebrar `helpers/Media.js` em composables](tasks/016-quebrar-media-helper.md) | O | P0 | 12h | done | 16, 76 |
| 017 | [Refatorar `liturgy/Index.vue` (2331 linhas) em componentes+composables](tasks/017-refatorar-liturgy.md) | O | P0 | 16h | done | 17, 18, 19, 20 |
| 022 | [Refatorar `Player.vue` (453 linhas)](tasks/022-refatorar-player.md) | O | P1 | 8h | done | 22 |
| 005 | [Substituir `setData` genérico por mutations tipadas](tasks/005-substituir-setdata.md) | O | P1 | 8h | done | 5, 6 |
| 010 | [Unificar Hotkeys + Shortcuts + vue3-shortkey](tasks/010-unificar-hotkeys-shortcuts.md) | O | P1 | 6h | done | 10 |
| 009 | [Unificar Modules.js + ModuleManager.js](tasks/009-unificar-modules-manager.md) | O | P1 | 4h | done | 9, 12 |
| 094 | [Padronizar prefixo de componentes (Lj* ou renomear conflitantes)](tasks/done/094-prefixo-componentes.md) | S | P2 | 2h | done | 94 |
| 021 | [Extrair `playBeep` (Web Audio) para helper](tasks/done/021-extrair-play-beep.md) | S | P3 | 0.5h | done | 21 |
| 040 | [Cobertura ARIA shell (RibbonBar, OpenModulesTabs, AppMenu)](tasks/done/040-cobertura-aria-shell.md) | S | P1 | 3h | done | 40, 41, 42, 50 |
| 044 | [`alt` em imagens + `aria-label` em inputs](tasks/done/044-alt-imagens-aria-inputs.md) | S | P1 | 2h | done | 44, 45, 49 |
| 046 | [Fix `Operator.vue` tabindex=0 sem role](tasks/done/046-operator-tabindex.md) | S | P2 | 0.25h | done | 46 |
| 045 | [Adicionar focus-trap em todos os modais](tasks/045-focus-trap-modais.md) | O | P1 | 4h | done | 43, 47 |
| 051 | [Adicionar `vue-axe` em dev mode](tasks/done/051-vue-axe-dev.md) | S | P2 | 1h | done | 51 |

---

## Onda 4 — Migração técnica (longa, alto impacto)

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 001 | [Padronizar Composition API + `<script setup>` em todo o projeto](tasks/001-composition-api-script-setup.md)   | H      | P1  | 24h | done   | 1           |
| 002 | [Migração para TypeScript (faseada: helpers → store → components)](tasks/002-migracao-typescript.md)  | O      | P1  | 80h | done   | 2, 7        |
| 003 | [Substituir Vuex por Pinia](tasks/done/003-substituir-vuex-pinia.md)                                    | O      | P1  | 16h | done   | 3           |
| 004 | [Unificar Storage→AppData→UserData numa camada tipada](tasks/004-unificar-storage-appdata-userdata.md)              | O      | P1  | 12h | done   | 4, 6        |
| 011 | [Reorganizar fronteira helper/composable](tasks/done/011-fronteira-helper-composable.md)                      | O      | P2  | 12h | done   | 11, 12      |
| 012 | [Substituir `globalProperties` por imports/composables](tasks/012-remover-globalproperties.md)             | H      | P2  | 8h  | done   | 12          |
| 088 | [Setup Vitest + cobertura de helpers críticos](tasks/088-setup-vitest.md)                      | O      | P1  | 6h  | done   | 88, 91, 92  |
| 089 | [Setup Playwright + smoke E2E (Operator → Projection)](tasks/089-setup-playwright.md)              | O      | P1  | 8h  | done   | 89          |
| 090 | [Regressão visual (Percy/Chromatic) para Ribbon e Player](tasks/done/090-regressao-visual-percy.md)      | O      | P2  | 6h  | done   | 90          |
| 093 | [Validar Electron build em CI (matriz win/mac/linux)](tasks/done/093-electron-ci.md)               | O      | P2  | 4h  | done   | 93          |

---

## Performance

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 071 | [TTL + versionamento em `Database.js` (cache sessionStorage)](tasks/071-database-cache-ttl.md)       | O      | P1  | 3h  | done   | 71          |
| 072 | [CommandRegistry: lazy-load + paginação + cancel tokens](tasks/done/072-command-registry-lazy.md)       | O      | P2  | 4h  | done   | 72          |
| 073 | [`Dev.write` env-gated em vez de state Vuex (no RAF loop)](tasks/073-dev-write-env-gated.md)          | S      | P2  | 0.5h| done   | 73          |
| 074 | [Substituir `setInterval(100ms)` em `Alert.js` por watcher](tasks/074-alert-watcher.md)         | S      | P2  | 1h  | done   | 74          |
| 077 | [Tornar `Liturgy.migrate()` async no boot, com feedback](tasks/077-liturgy-migrate-async.md)            | S      | P2  | 1h  | done   | 77          |
| 078 | [Memoization de `computed` que retornam novos arrays/objetos](tasks/done/078-memoization-computed.md)        | H      | P3  | 4h  | done   | 78          |
| 079 | [Adicionar `loading="lazy"` em imagens](tasks/079-loading-lazy-imagens.md)                             | S      | P3  | 1h  | done   | 79          |
| 080 | [Auditar e ajustar Service Worker (offline-first vs network-first)](tasks/done/080-service-worker-strategy.md) | O      | P2  | 3h  | done   | 80          |

---

## Segurança

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 081 | [Sanitizar inputs em `Path.db()` e `Path.file()`](tasks/081-sanitizar-path-inputs.md)                   | S      | P1  | 1h  | done   | 81          |
| 082 | [Substituir `v-html` em CommandPalette (highlight via DOM)](tasks/082-vhtml-command-palette.md)         | S      | P2  | 1h  | done   | 82          |
| 085 | [Garantir `noopener,noreferrer` em popups](tasks/085-noopener-noreferrer.md)                          | S      | P2  | 0.5h| done   | 85          |
| 086 | [Configurar CSP / headers de segurança (PWA web)](tasks/done/086-csp-headers.md)                   | O      | P2  | 3h  | done   | 86          |
| 087 | Confirmar que `basic-ftp` está no main process do Electron        | S      | P0  | 0.5h| done   | 87          |

---

## Convenções, dead-code e docs

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 095 | [Padronizar nomenclatura `interface/` vs `components/`](tasks/done/095-interface-vs-components.md)        | S      | P3  | 2h  | done   | 95          |
| 096 | [Padronizar capitalização de arquivos (Index.vue vs index.vue)](tasks/done/096-capitalizacao-arquivos.md)     | S      | P3  | 1h  | done   | 96          |
| 097 | [Padronizar imports relativos vs alias `@`](tasks/done/097-imports-alias.md)                     | S      | P3  | 1h  | done   | 97          |
| 098 | [Decidir: `modules/core/` permanece ou achata](tasks/done/098-modules-core-flat.md)                      | S      | P3  | 0.5h| done   | 98          |
| 105 | [Refatorar `state.js` (`module_group` pre-declarado)](tasks/done/105-state-module-group.md)          | S      | P3  | 0.5h| done   | 105         |
| 106 | [Limpar comentários de rationale antigos](tasks/done/106-comentarios-rationale.md)                      | S      | P3  | 0.5h| done   | 106         |
| 107 | [Confirmar zero refs a TrayArea/Header/Apps/AppsRibbon/Menu/Main](tasks/107-confirmar-zero-refs-deletados.md)   | S      | P1  | 0.5h| done   | 107         |
| 108 | [Criar `CONTRIBUTING.md` (fluxo de criação de módulo)](tasks/done/108-contributing-md.md)         | O      | P2  | 2h  | done   | 108         |
| 109 | [Criar `ARCHITECTURE.md` (camadas, composables vs helpers)](tasks/done/109-architecture-md.md)         | O      | P2  | 4h  | done   | 109         |
| 110 | [Atualizar README com onboarding humano](tasks/done/110-readme-onboarding.md)                       | S      | P3  | 1h  | done   | 110         |
| 111 | [Documentar BroadcastChannel schemas (depois de #015)](tasks/111-broadcast-schemas-docs.md)              | S      | P2  | 1h  | done   | 111         |
| 112 | [Documentar variáveis de ambiente Vite](tasks/done/112-env-vars-docs.md)                             | S      | P2  | 0.5h| done   | 112         |

---

## Electron / Desktop

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 114 | [`assertHydrated()` em `Storage.set/get` no Electron](tasks/114-assert-hydrated.md)               | S      | P1  | 1h  | done   | 114         |
| 116 | [Confirmar BroadcastChannel cross-window em Electron + alternativa](tasks/done/116-broadcast-electron-cross-window.md) | O      | P1  | 4h  | done   | 116         |
| 117 | [Validar latência <50ms slide_change Operator→Projection](tasks/done/117-validar-latencia-slide-change.md)       | O      | P2  | 4h  | done   | 117         |
| 118 | [Resolver conflito globalShortcut vs Hotkeys in-window](tasks/done/118-globalshortcut-vs-hotkeys.md)        | O      | P1  | 2h  | done   | 118         |

---

## Bugs e code smells pontuais

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 121 | [Helper para `scrollIntoView()` (3 usos em liturgy)](tasks/121-helper-scroll-into-view.md)                | S      | P3  | 0.5h| todo   | 121         |
| 122 | [`Media.open` cleanup completo em error path](tasks/122-media-open-cleanup.md)                       | S      | P2  | 1h  | done   | 122         |
| 123 | [`Media._loadingId` race no XHR else branch](tasks/123-media-loading-id-race.md)                        | S      | P2  | 1h  | done   | 123         |
| 124 | [Auditar duplicação MusicMenuTable vs DataTable](tasks/124-music-menu-vs-datatable.md)                    | O      | P2  | 3h  | todo   | 124         |
| 125 | [Bible: 3 watchers consecutivos chamando mesma função](tasks/125-bible-watchers-redundantes.md)              | S      | P2  | 0.5h| done   | 125         |
| 036 | [Variantes de elevação/sombra como tokens](tasks/036-tokens-elevacao.md)                          | S      | P3  | 1h  | todo   | 36          |
| 039 | [Documentar design system (`DESIGN.md`)](tasks/039-design-md.md)                            | O      | P2  | 4h  | todo   | 39          |
| 048 | [a11y: color/week/file inputs com descrição assistiva](tasks/048-a11y-color-week-file.md)              | S      | P2  | 1h  | done   | 48          |
| 055 | [Validar idioma `es` end-to-end](tasks/055-validar-es-end-to-end.md)                                    | S      | P3  | 2h  | todo   | 55          |
| 059 | [Travar versão Vue / decisão de upgrade](tasks/059-travar-vue-versao.md)                            | S      | P3  | 0.5h| todo   | 59          |
| 065 | [Remover `browserslist` se inutilizado pelo Vite](tasks/065-remover-browserslist.md)                   | S      | P3  | 0.25h| todo  | 65          |

---

## Resumo numérico

| Onda                       | Tasks | Sonnet | Opus | Híbrida | Estimativa total |
|----------------------------|-------|--------|------|---------|------------------|
| Onda 1 — Higiene           | 10    | 10     | 0    | 0       | ~6h              |
| Onda 2 — Padronização      | 22    | 18     | 4    | 0       | ~32h             |
| Onda 3 — Refactor pesado   | 16    | 5      | 8    | 3       | ~80h             |
| Onda 4 — Migração técnica  | 10    | 0      | 8    | 2       | ~176h            |
| Performance                | 8     | 4      | 3    | 1       | ~17h             |
| Segurança                  | 5     | 4      | 1    | 0       | ~6h              |
| Convenções/dead-code/docs  | 12    | 9      | 3    | 0       | ~14h             |
| Electron                   | 4     | 1      | 3    | 0       | ~11h             |
| Bugs pontuais              | 11    | 9      | 2    | 0       | ~14h             |
| **Total**                  | **98**| **60** | **32**| **6**  | **~356h**        |

> Nota: 125 itens da auditoria foram consolidados em **98 tasks** ao agrupar correções relacionadas (ex: i18n hardcoded virou 1 task #052 cobrindo itens 52, 53, 54, 56).

---

## Quick filters

**Pegando algo agora? Comece por:**
- Sonnet, ≤1h: #021 (playBeep), #046 (Operator tabindex), #040 (ARIA shell), #044 (alt/aria)
- Opus, fundação da Onda 3 (deve ser feito primeiro): #015 → #025 → #023
- Opus, alto impacto: #016 (Media.js), #017 (liturgy), #005 (setData), #010 (hotkeys)

**Tasks com arquivo detalhado pronto:**
- Onda 1 completa (em `tasks/done/`): #007, #008, #084, #099, #102, #103, #104, #115, #119, #120
- Onda 2 completa (em `tasks/done/`): #014, #028, #029, #030, #031, #032, #033, #034, #037, #052, #057, #058, #060, #062, #064, #066, #067, #068, #069, #070, #113
- Onda 3 — fundação BroadcastChannel: #015, #025, #023
- Onda 3 — refatores pesados: #016, #017, #022, #005, #010, #009
- Onda 3 — a11y: #040, #044, #045, #046, #051
- Onda 3 — pontuais: #021, #094
