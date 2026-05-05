---
id: 124
title: Auditar duplicação MusicMenuTable vs DataTable
slug: music-menu-vs-datatable
category: refactor
wave: bugs
model: opus
priority: P2
estimate_hours: 3
status: done
depends_on: []
blocks: []
audit_items: [124]
---

# [124] MusicMenuTable vs DataTable

## Contexto

`src/components/DataTable.vue` e `src/components/MusicMenuTable.vue` parecem ter duplicação significativa — paginação, busca, ordenação. MusicMenuTable é DataTable + lógica de "selecionar música/abrir player".

Possibilidades:
1. MusicMenuTable estende DataTable via slot/props.
2. Há duplicação real que pode ser eliminada via composable `useDataTable`.
3. Justificada por diferença real — documentar.

## Objetivo

- Audit das diferenças.
- Decisão: refatorar (extrair composable) ou documentar (justificativa).

## Escopo

### Dentro
- Diff manual entre os dois componentes.
- Implementar refactor se aplicável.

### Fora
- **NÃO** refatorar outros componentes na auditoria.

## Arquivos afetados

- [src/components/DataTable.vue](../../src/components/DataTable.vue)
- [src/components/MusicMenuTable.vue](../../src/components/MusicMenuTable.vue)

## Plano de execução

1. Branch `refactor/124-data-table-audit`.
2. Diff manual: o que MusicMenuTable adiciona ou modifica em relação a DataTable.
3. Se duplicação alta: extrair `useDataTable.js` composable + usar nos dois.
4. Se diferença legítima: documentar via JSDoc no topo de cada arquivo.
5. Smoke: módulo musics + outros que usam DataTable funcionam normalmente.
6. Commit: `[124] Audit/refactor MusicMenuTable vs DataTable`.

## Validação

- [ ] Decisão registrada.
- [ ] Se refatorado: ambos funcionam.
- [ ] `npm run build` passa.

## Referências

- Item audit: #124.
