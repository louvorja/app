---
id: 045
title: Adicionar focus-trap em todos os modais (a11y)
slug: focus-trap-modais
category: acessibilidade
wave: 3
model: opus
priority: P1
estimate_hours: 4
status: done
depends_on: [040]
blocks: []
audit_items: [43, 47]
---

# [045] focus-trap em modais

## Contexto

Modais sem focus-trap permitem que Tab navegue fora do modal para o fundo, onde elementos estão obscurecidos e inacessíveis. WCAG 2.1 SC 2.1.2 exige que o foco não fique preso em componentes que não têm intenção de capturá-lo, E que modais capturem o foco enquanto abertos.

Vuetify `v-dialog` implementa focus-trap nativo desde a v3. Mas modais customizados (drawers, painéis laterais, bottom sheets feitos manualmente) podem não ter.

## Objetivo

- Inventariar todos os modais/overlays do projeto.
- Confirmar quais têm focus-trap nativo (Vuetify dialog).
- Para os que não têm, adicionar usando `focus-trap-vue` ou implementação manual.
- Garantir que Esc fecha o modal (já deve funcionar via Vuetify).

## Escopo

### Dentro
- Todos os `v-dialog`, `v-bottom-sheet`, `v-navigation-drawer` e overlays customizados.
- Modais em módulos críticos (liturgy, musics, album).

### Fora
- **NÃO** alterar design/layout dos modais.

## Plano de execução

1. **Branch:** `git checkout -b chore/045-focus-trap-modais`

2. **Inventariar:**
   ```bash
   grep -rn "v-dialog\|v-bottom-sheet\|v-navigation-drawer\|v-overlay" \
     src/ --include="*.vue" | grep -v node_modules
   ```

3. **Testar focus-trap manual:**
   - Abrir modal → Tab → verificar no DevTools se foco sai do modal.
   - Se sair: focus-trap ausente.

4. **Para modais sem focus-trap nativo:**
   ```bash
   npm install focus-trap-vue
   ```
   ```vue
   <FocusTrap v-if="dialogOpen">
     <v-card>...</v-card>
   </FocusTrap>
   ```

5. **Testar Esc fecha modal** em todos os modais.

6. **Commit + PR:**
   ```
   [045] Add focus-trap to all modals for keyboard accessibility
   ```

## Validação

- [ ] Tab não sai do modal enquanto aberto.
- [ ] Esc fecha todos os modais.
- [ ] `npm run build` passa.

## Referências

- Item audit: #43, #47.
- WCAG 2.1.2: https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html
- focus-trap-vue: https://github.com/vue-a11y/focus-trap-vue

---

## Notas pós-execução

### Audit de focus-trap

**Vuetify 4 (`v-dialog`) inclui focus-trap nativo com estes defaults:**
- `retainFocus: true` → Tab cycling fica preso dentro do modal (WCAG 2.1 SC 2.1.2 ✓)
- `captureFocus: true` → foco move para o primeiro elemento focável ao abrir ✓

**`VBottomSheet`** usa `...makeVDialogProps()` internamente, herdando os mesmos defaults. ✓

Não foi necessário instalar `focus-trap-vue` — o Vuetify já cobre todos os casos.

### Inventário completo

| Arquivo | Tipo | retainFocus | captureFocus | Esc fecha? | Notas |
|---|---|---|---|---|---|
| `Alert.vue` | `v-dialog persistent` | ✓ (default) | ✓ | Não — intencional | Confirmação requer click explícito |
| `Loading.vue` | `v-dialog persistent` | ✓ | ✓ | Não — intencional | Loading não pode ser dispensado |
| `Window.vue` | `v-dialog persistent` | ✓ | ✓ | Sim via `@keydown.esc` | Override manual correto |
| `CommandPalette.vue` | `v-dialog` | ✓ | ✓ | Sim via `@keydown.escape.stop` | Foco manual no searchInput ✓ |
| `HotkeysCheatsheet.vue` | `v-dialog scrollable` | ✓ | ✓ | Sim (nativo Vuetify) | ✓ |
| `CustomizationBar.vue` | `v-bottom-sheet` | ✓ (herda) | ✓ | Sim (nativo Vuetify) | ✓ |
| `draw/Index.vue` | `v-dialog fullscreen` | ✓ | ✓ | Sim (nativo Vuetify) | ✓ |
| `message_board/Index.vue` | `v-dialog fullscreen` | ✓ | ✓ | Sim (nativo Vuetify) | ✓ |
| `name_draw/Index.vue` | `v-dialog fullscreen` | ✓ | ✓ | Sim (nativo Vuetify) | ✓ |
| `LiturgyItemForm.vue` | `v-dialog persistent` | ✓ | ✓ | **Corrigido** | Adicionado `@keydown.escape` |
| `LiturgySchedules.vue` | `v-dialog persistent` | ✓ | ✓ | **Corrigido** | Adicionado `@keydown.escape` |

### Ações realizadas

`LiturgyItemForm.vue` e `LiturgySchedules.vue` eram `persistent` sem handler de Esc. O botão X (fechar) era a única saída por teclado (Tab até o botão → Enter). Adicionado `@keydown.escape="$emit('update:modelValue', false)"` seguindo o mesmo padrão do `Window.vue`. O comportamento do `persistent` para clique-fora permanece inalterado.

### Como Vuetify 4 implementa o focus-trap

A implementação fica em `useFocusTrap` (linha ~12381 do bundle). Com `retainFocus: true`, o trap escuta `keydown Tab` via `document.addEventListener` e, ao detectar Tab no primeiro/último elemento focável, redireciona o foco para o extremo oposto. O id do trap fica num `registry: Map` — múltiplos dialogs aninhados funcionam corretamente (o mais interno vence).
