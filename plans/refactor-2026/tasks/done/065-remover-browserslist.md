---
id: 065
title: Remover browserslist se inutilizado pelo Vite
slug: remover-browserslist
category: dead-code
wave: bugs
model: sonnet
priority: P3
estimate_hours: 0.25
status: todo
depends_on: []
blocks: []
audit_items: [65]
---

# [065] Remover browserslist

## Contexto

`package.json` tem campo `"browserslist"` ou arquivo `.browserslistrc`. Vite usa `esbuild` e tem config própria via `build.target` — não consulta browserslist. Configuração morta.

## Objetivo

- Remover `browserslist` se confirmado que Vite não usa.

## Escopo

### Dentro
- Confirmar que Vite não consulta browserslist.
- Remover o campo.

### Fora
- **NÃO** alterar `vite.config.js` nesta task.

## Arquivos afetados

- [package.json](../../package.json)
- `.browserslistrc` (se existir)

## Plano de execução

1. Branch `chore/065-remove-browserslist`.
2. Verificar se há plugins Vite que consomem browserslist (`@vitejs/plugin-legacy` usa, mas raro).
3. Se nenhum plugin usa: remover.
4. `npm run build` passa.
5. Commit: `[065] Remove unused browserslist config`.

## Validação

- [ ] `package.json` sem `browserslist`.
- [ ] `npm run build` passa.

## Referências

- Item audit: #65.
