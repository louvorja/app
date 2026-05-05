---
id: 096
title: Padronizar capitalização de arquivos (Index.vue vs index.vue)
slug: capitalizacao-arquivos
category: convencao
wave: convencao
model: sonnet
priority: P3
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: [96]
---

# [096] Capitalização consistente

## Contexto

O projeto mistura `Index.vue` (capital), `index.js` (lowercase), e às vezes `index.vue` (lowercase) — provavelmente por copy-paste de templates diferentes. Em filesystems case-sensitive (Linux CI, Mac com APFS case-sensitive), trocar de Index.vue → index.vue silenciosamente quebra imports. Em Windows/Mac case-insensitive funciona, escondendo o bug.

Convenção a definir e aplicar:
- Componentes Vue: PascalCase (`Index.vue`, `LiturgyItem.vue`).
- Helpers e config JS: camelCase ou PascalCase (`helpers/Database.js`, `Storage.js` já é PascalCase).
- `index.js` (entry point de módulo): lowercase — convenção Node.

## Objetivo

- Todos os componentes Vue em PascalCase.
- Todos os `index.js` em lowercase.
- `git mv` aplicado para case-sensitivity correta no Git.

## Escopo

### Dentro
- Renomear arquivos `.vue` em lowercase para PascalCase via `git mv`.
- Verificar que CI Linux passa.

### Fora
- **NÃO** alterar convenção dos helpers (já é PascalCase).

## Arquivos afetados

- Audit: `find src/ -name "index.vue"`.

## Plano de execução

1. Branch `chore/096-capitalizacao`.
2. Inventariar:
   ```bash
   find src/ -name "index.vue"
   find src/ -name "Index.js"
   ```
3. `git mv index.vue Index.vue` em duas etapas (case-insensitive FS):
   ```bash
   git mv index.vue index.vue.tmp && git mv index.vue.tmp Index.vue
   ```
4. Atualizar imports.
5. CI Linux deve passar.
6. Commit: `[096] Standardize file capitalization (PascalCase for Vue components)`.

## Validação

- [ ] `find src/ -name "index.vue"` retorna 0.
- [ ] `npm run build` passa em macOS e Linux.

## Notas pós-execução

Auditoria completa realizada em 2026-05-05. `find src/ -name "index.vue"` retornou 0 resultados — todos os componentes Vue já estavam em PascalCase e todos os entry points `index.js` já estavam em lowercase. Nenhuma renomeação necessária. Build e lint passaram sem erros.

## Referências

- Item audit: #96.
