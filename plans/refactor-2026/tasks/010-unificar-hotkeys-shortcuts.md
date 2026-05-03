---
id: 010
title: Unificar Hotkeys + Shortcuts + vue3-shortkey
slug: unificar-hotkeys-shortcuts
category: arquitetura
wave: 3
model: opus
priority: P1
estimate_hours: 6
status: done
depends_on: []
blocks: []
audit_items: [10]
---

# [010] Unificar Hotkeys + Shortcuts + vue3-shortkey

## Contexto

O projeto tem **três sistemas de atalhos de teclado** em paralelo:

1. **`Hotkeys.js`** — atalhos in-window via `keydown` global. Registry Map com normalização de combo. Contextos: `global | media | liturgy | live | edit`. Bem implementado.

2. **`Shortcuts.js`** — recebe ações do Electron `globalShortcut` via IPC (D6). Rota ações para helpers via `dispatchAction(action, payload)`. No browser/PWA, `init()` é no-op.

3. **`vue3-shortkey`** — directive `v-shortkey` em templates Vue. Terceira abordagem, diferente das outras duas.

Problemas:
- `Hotkeys.js` e `vue3-shortkey` fazem a mesma coisa para atalhos in-window.
- `Shortcuts.js` já tem `dispatchAction()` que poderia ser chamado por `Hotkeys.js` também.
- Resultado: quando o usuário pressiona `Space` durante projeção, pode estar registrado em `Hotkeys.js`, em `v-shortkey`, ou em ambos — comportamento difícil de prever.
- Cheatsheet (`HotkeysCheatsheet.vue`) só vê os atalhos registrados em `Hotkeys.js` — os `v-shortkey` são invisíveis.

## Objetivo

- Centralizar atalhos in-window em `Hotkeys.js` (remover uso de `vue3-shortkey`).
- `Shortcuts.js` (Electron globalShortcut) chama `dispatchAction()` que por sua vez chama `Hotkeys` handlers — unificando o ponto de roteamento.
- `HotkeysCheatsheet.vue` mostra todos os atalhos.
- Opcional: desinstalar `vue3-shortkey` do `package.json`.

## Escopo

### Dentro
- Varrer todos os `v-shortkey` no projeto e substituir por `Hotkeys.register()`.
- `Shortcuts.js.dispatchAction()` passa ações para `Hotkeys`.
- Testar cheatsheet exibe todos os atalhos.

### Fora
- **NÃO** mudar o comportamento dos atalhos — apenas mover a definição.
- **NÃO** remover `vue3-shortkey` do package.json até zero usos confirmados.

## Arquivos afetados

- `src/helpers/Hotkeys.js` (pode precisar de ajuste de API)
- `src/helpers/Shortcuts.js` (conectar com Hotkeys)
- Todos os `.vue` com `v-shortkey`
- `package.json` (remover vue3-shortkey se zero usos)

## Plano de execução

1. **Branch:** `git checkout -b refactor/010-unificar-hotkeys`

2. **Inventariar `v-shortkey` usages:**
   ```bash
   grep -rn "v-shortkey\|shortkey" src/ --include="*.vue" --include="*.js"
   ```

3. **Para cada `v-shortkey`:**
   - Identificar combo e handler.
   - Registrar equivalente em `Hotkeys.register()` no `setup()` ou `onMounted()`.
   - Remover `v-shortkey` do template.

4. **Conectar `Shortcuts.js` com `Hotkeys.js`:**
   ```js
   // Shortcuts.js dispatchAction
   function dispatchAction(action, payload) {
     switch (action) {
       case "slide:next": Hotkeys._fire("ArrowRight"); break;
       // ou: chama diretamente Media.nextSlide()
     }
   }
   ```

5. **Verificar cheatsheet:**
   ```bash
   npm run dev
   # Abrir HotkeysCheatsheet (Ctrl+?) — todos os atalhos visíveis
   ```

6. **Remover vue3-shortkey:**
   ```bash
   # Após zero usos confirmados:
   npm uninstall vue3-shortkey
   # Remover import de main.js
   ```

7. **Commit + PR:**
   ```
   [010] Unify keyboard shortcuts under Hotkeys.js (remove vue3-shortkey)
   ```

## Validação

- [ ] Zero `v-shortkey` em qualquer `.vue`.
- [ ] `Hotkeys.list()` retorna todos os atalhos do sistema.
- [ ] `HotkeysCheatsheet` mostra atalhos completos.
- [ ] Atalhos funcionam em browser e Electron.
- [ ] `npm run build` e `lint` passam.

## Riscos / atenções

- **`vue3-shortkey` e modificadores especiais**: `v-shortkey.once`, `v-shortkey.push` têm comportamentos que podem não ter equivalente direto em `Hotkeys.js`. Identificar e implementar se necessário.
- **Conflito de foco**: `v-shortkey` é escoped ao componente; `Hotkeys.js` é global. Ao migrar, verificar se algum atalho deve ser context-aware (só ativo quando módulo X está aberto).

## Referências

- Item audit: #10.
- Hotkeys.js: [src/helpers/Hotkeys.js](../../src/helpers/Hotkeys.js)
- Shortcuts.js: [src/helpers/Shortcuts.js](../../src/helpers/Shortcuts.js)

---

## Notas pós-execução

### O que foi feito

**Bug corrigido em `Hotkeys.js`:** `_comboFromEvent` usava `key.length === 1` para decidir se normalizava para minúsculas, o que deixava todos os atalhos com teclas multi-char (F1, Space, Escape, ArrowLeft, Home, Delete, etc.) sem funcionar. A correção aplica `.toLowerCase()` em todos os casos, espelhando `_normalizeCombo`. Este bug tornava os atalhos registrados em `main.js` completamente inoperantes.

**`vue3-shortkey` removido:** Varredura confirmou 3 pontos de uso — `PlayerControls.vue`, `PlayerActions.vue` e `Bible/Index.vue`. Todos migrados. Pacote desinstalado (`npm uninstall vue3-shortkey`), import e `app.use` removidos de `main.js`.

**Player (`PlayerControls.vue`, `PlayerActions.vue`, `usePlayerState.js`):** `v-shortkey` e `@shortkey` removidos dos templates. Campos `shortkey` removidos dos objetos de botão. Navegação por ArrowLeft/ArrowRight já estava registrada em `main.js` com `_ifMedia` guard — passa a funcionar agora com o bug corrigido.

**Bíblia (`Bible/Index.vue`):** Atalhos migrados para `Hotkeys.register()` em `mounted()` / `unmounted()`. Handlers armazenados como `this._hotkeyPrev/Next/Clean` para desregistro correto sem remover outros handlers do mesmo combo. Prioridade natural pelo "último registrado vence" — enquanto o módulo Bíblia estiver montado, ← e → navegam versículos; ao desmontar, voltam a navegar slides.

**Cheatsheet atualizado:** `list()` agora expõe `label` (além de `combo`). `HotkeysCheatsheet.vue` usa `label` para renderizar `<kbd>` — exibe "←" em vez de "arrowleft". Grupo "bible" adicionado ao `GROUP_ORDER` e ao i18n (pt + es).

### Comportamento resultante
- ← / → com media ativa: navega slides (via `main.js`)
- ← / → com módulo Bíblia montado (independente de media): navega versículos (prioridade de registro)
- Del com módulo Bíblia montado: limpa versículo selecionado
- `Hotkeys.list()` retorna todos os atalhos, incluindo os da Bíblia
- Cheatsheet (F1) mostra todos os grupos incluindo "Bíblia"
