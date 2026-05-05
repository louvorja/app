---
id: 106
title: Limpar comentários de rationale antigos
slug: comentarios-rationale
category: dead-code
wave: convencao
model: sonnet
priority: P3
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [106]
---

# [106] Limpar comentários de rationale antigos

## Contexto

O código tem comentários explicando "por que" decisões antigas foram tomadas — referências a issues fechadas, fixes de bugs já não-existentes, ou TODOs de 2022. Code rot.

Critério: se o comentário descreve uma situação que não existe mais no código atual, removê-lo. Se o comentário documenta uma invariante que não é óbvia, manter.

## Objetivo

- Comentários obsoletos removidos.
- Comentários úteis (não-óbvios) mantidos.

## Escopo

### Dentro
- Audit de comentários `// fixme`, `// hack`, `// old`, `// remove`.
- Audit de blocos comentados de código (já parcialmente em #104).

### Fora
- **NÃO** remover JSDoc nem comentários de invariantes.

## Arquivos afetados

- Audit em todo `src/`.

## Plano de execução

1. Branch `chore/106-rationale-comments`.
2. Audit:
   ```bash
   grep -rn "// fixme\|// hack\|// remove\|// old\|// TODO.*201[0-9]" src/
   ```
3. Avaliar caso a caso. Remover se obsoleto.
4. Commit: `[106] Remove stale rationale comments`.

## Validação

- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.

## Referências

- Item audit: #106.
- Task #104 — limpeza similar.
