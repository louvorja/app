---
id: 036
title: Variantes de elevação/sombra como tokens
slug: tokens-elevacao
category: design-system
wave: bugs
model: sonnet
priority: P3
estimate_hours: 1
status: todo
depends_on: []
blocks: []
audit_items: [36]
---

# [036] Tokens de elevação/sombra

## Contexto

`box-shadow: 0 2px 8px rgba(0,0,0,0.15)` aparece hardcoded em vários componentes (cards, modais, dropdowns). Tokens CSS já existem para cores (#028) — falta a categoria de elevação.

## Objetivo

- Tokens `--lj-shadow-1`, `--lj-shadow-2`, `--lj-shadow-3` em `tokens.css`.
- Componentes usam o token.

## Escopo

### Dentro
- Definir 3-5 níveis de elevação.
- Audit + substituição.

### Fora
- **NÃO** mudar o visual — manter sombras existentes.

## Arquivos afetados

- [src/assets/styles/tokens.css](../../src/assets/styles/tokens.css)
- Múltiplos `.vue` com box-shadow hardcoded.

## Plano de execução

1. Branch `design/036-tokens-elevacao`.
2. Definir tokens:
   ```css
   --lj-shadow-1: 0 1px 3px rgba(0,0,0,0.1);
   --lj-shadow-2: 0 2px 8px rgba(0,0,0,0.15);
   --lj-shadow-3: 0 4px 16px rgba(0,0,0,0.2);
   ```
3. Audit:
   ```bash
   grep -rn "box-shadow.*rgba" src/ --include="*.vue" --include="*.css"
   ```
4. Substituir por `var(--lj-shadow-N)`.
5. Visual diff: comparar antes/depois (ou Percy se #090 done).
6. Commit: `[036] Add elevation tokens and replace hardcoded shadows`.

## Validação

- [ ] `grep -rn "box-shadow.*rgba" src/` retorna 0 fora de tokens.css.
- [ ] Visual idêntico.

## Referências

- Item audit: #36.
- Task #028 — tokens de cor.
