---
id: 097
title: Padronizar imports relativos vs alias @
slug: imports-alias
category: convencao
wave: convencao
model: sonnet
priority: P3
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: [97]
---

# [097] Imports com alias

## Contexto

Após #064 (aliases Vite adicionados), parte do projeto usa `@/helpers/Database` mas ainda há imports relativos como `../../../helpers/Database`. Inconsistência dificulta refactor (mover arquivos quebra paths relativos profundos).

Regra: imports cruzando 2+ níveis usar alias. Imports do mesmo diretório ou irmão direto, relativos.

## Objetivo

- Imports com `../../` ou mais virtualmente substituídos por aliases.
- ESLint rule `no-restricted-imports` ou similar pode validar.

## Escopo

### Dentro
- Audit + substituição em `.vue` e `.js`.
- Configurar lint rule (opcional).

### Fora
- **NÃO** substituir imports `./X` (mesmo dir) — manter relativos.

## Arquivos afetados

- Múltiplos `.vue` e `.js`.

## Plano de execução

1. Branch `chore/097-imports-alias`.
2. Audit:
   ```bash
   grep -rn "from ['\"]\.\./\.\./" src/ --include="*.vue" --include="*.js"
   ```
3. Mapear cada path relativo profundo para alias:
   - `../../../helpers/X` → `@/helpers/X` ou `@helpers/X`.
   - `../../components/Y` → `@/components/Y` ou `@components/Y`.
4. Adicionar regra ESLint (opcional):
   ```js
   'no-restricted-imports': ['error', { patterns: ['../../*'] }]
   ```
5. Commit: `[097] Standardize deep imports to use Vite aliases`.

## Validação

- [ ] `grep -rn "from ['\"]\.\./\.\./" src/` retorna 0.
- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.

## Referências

- Item audit: #97.
- Task #064 — aliases já configurados.
