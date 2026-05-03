---
id: 082
title: Substituir v-html em CommandPalette por highlight via DOM
slug: vhtml-command-palette
category: seguranca
wave: seguranca
model: sonnet
priority: P2
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: [82]
---

# [082] Remover v-html do CommandPalette

## Contexto

A CommandPalette destaca o trecho que casou com a busca usando `<mark>` injetado via `v-html`. Mesmo que o input venha de fontes confiáveis (títulos de músicas), `v-html` é vetor de XSS se algum dia o banco for comprometido ou um manifest customizado for carregado.

Solução: renderizar via array de spans (texto pre-match + `<mark>` + texto post-match) em vez de string HTML.

## Objetivo

- Zero ocorrências de `v-html` na CommandPalette.
- Highlight visual continua idêntico ao usuário.

## Escopo

### Dentro
- Componente da CommandPalette — substituir `v-html` por template estruturado.

### Fora
- **NÃO** remover `v-html` em outros lugares — escopo focado.

## Arquivos afetados

- Componente CommandPalette (provavelmente `src/components/CommandPalette.vue` ou em layout/composables).

## Plano de execução

1. Branch `sec/082-vhtml-command-palette`.
2. Localizar `v-html` na CommandPalette:
   ```bash
   grep -rn "v-html" src/ --include="*.vue"
   ```
3. Refatorar para template:
   ```vue
   <span>
     {{ before }}<mark>{{ match }}</mark>{{ after }}
   </span>
   ```
4. Helper que separa match em `{ before, match, after }`.
5. Smoke: digitar busca, highlight aparece corretamente.
6. Commit: `[082] Replace v-html with structured template in CommandPalette`.

## Validação

- [x] `grep -n "v-html" src/layout/shell/CommandPalette.vue` retorna 0.
- [x] Highlight visual idêntico ao antes (template com `<mark>` + `<span>`).
- [x] `npm run build` passa.

## Referências

- Item audit: #82.
