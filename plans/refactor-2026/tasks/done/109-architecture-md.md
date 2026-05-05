---
id: 109
title: Criar ARCHITECTURE.md (camadas, composables vs helpers)
slug: architecture-md
category: docs
wave: convencao
model: opus
priority: P2
estimate_hours: 4
status: todo
depends_on: [011]
blocks: []
audit_items: [109]
---

# [109] ARCHITECTURE.md

## Contexto

CLAUDE.md hoje mistura "estado atual" + "roadmap migração" + "convenções de módulos". Falta um documento focado em **arquitetura** — explicação detalhada das camadas, fluxo de dados, e padrões para tomada de decisão futura.

Tópicos a cobrir:
1. Visão geral (Vue 3 + Pinia + Vuetify + Vite).
2. Camadas: views → layout → módulos → componentes → composables → helpers → store.
3. Fronteira composable vs helper (após #011).
4. Estado: 3 camadas (Storage/AppData/UserData) — quando usar cada.
5. BroadcastChannel para janelas múltiplas.
6. Roteamento (rotas /projection, /obs, /operator).
7. Diagrama de fluxo (texto ASCII ou Mermaid).

## Objetivo

- `ARCHITECTURE.md` na raiz, ~300-500 linhas.
- Diagrama de camadas e fluxo de dados.
- Decisões arquiteturais documentadas.

## Escopo

### Dentro
- Documentação completa da arquitetura atual.
- Diagramas em Mermaid (renderizam no GitHub).
- Referências cruzadas para CLAUDE.md, ADRs, tasks.

### Fora
- **NÃO** roadmap futuro — isso é CLAUDE.md.
- **NÃO** documentação de cada módulo individual.

## Arquivos afetados

- `ARCHITECTURE.md` (criar).
- README.md (linkar).

## Plano de execução

1. Branch `docs/109-architecture`.
2. Estrutura:
   - Visão geral
   - Stack
   - Estrutura de pastas (`src/` overview)
   - Camadas e responsabilidades
   - Estado global (Storage → AppData → UserData)
   - Composables vs Helpers (após #011)
   - Comunicação inter-janelas (BroadcastChannel)
   - Padrões de módulos
   - Build e bundling (Vite, manualChunks)
   - Eletron (D0-D10 reference)
3. Adicionar diagramas Mermaid.
4. Commit: `[109] Add ARCHITECTURE.md with layer diagrams and patterns`.

## Validação

- [x] `ARCHITECTURE.md` existe na raiz.
- [x] Mermaid diagrams renderizam no GitHub.
- [x] Linkado do README.

## Referências

- Item audit: #109.
- Pré-requisito: #011 (fronteira helper/composable).

---

## Notas pós-execução

Executado em 2026-05-05. Criado `ARCHITECTURE.md` (~380 linhas) com 5 diagramas Mermaid cobrindo visão geral, camadas, estado global, BroadcastChannel (sequência + tabela), rotas, atalhos, build, Platform.js e fluxo de boot. Link adicionado ao README.md. Build passou sem erros.

`TASK_COMPLETE: #109`
