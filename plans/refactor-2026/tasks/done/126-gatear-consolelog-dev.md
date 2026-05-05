---
id: 126
title: Gatear console.log de desenvolvimento com import.meta.env.DEV
slug: gatear-consolelog-dev
category: dead-code
wave: bugs
model: sonnet
priority: P1
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: []
---

# [126] Gatear console.log de desenvolvimento com import.meta.env.DEV

## Contexto

A auditoria pós-refactor identificou 20 ocorrências de `console.log` não-gateados
em arquivos de produção (`src/`). Em produção, essas chamadas poluem o console do
usuário final e podem vazar informações de estado interno.

Os casos se dividem em 4 grupos:

**Grupo A — `BaseModule.onInstall()` duplicado em 12 módulos**
`BaseModule.js:28` já tem `console.log(...)` em `onInstall()`. Cada um dos 12
módulos (bible, remote_control, lyric, hymnal, animation, theme, dev, collections,
album, musics, base_module, media) sobrescreve `onInstall()` com o log **idêntico**,
sem chamar `super.onInstall()`. Resultado: o log do BaseModule nunca executa, e cada
módulo duplica código desnecessário.

**Grupo B — Helpers de atalhos**
`Hotkeys.js:195`, `Shortcuts.js:81` e `Shortcuts.js:92` logam registro/remoção de
listeners em toda inicialização — excessivo em produção.

**Grupo C — Debug solto**
`remote_control/Index.vue:122`: `console.log(data)` após resposta de API — debug
claro, não tem utilidade em produção.
`transmission/Index.vue:345`: `console.log('[Transmission] Identificando...')` — log
de diagnóstico, deve ser DEV-only.
`AppData.ts:94`: `console.log(e)` em bloco `catch` — nível errado; deve ser `console.error`.

**Grupo D — Wrapper de animação**
`animation/scripts/log.js`: wrapper nu em torno de `console.log`, usado em
`ShowAnimation.vue` e `EditAnimation.vue`. Deve ser gateado.

## Objetivo

- `BaseModule.onInstall()` gateado com `import.meta.env.DEV`.
- Os 12 `onInstall()` duplicados nos módulos removidos (dead code).
- `Hotkeys.js`, `Shortcuts.js`, `transmission/Index.vue` logs gateados com `import.meta.env.DEV`.
- `remote_control/Index.vue:122` `console.log(data)` removido.
- `AppData.ts:94` `console.log(e)` → `console.error(e)`.
- `animation/scripts/log.js` gateado com `import.meta.env.DEV`.

## Escopo

### Dentro
- `src/modules/BaseModule.js` — gatear log em `onInstall()`
- `src/modules/*/index.js` (12 arquivos) — remover `onInstall()` duplicado
- `src/helpers/Hotkeys.js` — gatear log linha 195
- `src/helpers/Shortcuts.js` — gatear logs linhas 81 e 92
- `src/modules/remote_control/components/Index.vue` — remover `console.log(data)` linha 122
- `src/modules/transmission/components/Index.vue` — gatear log linha 345
- `src/helpers/AppData.ts` — trocar `console.log(e)` por `console.error(e)` linha 94
- `src/modules/animation/scripts/log.js` — gatear com `import.meta.env.DEV`

### Fora
- Não alterar lógica funcional de nenhum módulo.
- Não tocar em `Dev.js` (já gateado corretamente).
- Não tocar em `Storage.js` (já gateado).
- Não alterar `animation/dependencies/animejs/` (terceiro).

## Arquivos afetados

- [src/modules/BaseModule.js](../../src/modules/BaseModule.js)
- [src/modules/bible/index.js](../../src/modules/bible/index.js)
- [src/modules/remote_control/index.js](../../src/modules/remote_control/index.js)
- [src/modules/lyric/index.js](../../src/modules/lyric/index.js)
- [src/modules/hymnal/index.js](../../src/modules/hymnal/index.js)
- [src/modules/animation/index.js](../../src/modules/animation/index.js)
- [src/modules/theme/index.js](../../src/modules/theme/index.js)
- [src/modules/dev/index.js](../../src/modules/dev/index.js)
- [src/modules/collections/index.js](../../src/modules/collections/index.js)
- [src/modules/album/index.js](../../src/modules/album/index.js)
- [src/modules/musics/index.js](../../src/modules/musics/index.js)
- [src/modules/base_module/index.js](../../src/modules/base_module/index.js)
- [src/modules/media/index.js](../../src/modules/media/index.js)
- [src/helpers/Hotkeys.js](../../src/helpers/Hotkeys.js)
- [src/helpers/Shortcuts.js](../../src/helpers/Shortcuts.js)
- [src/helpers/AppData.ts](../../src/helpers/AppData.ts)
- [src/modules/remote_control/components/Index.vue](../../src/modules/remote_control/components/Index.vue)
- [src/modules/transmission/components/Index.vue](../../src/modules/transmission/components/Index.vue)
- [src/modules/animation/scripts/log.js](../../src/modules/animation/scripts/log.js)

## Pré-requisitos

- Nenhuma dependência de outras tasks.

## Plano de execução

1. Branch `fix/126-gatear-consolelog-dev`.
2. **BaseModule.js** — envolver o log em `onInstall()` com `if (import.meta.env.DEV)`.
3. **12 módulos** — remover o método `onInstall()` inteiro (BaseModule já cobre).
4. **Hotkeys.js:195** — envolver com `if (import.meta.env.DEV)`.
5. **Shortcuts.js:81,92** — envolver cada log com `if (import.meta.env.DEV)`.
6. **remote_control/Index.vue:122** — remover linha `console.log(data)`.
7. **transmission/Index.vue:345** — envolver com `if (import.meta.env.DEV)`.
8. **AppData.ts:94** — trocar `console.log(e)` por `console.error(e)`.
9. **animation/scripts/log.js** — gatear com `if (import.meta.env.DEV)`.
10. Verificar que não sobraram logs não-gateados:
    ```bash
    grep -rn "console\.log" src/ --include="*.vue" --include="*.ts" --include="*.js" \
      | grep -v "import\.meta\.env" | grep -v "Dev\.js" | grep -v "Storage\.js" \
      | grep -v "anime\."
    ```
11. `npm run build` → exit 0.
12. `npm run lint` → exit 0.
13. Atualizar status no BACKLOG.md.
14. Commit `[126] Gate dev-only console.log behind import.meta.env.DEV`.

## Validação

- [ ] `grep -rn "console\.log" src/ --include="*.vue" --include="*.ts" --include="*.js" | grep -v "import\.meta\.env" | grep -v "Dev\.js" | grep -v "Storage\.js" | grep -v "anime\."` retorna somente `animation/scripts/log.js` (que agora está gateado) e `AppData.ts` (que agora usa `console.error`).
- [ ] `npm run build` exit 0.
- [ ] `npm run lint` exit 0.
- [ ] App abre normalmente em `npm run dev` (sem erros de JS no console em modo prod build).

## Riscos / atenções

- Remover `onInstall()` dos módulos é seguro: eles não chamam `super.onInstall()` e
  o único efeito era o log (que agora fica em BaseModule).
- `animation/scripts/log.js` é usado em dois modais; após gatear, os logs de animação
  simplesmente não aparecerão em produção — comportamento desejado.
- `console.error(e)` em `AppData.ts` mantém o catch funcional mas com nível correto.

## Referências

- Auditoria interna 2026-05-05.

---

## Notas pós-execução

- **Branch:** fix/126-gatear-consolelog-dev
- **PR:** —
- **Commit principal:** —
- **Surpresas durante a execução:** —
- **Tasks novas geradas:** —
- **O que ficou para depois:** —
