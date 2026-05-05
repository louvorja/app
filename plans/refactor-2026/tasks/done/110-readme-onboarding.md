---
id: 110
title: Atualizar README com onboarding humano
slug: readme-onboarding
category: docs
wave: convencao
model: sonnet
priority: P3
estimate_hours: 1
status: done
depends_on: [108, 109]
blocks: []
audit_items: [110]
---

# [110] README onboarding

## Contexto

README atual é minimalista — descreve o projeto mas não tem onboarding para devs novos. Após CONTRIBUTING.md (#108) e ARCHITECTURE.md (#109), README deve ser landing page que aponta para os documentos certos.

## Objetivo

- README com seções: O que é, Quick start, Estrutura, Links para CLAUDE/CONTRIBUTING/ARCHITECTURE/ADRs.
- Screenshot ou GIF da UI (opcional).

## Escopo

### Dentro
- Reescrever README como entry point.
- Linkar todos os docs principais.

### Fora
- **NÃO** duplicar conteúdo de CONTRIBUTING/ARCHITECTURE.

## Arquivos afetados

- `README.md`.

## Plano de execução

1. Branch `docs/110-readme`.
2. Estrutura:
   - O que é LouvorJA (1 parágrafo).
   - Screenshot/GIF (opcional).
   - Quick start (clone + npm install + npm run dev).
   - Stack.
   - Links: CLAUDE.md, CONTRIBUTING.md, ARCHITECTURE.md, docs/adr/.
   - Licença.
3. Commit: `[110] Refresh README as project landing page`.

## Validação

- [ ] README < 100 linhas (foco em entry point).
- [ ] Todos os links funcionam.

## Referências

- Item audit: #110.
