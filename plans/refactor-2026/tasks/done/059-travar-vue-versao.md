---
id: 059
title: Travar versão Vue / decisão de upgrade
slug: travar-vue-versao
category: tooling
wave: bugs
model: sonnet
priority: P3
estimate_hours: 0.5
status: todo
depends_on: []
blocks: []
audit_items: [59]
---

# [059] Travar versão Vue

## Contexto

Vuetify travado em `~4.0.6` via ADR (#058 done). Vue está com `^3.x.x` — caret permite minor updates automáticos. Vue 3.4+ tem mudanças sutis em reatividade que podem afetar o app. Recomendado: travar versão minor explicitamente, com ADR.

## Objetivo

- `package.json` com Vue em range explícito (ex: `~3.4.x`).
- ADR documentando a decisão.

## Escopo

### Dentro
- Decidir versão Vue.
- Atualizar package.json.
- ADR.

### Fora
- **NÃO** fazer upgrade de Vue agora.

## Arquivos afetados

- [package.json](../../package.json)
- `docs/adr/0002-vue-versao.md` (criar).

## Plano de execução

1. Branch `chore/059-travar-vue`.
2. Verificar versão Vue atual: `npm ls vue`.
3. Atualizar package.json: `"vue": "~3.4.x"` (com x = atual).
4. Criar ADR justificando.
5. Commit: `[059] Pin Vue to current minor version + ADR`.

## Validação

- [ ] `package.json` Vue em range tilde.
- [ ] ADR criado.
- [ ] `npm run build` passa.

## Referências

- Item audit: #59.
- ADR exemplo: [docs/adr/0001-vuetify-versao-estavel.md](../../docs/adr/0001-vuetify-versao-estavel.md).
