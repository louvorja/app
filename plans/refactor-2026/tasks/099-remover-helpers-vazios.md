---
id: 099
title: Remover helpers vazios (Window.js, Theme.js)
slug: remover-helpers-vazios
category: dead-code
wave: 1
model: sonnet
priority: P2
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [99, 100]
---

# [099] Remover helpers vazios (Window.js, Theme.js)

## Contexto

Dois helpers minúsculos no projeto:

- [src/helpers/Window.js](../../src/helpers/Window.js) — 8 linhas
- [src/helpers/Theme.js](../../src/helpers/Theme.js) — 7 linhas

Pelo tamanho, são vestígios. Se conteúdo for trivial, melhor remover ou inlinar.

## Objetivo

- Avaliar conteúdo dos dois arquivos.
- Se todo conteúdo é trivial/morto: remover arquivos + imports + registros em `globalProperties`.
- Se conteúdo é usado: mover para outro helper apropriado e remover o arquivo solto.

## Escopo

### Dentro
- Examinar e decidir: remover ou consolidar.
- Apagar arquivos.
- Apagar imports em [src/main.js](../../src/main.js).
- Apagar entradas `$theme`, `$window` (se existirem) em `globalProperties`.
- Atualizar consumidores se houver.

### Fora
- Não criar substitutos novos. Se algo é necessário, vira task separada.

## Arquivos afetados

- [src/helpers/Window.js](../../src/helpers/Window.js)
- [src/helpers/Theme.js](../../src/helpers/Theme.js)
- [src/main.js](../../src/main.js)
- Consumidores descobertos pelo grep.

## Plano de execução

1. **Branch:** `git checkout -b chore/099-remove-empty-helpers`

2. **Inspecionar conteúdo:**
   ```bash
   cat src/helpers/Window.js
   cat src/helpers/Theme.js
   ```

3. **Mapear consumidores:**
   ```bash
   grep -rn "@/helpers/Window\|\$window\." src/
   grep -rn "@/helpers/Theme\|\$theme\." src/
   ```

4. **Decidir caso a caso:**
   - Conteúdo trivial e zero usos → deletar arquivo + imports.
   - Conteúdo trivial e poucos usos → inlinar nos call sites; deletar arquivo.
   - Conteúdo não-trivial e usos espalhados → **abortar** esta task; criar task nova de refactor.

5. **Executar a decisão.**

6. **Verificar:**
   ```bash
   npm run build
   npm run lint
   grep -rn "@/helpers/Window\|@/helpers/Theme" src/    # deve retornar 0
   ```

7. **Commit + PR:**
   ```
   [099] Remove empty/legacy helpers Window.js and Theme.js
   ```

## Validação

- [ ] Arquivos removidos OU consolidados.
- [ ] Zero referências quebradas (`grep` confirma).
- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.
- [ ] Smoke: app abre, troca de tema funciona (caso `$theme` tenha sido tocado), abrir/fechar módulos funciona (caso `$window`).

## Riscos / atenções

- Se descobrir uso real durante a execução, abortar e converter em task de refactor (não esticar esta).

## Referências

- Item original do audit: #99, #100.

---

## Notas pós-execução

- **Branch:** `chore/099-remove-empty-helpers`
- **PR:** _(pendente push)_
- **Commit principal:** `80acdd8`
- **Decisão final:**
  - `Theme.js` → **removido** (dead code: zero chamadas a `$theme` em toda a codebase)
  - `Window.js` → **inlinado** em `Popup.js` (único caller) e **removido**
- **Consumidores encontrados:** 1 (`Popup.js` usava `$window.open`; inlinado na linha 15-16)
