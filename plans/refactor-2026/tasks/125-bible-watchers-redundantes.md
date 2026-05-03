---
id: 125
title: Bible — 3 watchers consecutivos chamando mesma função
slug: bible-watchers-redundantes
category: bug
wave: bugs
model: sonnet
priority: P2
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [125]
---

# [125] Bible 3 watchers redundantes

## Contexto

`bible/Index.vue` tem 3 `watch()` que disparam a mesma função (provavelmente `loadVerses()` ou similar). Padrão observado: cada watcher para um campo diferente (livro, capítulo, versão), mas todos chamam o mesmo handler. Pode ser unificado em `watch([book, chapter, version], handler)`.

## Objetivo

- 3 watchers → 1 watcher com array source.
- Nenhuma mudança comportamental.

## Escopo

### Dentro
- Localizar e mesclar watchers.

### Fora
- **NÃO** alterar o handler em si.

## Arquivos afetados

- `src/modules/core/bible/interface/Index.vue`

## Plano de execução

1. Branch `bug/125-bible-watchers`.
2. Localizar os 3 watchers redundantes:
   ```bash
   grep -n "watch:" src/modules/core/bible/interface/Index.vue
   ```
3. Mesclar:
   ```js
   watch: {
     book: 'loadVerses',
     chapter: 'loadVerses',
     version: 'loadVerses',
   }
   // OU em script setup:
   watch([book, chapter, version], loadVerses);
   ```
4. Smoke: trocar livro/capítulo/versão na Bíblia.
5. Commit: `[125] Merge 3 redundant watchers in Bible into single array watcher`.

## Validação

- [x] 3 watchers removidos (`"bible.id_bible_book"`, `"bible.chapter"`, `"bible.id_bible_version"`).
- [x] `npm run build` passa.

## Análise real (descrição da task era imprecisa)

Os watchers **não** chamavam a mesma função — chamavam `selBook()`, `selChapter()` e
`selVersion()` respectivamente. O problema real era que cada `sel*(id)` muta internamente
`bible.*`, o que dispara o watcher correspondente que chama o método novamente sem argumento,
causando uma segunda chamada a `loadData()` em toda interação do usuário.

O watcher `show` já chama `loadData()` diretamente após resetar `bible`, tornando os 3
watchers completamente redundantes. As únicas atribuições a `bible.id_bible_book`,
`bible.chapter` e `bible.id_bible_version` acontecem dentro das próprias `sel*()` — não
há código externo que sete esses campos sem chamar o método correspondente.

## Referências

- Item audit: #125.
