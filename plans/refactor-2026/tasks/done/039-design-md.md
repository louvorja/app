---
id: 039
title: Documentar design system (DESIGN.md)
slug: design-md
category: docs
wave: bugs
model: opus
priority: P2
estimate_hours: 4
status: done
depends_on: [028, 032, 036]
blocks: []
audit_items: [39]
---

# [039] DESIGN.md

## Contexto

Os tokens CSS (#028), classes utilitárias (#032), e elevações (#036) formam um design system implícito. Falta documentação que liste tokens disponíveis, classes utilitárias, e padrões de uso.

## Objetivo

- `DESIGN.md` ou `docs/design-system.md` com:
  - Paleta de cores (tokens e quando usar cada).
  - Tipografia (fontes, tamanhos).
  - Espaçamento (scale).
  - Elevação (níveis).
  - Classes utilitárias (`.lj-u-*`).
  - Exemplos visuais.

## Escopo

### Dentro
- Documentação completa do design system.
- Snippets de código.

### Fora
- **NÃO** criar Storybook (escopo separado).

## Arquivos afetados

- `DESIGN.md` ou `docs/design-system.md` (criar).

## Plano de execução

1. Branch `docs/039-design-system`.
2. Inventariar tokens em `tokens.css`.
3. Inventariar utilitárias `.lj-u-*`.
4. Documentar com exemplos.
5. Commit: `[039] Add DESIGN.md documenting tokens, utilities, patterns`.

## Validação

- [ ] DESIGN.md cobre todos os tokens em tokens.css.
- [ ] Linkado do README.

## Referências

- Item audit: #39.
- Pré-requisitos: #028 (tokens), #032 (utilities), #036 (elevation).
