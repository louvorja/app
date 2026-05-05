---
id: 121
title: Helper para scrollIntoView() (3 usos em liturgy)
slug: helper-scroll-into-view
category: bug
wave: bugs
model: sonnet
priority: P3
estimate_hours: 0.5
status: todo
depends_on: [017]
blocks: []
audit_items: [121]
---

# [121] Helper scrollIntoView()

## Contexto

`liturgy/Index.vue` tem 3 usos de `el.scrollIntoView({ behavior: 'smooth', block: 'center' })` com pequenas variações. Pattern repetitivo — ideal para helper compartilhado.

## Objetivo

- Helper `scrollToElement(el, options)` em `helpers/Dom.js` ou composable.
- Liturgy usa o helper, removendo duplicação.

## Escopo

### Dentro
- Criar helper.
- Substituir os 3 usos.

### Fora
- **NÃO** procurar usos em outros módulos (escopo limitado a liturgy).

## Arquivos afetados

- `src/helpers/Dom.js` ou `src/composables/useScroll.js` (criar)
- [src/modules/core/liturgy/](../../src/modules/core/liturgy/) componentes

## Plano de execução

1. Branch `chore/121-scroll-helper`.
2. Criar helper:
   ```js
   export function scrollToElement(el, opts = {}) {
     if (!el) return;
     el.scrollIntoView({ behavior: 'smooth', block: 'center', ...opts });
   }
   ```
3. Substituir os 3 usos em liturgy.
4. Commit: `[121] Extract scrollToElement helper`.

## Validação

- [ ] `grep -n "scrollIntoView" src/modules/core/liturgy/` retorna 0 (todos passam pelo helper).
- [ ] Smoke: scroll em liturgy funciona normalmente.

## Referências

- Item audit: #121.
- Pré-requisito: #017 (refactor liturgy concluído).
