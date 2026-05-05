---
id: 112
title: Documentar variáveis de ambiente Vite
slug: env-vars-docs
category: docs
wave: convencao
model: sonnet
priority: P2
estimate_hours: 0.5
status: done
depends_on: [113]
blocks: []
audit_items: [112]
---

# [112] Documentar VITE_*

## Contexto

`#113` (done) criou `.env.example` com as variáveis. Falta documentação narrativa — para que cada uma serve, valores típicos, impacto de não definir.

## Objetivo

- Seção em `CLAUDE.md` ou novo `docs/env.md` documentando cada `VITE_*`.

## Escopo

### Dentro
- Lista completa de env vars com:
  - Nome
  - Tipo (URL, token, boolean)
  - Onde é usado (helper/componente)
  - Valor de exemplo
  - Comportamento se ausente

### Fora
- **NÃO** documentar env vars do Electron main process.

## Arquivos afetados

- [CLAUDE.md](../../CLAUDE.md) ou `docs/env.md`.

## Plano de execução

1. Branch `docs/112-env-vars`.
2. Inventariar todas as `VITE_*`:
   ```bash
   grep -rn "import\.meta\.env\.VITE_" src/ --include="*.js" --include="*.vue"
   ```
3. Para cada uma, escrever entrada na doc.
4. Commit: `[112] Document VITE_* environment variables`.

## Validação

- [ ] Toda var em `.env.example` está documentada.
- [ ] Cada entry diz: o que faz, exemplo, fallback.

## Referências

- Item audit: #112.
- Task #113 (done) — `.env.example`.
