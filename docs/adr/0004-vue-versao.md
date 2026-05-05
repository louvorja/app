# ADR 0004 — Travar Vue na versão minor atual

**Data:** 2026-05-05
**Responsável:** Juan Aleixo
**Status:** aceito

## Contexto

O projeto declarava `"vue": "^3.5.29"` — o caret (`^`) permite minor updates automáticos (3.5 → 3.6, 3.7…).

Vue 3.4+ introduziu mudanças na reatividade (`watch` reavalia com semântica nova) e Vue 3.5 trouxe alterações em `defineProps` com generics e no comportamento de `onWatcherCleanup`. Bumps automáticos de minor podem quebrar silenciosamente comportamentos de composables existentes, em especial os que usam `watch` com flush imediato, `useMedia`, `usePlayer` e o ciclo de liturgia.

Vuetify já está travado em `~4.0.6` (ADR 0001). Manter Vue em `^` cria assimetria: o framework UI está estável mas o runtime pode mudar.

## Decisão

**Pin `~3.5.29`** — tilde permite apenas patches automáticos (`3.5.x`), bloqueando minor upgrades não planejados.

Versão instalada confirmada em `npm ls vue`:
```
vue@3.5.29
```

## Consequências

- `npm install` / `npm ci` nunca avançará além de `3.5.x` automaticamente.
- Upgrade para `3.6+` ou superior exigirá bump manual no `package.json`, revisão do changelog e execução do smoke E2E (Playwright).
- Nenhuma mudança de runtime — apenas a declaração de range.

## Quando reconsiderar

- Upgrade para `~3.6.x`: avaliar changelog (breaking changes em reatividade, Suspense, APIs de composable) e rodar suite Playwright antes de bumpar.
- Se patch Vue corrigir bug crítico além de `3.5.29`: aceitar patch automaticamente (tilde já cobre isso).
