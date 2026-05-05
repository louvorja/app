---
id: 072
title: CommandRegistry lazy-load + paginação + cancel tokens
slug: command-registry-lazy
category: performance
wave: performance
model: opus
priority: P2
estimate_hours: 4
status: todo
depends_on: []
blocks: []
audit_items: [72]
---

# [072] CommandRegistry — lazy-load + paginação + cancel tokens

## Contexto

`CommandRegistry.js` é o backend da Command Palette (Ctrl+K). Cada vez que o usuário digita, o registry roda fuzzy match em todas as músicas, hinos, versículos da Bíblia. Em datasets grandes (1000+ músicas + 31 livros da Bíblia), cada keystroke causa lag perceptível.

Problemas identificados:
1. Carrega todos os comandos no boot — bloqueando inicialização.
2. Sem paginação na UI — renderiza 500 resultados de uma vez.
3. Sem cancel token — typing rápido enfileira buscas que retornam fora de ordem.

## Objetivo

- Comandos carregam sob demanda (primeiro Ctrl+K).
- Resultado paginado em chunks de 50.
- Buscas anteriores canceladas quando nova começa.

## Escopo

### Dentro
- Lazy-load: `loadCommands()` chamado apenas no primeiro `open()`.
- Paginação: retornar `{ results, hasMore }` em vez de array completo.
- Cancel token via `AbortController` ou `searchId` incremental.

### Fora
- **NÃO** trocar Fuse.js por outra lib.
- **NÃO** implementar Web Worker (escopo separado se latência continuar).

## Arquivos afetados

- [src/helpers/CommandRegistry.js](../../src/helpers/CommandRegistry.js)
- Componente da CommandPalette (provavelmente em `src/components/` ou `src/composables/useShell.js`)

## Plano de execução

1. Branch `perf/072-command-registry-lazy`.
2. Adicionar `_loaded = false` flag em `CommandRegistry`.
3. `loadCommands()` retorna early se `_loaded`.
4. `search(query, { limit = 50, offset = 0, signal })`:
   - Verificar `signal?.aborted` em pontos chave.
   - Retornar `{ results, hasMore }`.
5. Componente da palette: usar `AbortController`, abort no próximo input.
6. UI: botão "Carregar mais" ou infinite scroll.
7. Smoke: digitar rápido, verificar que sem flash de resultados antigos.
8. Commit: `[072] CommandRegistry — lazy-load + pagination + cancel`.

## Validação

- [ ] Boot do app não bloqueia em CommandRegistry (verificar com Chrome DevTools Performance).
- [ ] Typing rápido não causa flicker de resultados antigos.
- [ ] `npm run build` passa.

## Riscos / atenções

- **`AbortController` no Fuse.js**: Fuse não suporta abort nativo. Implementar via flag `cancelled` checada após cada chunk de 100 itens.
- **Mudança de UX**: paginação muda comportamento da palette — alinhar com o usuário antes.

## Referências

- Item audit: #72.
- [src/helpers/CommandRegistry.js](../../src/helpers/CommandRegistry.js)
