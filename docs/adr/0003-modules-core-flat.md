# ADR 0003 — Achatar `modules/core/` para `modules/`

**Data:** 2026-05-05
**Responsável:** Juan Aleixo
**Status:** aceito

## Contexto

Os módulos do sistema viviam em `src/modules/core/<id>/`. A pasta `core/` foi criada
antecipando camadas futuras (`modules/contrib/`, `modules/plugins/`) para módulos
de terceiros ou extensões externas.

Esse futuro nunca se materializou: todos os 23 módulos existentes pertencem ao
`core/`, e não há item concreto no backlog nem no roadmap Desktop (D0–D10) que
planeje adicionar módulos contrib.

## Decisão

**Achatar a estrutura** — mover todos os módulos de `src/modules/core/<id>/` para
`src/modules/<id>/`, eliminando a pasta intermediária `core/`.

Critério de reconsideração da task #098: "se não há plano concreto de adicionar
contrib na próxima onda, achatar."

## Consequências

- Caminhos de import ficam mais curtos e diretos (`@modules/liturgy/` vs `@modules/core/liturgy/`).
- `ModuleManager.js` não muda — já usa `@/modules/**/index.js` (glob recursivo).
- `Modules.vue` simplifica: remove `_globCore` e a lógica de fallback duplo.
- `Popup.vue` simplifica: remove fallback para `@/modules/core/`.
- `CLAUDE.md` atualizado para refletir a nova estrutura.

## Quando reconsiderar

Se futuramente existir plano concreto de módulos contrib (plugins de terceiros,
marketplace), reintroduzir a pasta intermediária com convenção explícita
(ex.: `modules/official/` + `modules/community/`) e criar nova ADR.
