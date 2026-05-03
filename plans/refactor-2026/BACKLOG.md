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
| 028 | [Aplicar tokens CSS — varredura e substituição de hex hardcoded](tasks/028-aplicar-tokens-css.md) | S | P1 | 4h | done | 28, 35, 38 |
| 029 | [Eliminar `!important` (resolver especificidade)](tasks/029-remover-important.md) | S | P2 | 1h | done | 29 |
| 030 | [Eliminar `:global(.v-theme--dark)` em scoped — usar tokens](tasks/030-remover-global-theme-dark.md) | S | P2 | 2h | done | 30 |
| 031 | [Substituir `rgb(var(--v-theme-primary))` por tokens LJ](tasks/031-reduzir-rgb-var.md) | S | P3 | 1h | done | 31 |
| 032 | [Extrair classes utilitárias `.lj-u-*`](tasks/032-extrair-classes-utilitarias.md) | S | P2 | 2h | done | 32 |
| 033 | [Mover `layout.scss` para `utilities.scss`](tasks/033-mover-layout-scss.md) | S | P3 | 0.5h | done | 33 |
| 034 | [Consolidar `@font-face DINCondensedBold` (2 lugares → 1)](tasks/034-consolidar-font-face.md) | S | P2 | 0.5h | done | 34 |
| 037 | [`Slide.vue` respeitar dark theme (cores hardcoded)](tasks/037-slide-dark-theme.md) | S | P2 | 1h | done | 37 |
| 052 | [Mover strings hardcoded para i18n (varredura completa)](tasks/052-mover-strings-hardcoded-i18n.md) | S | P1 | 3h | done | 52, 53, 54, 56 |
| 066 | [Migrar ESLint para flat config (eslint.config.js)](tasks/066-eslint-flat-config.md) | S | P3 | 1h | done | 66 |
| 067 | [Adicionar Prettier com config compartilhada](tasks/067-adicionar-prettier.md) | S | P2 | 1h | done | 67 |
| 068 | [Adicionar Husky + lint-staged](tasks/068-adicionar-husky-lint-staged.md) | S | P2 | 1h | done | 68 |
| 057 | [Auditar e travar `vue-router` em versão estável](tasks/057-travar-vue-router.md) | O | P1 | 2h | done | 57 |
| 058 | [RFC: travar Vuetify na versão estável](tasks/058-rfc-vuetify-decision.md) | O | P0 | 4h | done | 58, 59 |
| 060 | [Auditar dependências (webfontloader, core-js, etc)](tasks/060-audit-dependencias.md) | S | P3 | 1h | done | 60 |
| 061 | `jszip` external → import dinâmico em `SljaConverter.js` | S | P1 | 1h | done | 61 |
| 062 | [manualChunks no Vite + bundle visualizer](tasks/062-manualchunks-bundle-visualizer.md) | S | P2 | 2h | done | 62, 63 |
| 064 | [Adicionar aliases Vite (`@helpers`, `@modules`, `@components`)](tasks/064-aliases-vite.md) | S | P3 | 0.5h | done | 64 |
| 069 | [Documentar/corrigir porta dev (5002 vs 5173)](tasks/069-corrigir-porta-dev.md) | S | P2 | 0.5h | done | 69 |
| 070 | [Decidir destino de `npm run files`: documentar ou remover](tasks/070-destino-npm-run-files.md) | S | P3 | 0.5h | todo | 70 |
| 113 | [Criar `.env.example` documentando VITE_*](tasks/113-env-example.md) | S | P2 | 0.5h | todo | 113 |
| 014 | [JSON schema para `manifest.json` + validação na build](tasks/014-manifest-json-schema.md) | O | P2 | 3h | todo | 13, 14 |

---

## Onda 3 — Refactor estrutural pesado

| ID  | Task                                                                 | Modelo | Pri | Est | Status | Cobre items   |
|-----|----------------------------------------------------------------------|--------|-----|-----|--------|---------------|
| 016 | [Quebrar `helpers/Media.js` em composables](tasks/016-quebrar-media-helper.md) | O | P0 | 12h | todo | 16, 76 |
| 017 | Refatorar `liturgy/Index.vue` (2048 linhas) em componentes+composables| O     | P0  | 16h | todo   | 17, 18, 19, 20|
| 022 | Refatorar `Player.vue` (489 linhas)                                  | O      | P1  | 8h  | todo   | 22            |
| 023 | Eliminar duplicação Projection/ProjectionReturn                      | O      | P1  | 6h  | todo   | 23, 24, 27    |
| 025 | Composable `useBroadcastListener` + cleanup automático               | H      | P1  | 4h  | todo   | 25, 26, 75    |
| 094 | Padronizar prefixo de componentes (`L*` ou nada)                     | S      | P2  | 2h  | todo   | 94            |
| 005 | Substituir `setData` genérico por mutations tipadas                  | O      | P1  | 8h  | todo   | 5, 6          |
| 010 | Unificar Hotkeys + Shortcuts + vue3-shortkey                         | O      | P1  | 6h  | todo   | 10            |
| 009 | Unificar Modules.js + ModuleManager.js                               | O      | P1  | 4h  | todo   | 9, 12         |
| 015 | Contratos tipados para BroadcastChannel                              | O      | P1  | 3h  | todo   | 15, 26        |
| 021 | Extrair `playBeep` (Web Audio) para helper                           | S      | P3  | 0.5h| todo   | 21            |
| 045 | Adicionar focus-trap em todos os modais                              | H      | P1  | 4h  | todo   | 43, 47        |
| 040 | Cobertura ARIA shell (RibbonBar, OpenModulesTabs, AppMenu)           | S      | P1  | 3h  | todo   | 40, 41, 42, 50|
| 044 | `alt` em imagens + `aria-label` em inputs                            | S      | P1  | 2h  | todo   | 44, 45, 49    |
| 046 | Fix `Operator.vue` tabindex=0 sem role                               | S      | P2  | 0.25h| todo  | 46            |
| 051 | Adicionar `vue-axe-next` em dev mode + smoke test a11y               | S      | P2  | 1h  | todo   | 51            |

---

## Onda 4 — Migração técnica (longa, alto impacto)

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 001 | Padronizar Composition API + `<script setup>` em todo o projeto   | H      | P1  | 24h | todo   | 1           |
| 002 | Migração para TypeScript (faseada: helpers → store → components)  | O      | P1  | 80h | todo   | 2, 7        |
| 003 | Substituir Vuex por Pinia                                         | O      | P1  | 16h | todo   | 3           |
| 004 | Unificar Storage→AppData→UserData numa camada tipada              | O      | P1  | 12h | todo   | 4, 6        |
| 011 | Reorganizar fronteira helper/composable                           | O      | P2  | 12h | todo   | 11, 12      |
| 012 | Substituir `globalProperties` por imports/composables             | H      | P2  | 8h  | todo   | 12          |
| 088 | Setup Vitest + cobertura de helpers críticos                      | O      | P1  | 6h  | todo   | 88, 91, 92  |
| 089 | Setup Playwright + smoke E2E (Operator → Projection)              | O      | P1  | 8h  | todo   | 89          |
| 090 | Regressão visual (Percy/Chromatic) para Ribbon e Player           | O      | P2  | 6h  | todo   | 90          |
| 093 | Validar Electron build em CI (matriz win/mac/linux)               | O      | P2  | 4h  | todo   | 93          |

---

## Performance

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 071 | TTL + versionamento em `Database.js` (cache sessionStorage)       | O      | P1  | 3h  | todo   | 71          |
| 072 | CommandRegistry: lazy-load + paginação + cancel tokens            | O      | P2  | 4h  | todo   | 72          |
| 073 | `Dev.write` env-gated em vez de state Vuex (no RAF loop)          | S      | P2  | 0.5h| todo   | 73          |
| 074 | Substituir `setInterval(100ms)` em `Alert.js` por watcher         | S      | P2  | 1h  | todo   | 74          |
| 077 | Tornar `Liturgy.migrate()` async no boot, com feedback            | S      | P2  | 1h  | todo   | 77          |
| 078 | Memoization de `computed` que retornam novos arrays/objetos        | H      | P3  | 4h  | todo   | 78          |
| 079 | Adicionar `loading="lazy"` em imagens                             | S      | P3  | 1h  | todo   | 79          |
| 080 | Auditar e ajustar Service Worker (offline-first vs network-first) | O      | P2  | 3h  | todo   | 80          |

---

## Segurança

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 081 | Sanitizar inputs em `Path.db()` e `Path.file()`                   | S      | P1  | 1h  | todo   | 81          |
| 082 | Substituir `v-html` em CommandPalette (highlight via DOM)         | S      | P2  | 1h  | todo   | 82          |
| 085 | Garantir `noopener,noreferrer` em popups                          | S      | P2  | 0.5h| todo   | 85          |
| 086 | Configurar CSP / headers de segurança (PWA web)                   | O      | P2  | 3h  | todo   | 86          |
| 087 | Confirmar que `basic-ftp` está no main process do Electron        | S      | P0  | 0.5h| todo   | 87          |

---

## Convenções, dead-code e docs

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 095 | Padronizar nomenclatura `interface/` vs `components/`             | S      | P3  | 2h  | todo   | 95          |
| 096 | Padronizar capitalização de arquivos (Index.vue vs index.vue)     | S      | P3  | 1h  | todo   | 96          |
| 097 | Padronizar imports relativos vs alias `@`                         | S      | P3  | 1h  | todo   | 97          |
| 098 | Decidir: `modules/core/` permanece ou achata                      | S      | P3  | 0.5h| todo   | 98          |
| 105 | Refatorar `state.js` (`module_group` pre-declarado)               | S      | P3  | 0.5h| todo   | 105         |
| 106 | Limpar comentários de rationale antigos                           | S      | P3  | 0.5h| todo   | 106         |
| 107 | Confirmar zero refs a TrayArea/Header/Apps/AppsRibbon/Menu/Main   | S      | P1  | 0.5h| todo   | 107         |
| 108 | Criar `CONTRIBUTING.md` (fluxo de criação de módulo)              | O      | P2  | 2h  | todo   | 108         |
| 109 | Criar `ARCHITECTURE.md` (camadas, composables vs helpers)         | O      | P2  | 4h  | todo   | 109         |
| 110 | Atualizar README com onboarding humano                            | S      | P3  | 1h  | todo   | 110         |
| 111 | Documentar BroadcastChannel schemas (depois de #015)              | S      | P2  | 1h  | todo   | 111         |
| 112 | Documentar variáveis de ambiente Vite                             | S      | P2  | 0.5h| todo   | 112         |

---

## Electron / Desktop

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 114 | `assertHydrated()` em `Storage.set/get` no Electron               | S      | P1  | 1h  | todo   | 114         |
| 116 | Confirmar BroadcastChannel cross-window em Electron + alternativa | O      | P1  | 4h  | todo   | 116         |
| 117 | Validar latência <50ms slide_change Operator→Projection           | O      | P2  | 4h  | todo   | 117         |
| 118 | Resolver conflito globalShortcut vs Hotkeys in-window             | O      | P1  | 2h  | todo   | 118         |

---

## Bugs e code smells pontuais

| ID  | Task                                                              | Modelo | Pri | Est | Status | Cobre items |
|-----|-------------------------------------------------------------------|--------|-----|-----|--------|-------------|
| 121 | Helper para `scrollIntoView()` (3 usos em liturgy)                | S      | P3  | 0.5h| todo   | 121         |
| 122 | `Media.open` cleanup completo em error path                       | S      | P2  | 1h  | todo   | 122         |
| 123 | `Media._loadingId` race no XHR else branch                        | S      | P2  | 1h  | todo   | 123         |
| 124 | Auditar duplicação MusicMenuTable vs DataTable                    | O      | P2  | 3h  | todo   | 124         |
| 125 | Bible: 3 watchers consecutivos chamando mesma função              | S      | P2  | 0.5h| todo   | 125         |
| 036 | Variantes de elevação/sombra como tokens                          | S      | P3  | 1h  | todo   | 36          |
| 039 | Documentar design system (`DESIGN.md`)                            | O      | P2  | 4h  | todo   | 39          |
| 048 | a11y: color/week/file inputs com descrição assistiva              | S      | P2  | 1h  | todo   | 48          |
| 055 | Validar idioma `es` end-to-end                                    | S      | P3  | 2h  | todo   | 55          |
| 059 | Travar versão Vue / decisão de upgrade                            | S      | P3  | 0.5h| todo   | 59          |
| 065 | Remover `browserslist` se inutilizado pelo Vite                   | S      | P3  | 0.25h| todo  | 65          |

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
- Sonnet, ≤1h, P0/P1: #007, #008, #102, #115, #084, #087
- Opus, alto valor estratégico: #016, #017, #058
- Híbrida, fundação para o resto: #015, #025, #045

**Tasks com arquivo detalhado pronto:**
- Onda 1 completa (em `tasks/done/`): #007, #008, #084, #099, #102, #103, #104, #115, #119, #120
- Onda 2 — Block A tooling: #066, #067, #068
- Onda 2 — Block B estratégico: #057, #014, #058 (pending-approval)
- Onda 2 — Block C CSS: #028, #029, #030, #031, #032, #033, #034, #037, #052
- Onda 2 — Block D Vite/deps: #060, #062, #064, #069, #070, #113
- Onda 3 exemplo Opus complexo (referência): #016
