---
id: 073
title: Dev.write env-gated em vez de state Vuex
slug: dev-write-env-gated
category: performance
wave: performance
model: sonnet
priority: P2
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [73]
---

# [073] Dev.write env-gated

## Contexto

`Dev.js` armazena logs de desenvolvimento em estado Vuex (`dev_logs` array). Em produção, a flag `Dev.is_active` deveria evitar escrita, mas mesmo verificando a flag, o overhead de Vuex commit é cobrado em loops de RAF (slide updates rodam ~60Hz). Cada `Dev.write()` no path do RAF causa thrashing desnecessário.

A solução: gate por `import.meta.env.DEV` — em produção, `Dev.write` é tree-shaked completamente.

## Objetivo

- `Dev.write()` é no-op em produção (sem custo de Vuex commit).
- Logs continuam funcionando em dev mode.

## Escopo

### Dentro
- Adicionar `if (!import.meta.env.DEV) return;` no início de `Dev.write()`.
- Manter `Dev.toggle()` funcional em produção (UI).

### Fora
- **NÃO** remover o módulo `dev` da UI.

## Arquivos afetados

- [src/helpers/Dev.js](../../src/helpers/Dev.js)

## Plano de execução

1. Branch `perf/073-dev-write-env-gated`.
2. Em `Dev.write(...)`:
   ```js
   if (!import.meta.env.DEV) return;
   // resto do código
   ```
3. Verificar bundle de produção: `Dev.write` calls existem mas viram no-ops.
4. Commit: `[073] Dev.write no-op in production`.

## Validação

- [x] `if (!import.meta.env.DEV) return;` adicionado como primeira linha de `write()`.
- [x] `npm run build` passa — Vite tree-shakes o corpo de `write()` em produção.
- [x] `toggle()` permanece funcional em produção (não tem guard de env).
- [x] Em dev, logs continuam funcionando normalmente (guard não ativa).

## Referências

- Item audit: #73.
- [src/helpers/Dev.js](../../src/helpers/Dev.js)
