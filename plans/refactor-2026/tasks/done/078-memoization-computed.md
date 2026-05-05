---
id: 078
title: Memoization de computed que retornam novos arrays/objetos
slug: memoization-computed
category: performance
wave: performance
model: hybrid
priority: P3
estimate_hours: 4
status: done
depends_on: []
blocks: []
audit_items: [78]
---

# [078] Memoization em computeds

## Contexto

Diversos `computed` no projeto retornam `array.filter(...)`, `array.map(...)` ou `Object.fromEntries(...)` — cada acesso retorna uma referência nova mesmo quando o input é idêntico. Isso quebra `v-memo` e força re-render desnecessário em listas grandes (musics, liturgy items, history).

## Objetivo

- Auditar computeds que retornam arrays/objetos novos.
- Para os casos quentes (DataTable, MusicMenuTable), aplicar memoization.

## Escopo

### Dentro
- Audit via `grep` em `.vue`.
- Top 5 computeds mais executados → `useMemoize` (vueuse) ou cache manual.

### Fora
- **NÃO** memoizar todos — apenas os que aparecem em listas grandes.

## Arquivos afetados

- Componentes Vue identificados durante audit (DataTable, MusicMenuTable, liturgy/Index).

## Plano de execução

1. Branch `perf/078-memoization-computed`.
2. Audit:
   ```bash
   grep -rn "computed:" src/ --include="*.vue" | grep -E "filter|map|Object\."
   ```
3. Para cada computed quente: medir com Vue DevTools Profiler antes/depois.
4. Aplicar `useMemoize` de `@vueuse/core` se já estiver no projeto, senão cache manual.
5. Smoke: lista de músicas com 1000+ items, paginação fluida.
6. Commit: `[078] Memoize hot computeds in DataTable, MusicMenuTable`.

## Validação

- [ ] Vue DevTools Profiler: re-render de DataTable cai em ~50%+.
- [ ] `npm run build` passa.

## Riscos / atenções

- **Memoization mal aplicada**: cache que nunca invalida = bug. Garantir que keys do cache cobrem todas as deps.

## Referências

- Item audit: #78.
- [@vueuse/core useMemoize](https://vueuse.org/shared/useMemoize/).
