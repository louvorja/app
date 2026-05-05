---
id: 105
title: Refatorar state.js (module_group pre-declarado)
slug: state-module-group
category: convencao
wave: convencao
model: sonnet
priority: P3
estimate_hours: 0.5
status: done
depends_on: [003]
blocks: []
audit_items: [105]
---

# [105] state.js — module_group pre-declarado

## Contexto

`src/store/state.js` declara um campo `module_group` ou similar inicial pré-populado de forma confusa (provavelmente um remanescente de versão antiga). Estrutura cresceu organicamente sem refator. Após #003 (Pinia), o state vai mudar de qualquer forma — esta task limpa a estrutura no caminho.

## Objetivo

- `state.js` (ou estado Pinia equivalente) tem estrutura limpa e documentada.
- Campos não-utilizados removidos.
- Estrutura inicial mínima — populada via actions na boot.

## Escopo

### Dentro
- Audit do state inicial.
- Remover campos mortos.
- JSDoc/TS interface do state.

### Fora
- **NÃO** mudar lógica de estado — apenas estrutura inicial.

## Arquivos afetados

- [src/store/state.js](../../src/store/state.js) (ou `src/stores/appStore.js` após #003)

## Plano de execução

1. Branch `chore/105-state-cleanup`.
2. Ler state.js inteiro.
3. Identificar campos pré-declarados que nunca são lidos (grep + audit manual).
4. Remover.
5. Documentar campos restantes.
6. Smoke: app boota normalmente.
7. Commit: `[105] Clean up state.js structure`.

## Validação

- [ ] Cada campo do state inicial tem JSDoc.
- [ ] `npm run build` passa.
- [ ] Smoke completo: tema, idioma, módulos.

## Referências

- Item audit: #105.
