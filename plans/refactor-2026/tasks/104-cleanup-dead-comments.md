---
id: 104
title: Remover blocos comentados e código morto em ModuleManager/main
slug: cleanup-dead-comments
category: dead-code
wave: 1
model: sonnet
priority: P2
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [104, 106]
---

# [104] Remover blocos comentados e código morto

## Contexto

Vestígios em arquivos críticos:

- [src/helpers/ModuleManager.js:51-56](../../src/helpers/ModuleManager.js#L51-L56) — bloco comentado de 6 linhas que cria categoria automaticamente. Não está em uso.
- [src/main.js:163-168](../../src/main.js#L163-L168) — `installRemoteModule('some-module-id')` placeholder vazio.
- [src/main.js:46-48](../../src/main.js#L46) — comentário "Equivalente ao mixin.beforeCreate mas sem duplicar..." — informação histórica que envelhece mal.

Comentários desse tipo poluem leitura e implicam intenção que ninguém vai realizar. Git history preserva o passado se alguém precisar.

## Objetivo

- Remover os 3 blocos identificados.
- Avaliar e remover outros comentários óbvios de "TODO morto", "rationale histórico", ou código comentado encontrados durante varredura.

## Escopo

### Dentro
- ModuleManager.js linhas 51-56 (bloco comentado).
- main.js linhas 163-168 (installRemoteModule placeholder).
- main.js linhas 46-48 (comentário histórico).
- Outros comentários óbvios que aparecerem na varredura abaixo.

### Fora
- **NÃO** remover JSDoc.
- **NÃO** remover comentários que explicam invariantes ou WHY não-óbvio.
- **NÃO** mexer em arquivos que não sejam ModuleManager/main exceto se a varredura achar lixo claro.

## Arquivos afetados

- [src/helpers/ModuleManager.js](../../src/helpers/ModuleManager.js)
- [src/main.js](../../src/main.js)
- Outros descobertos.

## Plano de execução

1. **Branch:** `git checkout -b chore/104-cleanup-dead-comments`

2. **Remover blocos identificados:**

   - `ModuleManager.js:51-56`: deletar `/* ... */` morto.
   - `main.js:163-168`: deletar `try { /* ... */ }` placeholder do `installRemoteModule`.
   - `main.js:46-48`: deletar comentário "Equivalente ao mixin..." (manter linha de código abaixo).

3. **Varrer outros candidatos:**
   ```bash
   # Comentários começados com //, com 4+ linhas seguidas
   grep -rn -B1 "^[[:space:]]*//" src/ | grep -A20 "^.*helpers" | head -100

   # Blocos /* ... */ no código (não JSDoc)
   grep -rn -P "^\s*/\*[^*]" src/

   # TODO, FIXME, XXX, HACK
   grep -rn -E "TODO|FIXME|XXX|HACK" src/
   ```

   Para cada hit:
   - JSDoc (começa com `/**`) → manter.
   - Explicação de invariante / razão concreta de uma decisão → manter.
   - Código comentado → deletar.
   - "Funciona mas dá pra melhorar" sem ação → deletar (ou converter em task no backlog).

4. **Verificar:**
   ```bash
   npm run build
   npm run lint
   ```

5. **Commit + PR:**
   ```
   [104] Remove dead-code comments and stale rationale blocks
   ```

## Validação

- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.
- [ ] Smoke: app abre, módulos abrem.
- [ ] Diff é puramente subtrativo (só remoção).

## Riscos / atenções

- Cuidado com comentário que **parece** morto mas é load-bearing (ex: workaround para bug específico de Vue/Vuetify). Se houver dúvida sobre algum: manter.
- Não mexer em CLAUDE.md nem README — comentários documentais ficam de fora.

## Referências

- Item original do audit: #104, #106.

---

## Notas pós-execução

- **Branch:** `chore/104-cleanup-dead-comments`
- **PR:** _(pendente push)_
- **Commit principal:** `400056d`
- **Linhas removidas:** +21 / -71 (net −50 linhas)
- **O que foi removido:**
  - `ModuleManager.js`: bloco `/* if (!moduleGroups...) */` (9 linhas)
  - `ModuleManager.js`: método inteiro `installRemoteModule()` (24 linhas) — chamava `fetchModuleManifest` e `downloadModuleModule` que não existem
  - `ModuleManager.js`: try/catch vazio com placeholder comentado (9 linhas)
  - `main.js`: 3 linhas de comentário "Equivalente ao mixin.beforeCreate..."
- **Varredura de TODOs/FIXMEs:** apenas em código de terceiros (`animejs`) e texto português normal — zero ação necessária no código do projeto
- **Comentários mantidos por dúvida:** nenhum — todas as remoções eram claramente código morto ou rationale histórico sem valor atual
