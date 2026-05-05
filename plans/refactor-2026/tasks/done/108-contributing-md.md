---
id: 108
title: Criar CONTRIBUTING.md (fluxo de criação de módulo)
slug: contributing-md
category: docs
wave: convencao
model: opus
priority: P2
estimate_hours: 2
status: done
depends_on: []
blocks: []
audit_items: [108]
---

# [108] CONTRIBUTING.md

## Contexto

Sem CONTRIBUTING.md, devs novos olham o código existente e replicam padrões — alguns deles ultrapassados. Documentar fluxo padrão evita drift.

Tópicos críticos:
1. Como criar um novo módulo (passo-a-passo: manifest, index.js, components/, lang/, registrar).
2. Convenções de PR e commit (já parcial em CLAUDE.md).
3. Como rodar testes (após #088).
4. Estrutura de branches.
5. Onde abrir issues.

## Objetivo

- `CONTRIBUTING.md` na raiz do projeto.
- Inclui guia "Adicionando um módulo novo" com exemplo concreto.

## Escopo

### Dentro
- Estrutura de módulo, com snippets reais.
- Comandos para dev/build/test/lint.
- Padrões de commit.

### Fora
- **NÃO** documentar arquitetura completa (isso é #109).

## Arquivos afetados

- `CONTRIBUTING.md` (criar).

## Plano de execução

1. Branch `docs/108-contributing`.
2. Criar `CONTRIBUTING.md` com seções:
   - Pré-requisitos (Node, npm).
   - Comandos (`dev`, `build`, `lint`, `test`).
   - Criando um módulo novo (passos detalhados).
   - Convenções de commit (`[NNN] Ação no imperativo`).
   - Branches e PR flow.
   - Como abrir issue.
3. Commit: `[108] Add CONTRIBUTING.md with module creation guide`.

## Validação

- [ ] `CONTRIBUTING.md` existe na raiz.
- [ ] Contém guia de "Adicionando módulo" com exemplo.
- [ ] Linkado do README.

## Referências

- Item audit: #108.
- [CLAUDE.md](../../CLAUDE.md) seção "Convenções de Módulos".
