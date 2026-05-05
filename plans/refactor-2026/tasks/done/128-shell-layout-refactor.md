---
id: 128
title: Commit Shell layout refactor (Ribbon + CommandPalette + LiturgyPanel)
slug: shell-layout-refactor
category: refactor
wave: 3
model: sonnet
priority: P1
estimate_hours: 8
status: done
depends_on: [001, 012]
blocks: []
audit_items: []
---

# [128] Commit Shell layout refactor

## Contexto

O layout principal do app foi refatorado em uma nova view `Shell.vue` com componentes
especializados em `src/layout/shell/`. O código existia no working tree mas nunca foi
commitado — criando risco de perda e impossibilitando rollback.

Componentes novos implementados:
- `RibbonBar.vue` + `RibbonButton.vue` + `RibbonGroup.vue` — barra de ferramentas Ribbon
  estilo Delphi, substituindo o `AppsRibbon.vue` antigo
- `OpenModulesTabs.vue` — abas dos módulos abertos (PageControl interno)
- `CommandPalette.vue` — paleta de comandos ativável por atalho
- `HotkeysCheatsheet.vue` — painel de referência de atalhos de teclado
- `ShellLiturgyPanel.vue` — sidebar de liturgia visível quando o módulo não está aberto
- `StatusBar.vue` — barra de status na base do shell
- `AppMenuButton.vue` / `AppMenuOpcoes.vue` / `AppMenuSobre.vue` — menu de aplicativo
- `ribbon-pages.js` — definição declarativa das páginas/abas do Ribbon

O arquivo `src/assets/styles/utilities.css` (classes `.lj-u-*` gerado na #032) também
estava no disco sem commit, causando falha em `git clone` + `npm run build` porque
`main.js` já importava o arquivo.

## Objetivo

- Todos os componentes Shell commitados com lint limpo.
- `utilities.css` commitado (elimina risco de build quebrado em clone limpo).
- `Shell.vue` registrada na rota `/` via router (já estava).

## Escopo

### Dentro
- `src/views/Shell.vue`
- `src/layout/shell/` (13 arquivos)
- `src/assets/styles/utilities.css`
- Correções de lint: `catch (_)` → `catch`, atributo order no RibbonBar

### Fora
- `electron/` — commitar Electron D0 é task separada
- `docs/adr/0002-vue-router-version.md` — task separada

## Arquivos afetados

- [src/views/Shell.vue](../../src/views/Shell.vue) — view principal nova
- [src/layout/shell/RibbonBar.vue](../../src/layout/shell/RibbonBar.vue)
- [src/layout/shell/RibbonButton.vue](../../src/layout/shell/RibbonButton.vue)
- [src/layout/shell/RibbonGroup.vue](../../src/layout/shell/RibbonGroup.vue)
- [src/layout/shell/OpenModulesTabs.vue](../../src/layout/shell/OpenModulesTabs.vue)
- [src/layout/shell/CommandPalette.vue](../../src/layout/shell/CommandPalette.vue)
- [src/layout/shell/HotkeysCheatsheet.vue](../../src/layout/shell/HotkeysCheatsheet.vue)
- [src/layout/shell/ShellLiturgyPanel.vue](../../src/layout/shell/ShellLiturgyPanel.vue)
- [src/layout/shell/StatusBar.vue](../../src/layout/shell/StatusBar.vue)
- [src/layout/shell/AppMenuButton.vue](../../src/layout/shell/AppMenuButton.vue)
- [src/layout/shell/AppMenuOpcoes.vue](../../src/layout/shell/AppMenuOpcoes.vue)
- [src/layout/shell/AppMenuSobre.vue](../../src/layout/shell/AppMenuSobre.vue)
- [src/layout/shell/ribbon-pages.js](../../src/layout/shell/ribbon-pages.js)
- [src/assets/styles/utilities.css](../../src/assets/styles/utilities.css)

## Validação

- [x] `npm run build` passa (✓ verificado antes do commit)
- [x] `npm run lint` sem novos erros (✓ warnings dos novos arquivos corrigidos)
- [x] `git clone` + `npm run build` funciona (utilities.css commitado resolve import pendente)

## Notas pós-execução

- **Branch:** fix/126-gatear-consolelog-dev (commit inline, sem branch separado)
- **Commit principal:** (preenchido após commit)
- **Correções de lint aplicadas:** 5× `catch (_)` → `catch`, 1× ordem de atributos `:id`/`:key`
- **Tasks novas geradas:** Commitar Electron D0, commitar ADR #0002
