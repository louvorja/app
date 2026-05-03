---
id: 017
title: Refatorar liturgy/Index.vue (2331 linhas) em componentes + composables
slug: refatorar-liturgy
category: refactor
wave: 3
model: opus
priority: P0
estimate_hours: 16
status: in-progress
depends_on: []
blocks: []
audit_items: [17, 18, 19, 20]
---

# [017] Refatorar liturgy/Index.vue

## Contexto

`src/modules/core/liturgy/interface/Index.vue` tem **2331 linhas** (cresceu de 2048). Identifica-se ao menos 7 responsabilidades distintas num único arquivo:

1. **Lista de itens** — drag/drop, adicionar, remover, reordenar.
2. **Tipos de item** — música, anotação, site, arquivo, cronômetro, etc.
3. **Cronômetro por item** — timer regressivo, alarme, progresso.
4. **Import/export JSON** — salvar/carregar liturgia em arquivo.
5. **Integração com Media** — abrir música ao clicar item.
6. **Busca inline** — filtro de músicas ao adicionar.
7. **Estado persistido** — `$userdata` para liturgia salva.

Problemas documentados no audit:
- `$forceUpdate()` x2 — indica estado não reativo sendo mutado diretamente.
- `super_compact` computed morto (nunca usado).
- String `"Duração (min)"` hardcoded (resolvida na #052, mas indica estilo de código).
- Componente monolítico dificulta debugging e código é impossível de revisar em PR.

## Objetivo

Quebrar em componentes menores sem alterar comportamento observável:

```
liturgy/
├── interface/
│   ├── Index.vue              ← orquestrador (<200 linhas)
│   ├── LiturgyList.vue        ← lista drag/drop de itens
│   ├── LiturgyItem.vue        ← um item da liturgia
│   ├── LiturgyItemForm.vue    ← modal de adição/edição de item
│   ├── LiturgyTimer.vue       ← cronômetro integrado
│   └── LiturgyImportExport.vue← botões salvar/carregar
├── composables/
│   ├── useLiturgyItems.js     ← CRUD + drag/drop
│   ├── useLiturgyTimer.js     ← cronômetro + alarme
│   └── useLiturgyPersistence.js ← $userdata + import/export
```

## Escopo

### Dentro
- Quebrar em 5 componentes + 3 composables listados acima.
- Remover `$forceUpdate()` tornando o estado reativo.
- Remover computed `super_compact` morto.
- Manter 100% do comportamento.

### Fora
- **NÃO** redesenhar a UI do módulo.
- **NÃO** migrar para Composition API (`<script setup>`) neste PR — pode misturar se necessário para os novos componentes, mas não forçar no componente existente.
- **NÃO** adicionar features — apenas refatorar.

## Arquivos afetados

- `src/modules/core/liturgy/interface/Index.vue` (reduzir drasticamente)
- `src/modules/core/liturgy/interface/LiturgyList.vue` (criar)
- `src/modules/core/liturgy/interface/LiturgyItem.vue` (criar)
- `src/modules/core/liturgy/interface/LiturgyItemForm.vue` (criar)
- `src/modules/core/liturgy/interface/LiturgyTimer.vue` (criar)
- `src/modules/core/liturgy/interface/LiturgyImportExport.vue` (criar)
- `src/modules/core/liturgy/composables/useLiturgyItems.js` (criar)
- `src/modules/core/liturgy/composables/useLiturgyTimer.js` (criar)
- `src/modules/core/liturgy/composables/useLiturgyPersistence.js` (criar)

## Plano de execução — multi-PR obrigatório

**⚠️ Este PR é grande demais para uma sessão. Quebrar em sub-tarefas:**

### 017a — Composables (extração lógica, sem UI mudando)
1. Ler o arquivo inteiro e mapear todas as funções por responsabilidade.
2. Criar `useLiturgyItems.js`: CRUD de itens, drag/drop, reordenação.
3. Criar `useLiturgyPersistence.js`: load/save em $userdata, import/export JSON.
4. Criar `useLiturgyTimer.js`: cronômetro regressivo, alarme, progresso por item.
5. `Index.vue` importa os composables — comportamento idêntico.
6. Commit: `[017a] Extract liturgy composables (useLiturgyItems, useLiturgyTimer, useLiturgyPersistence)`

### 017b — Extrair LiturgyTimer.vue
1. Criar `LiturgyTimer.vue` usando `useLiturgyTimer`.
2. Substituir inline timer em `Index.vue` pelo componente.
3. Smoke: cronômetro inicia/para/alarma corretamente.
4. Commit: `[017b] Extract LiturgyTimer.vue component`

### 017c — Extrair LiturgyItem.vue
1. Criar `LiturgyItem.vue`: renderização de um item (ícone, título, duração, controles).
2. Substituir `v-for` do `Index.vue` pelo componente.
3. Smoke: lista renderiza, drag/drop funciona, abrir música funciona.
4. Commit: `[017c] Extract LiturgyItem.vue component`

### 017d — Extrair LiturgyItemForm.vue e LiturgyImportExport.vue
1. Extrair modal de adição/edição de item para `LiturgyItemForm.vue`.
2. Extrair botões de import/export para `LiturgyImportExport.vue`.
3. Smoke: adicionar item, editar item, salvar/carregar liturgia.
4. Commit: `[017d] Extract LiturgyItemForm and LiturgyImportExport components`

### 017e — Extrair LiturgyList.vue e limpar Index.vue
1. Criar `LiturgyList.vue` com vuedraggable.
2. `Index.vue` deve ter < 200 linhas.
3. Remover `$forceUpdate()` e `super_compact`.
4. Smoke completo de culto.
5. Commit: `[017e] Extract LiturgyList.vue + clean up Index.vue`

## Smoke checklist (executar em 017e antes do merge)

- [ ] Adicionar item de cada tipo (música, anotação, site, arquivo, cronômetro).
- [ ] Reordenar itens via drag/drop.
- [ ] Remover item.
- [ ] Editar item (alterar título, duração, cor).
- [ ] Abrir música do item — `Media.open()` chamado.
- [ ] Cronômetro: iniciar, pausar, resetar, alarme.
- [ ] Salvar liturgia como JSON.
- [ ] Carregar liturgia de arquivo JSON.
- [ ] Fechar e reabrir o módulo: estado persistido restaurado.
- [ ] Mudar idioma PT/ES: i18n sem quebrar.
- [ ] `$forceUpdate` não mais presente no código.

## Validação

- [ ] `Index.vue` tem < 200 linhas.
- [ ] Smoke checklist completo.
- [ ] `npm run build` e `lint` passam.

## Riscos / atenções

- **`$forceUpdate()`**: identificar exatamente qual state causa a necessidade — provavelmente um array sendo mutado diretamente sem reatividade. Tornar reativo (Vue.set ou substituir array completo) antes de remover o forceUpdate.
- **vuedraggable**: drag/drop depende de como `v-model` está conectado. Ao extrair para `LiturgyList.vue`, garantir que o binding de eventos está correto.
- **Ordem dos sub-PRs**: cada sub-PR deve passar no build antes do próximo iniciar. Não paralelizar.

## Referências

- Item audit: #17, #18, #19, #20.
- liturgy/Index.vue: [src/modules/core/liturgy/interface/Index.vue](../../src/modules/core/liturgy/interface/Index.vue)

---

## Notas pós-execução

- **Branch base:** `chore/069-corrigir-porta-dev`
- **Sub-PRs:**
  - 017a: ✅ Composables extraídos:
    - `src/modules/core/liturgy/composables/useLiturgyPersistence.js` — semana, `locked`, notas, agendados (caches reativos eliminam `$forceUpdate`), save/load JSON.
    - `src/modules/core/liturgy/composables/useLiturgyItems.js` — CRUD de itens, drag/drop de arquivos externos, dialog, form, play de músicas, execução de itens.
    - `src/modules/core/liturgy/composables/useLiturgyTimer.js` — cronômetro regressivo, progresso por item, `playBeep` no avanço.
    - `Index.vue` migrado para `setup()` com 3 composables; `methods` residuais: `t()`, `closeModule()`, `loadFile()`, `onDragLeave()`. `$forceUpdate()` eliminado nos itens agendados via caches reativos em `useLiturgyPersistence`. Computed `super_compact` morto removido.
  - 017b: ✅ `LiturgyTimer.vue` extraído:
    - Props: `running`, `timerSeconds`, `timerDisplay`, `hasItems`.
    - Emits: `toggle`, `prev`, `next`.
    - CSS timer-específico movido para o componente (scoped); `lit-btn` duplicado localmente.
    - `Index.vue` substituiu o bloco inline do timer e o botão start/stop por `<LiturgyTimer>`.
    - `useLiturgyTimer` permanece no `setup()` de `Index.vue` — necessário para `timerCurrentIndex`/`timerItemProgress` nos cards (017c) e `stopTimer` no `beforeUnmount`.
  - 017c: ✅ `LiturgyItem.vue` extraído:
    - Props: `element`, `index`, `locked`, `timerActive`, `timerProgress`, `defaultColor`, `isChecked`, `iconFor`, `subtitleFor`.
    - Emits: `edit`, `remove`, `execute`, `play-music`, `change-color`, `toggle-checked`.
    - Renderiza categoria e card normal; CSS inteiro de card/categoria movido para o componente.
    - `.liturgy-list-area--locked .lit-card` substituído por `.lit-card--locked` no próprio componente.
    - Import `manifest` não usado removido de `Index.vue`.
    - Index.vue: 1661 → 1302 linhas (−359 linhas).
  - 017d: ✅ `LiturgyItemForm.vue` e `LiturgyImportExport.vue` extraídos:
    - `LiturgyItemForm.vue` (254 linhas template + CSS): recebe `form` como prop read-only + `setFormField(field, value)` como function prop para todas as mutações; `@change`/`@input` em vez de `v-model` evita `vue/no-mutating-props`.
    - `LiturgyImportExport.vue` (82 linhas): wrapper dos 2 botões save/load + `<input type="file">` oculto; emite `save` e `file-load(event)`; `loadFile()` e `$refs.fileInput` removidos do Index.vue.
    - `useLiturgyItems.js`: adicionado `setFormField(field, value)` exposto e passado como prop ao form.
    - CSS de dialog/form movido para LiturgyItemForm.vue; Index.vue retém apenas `.lit-input`, `.lit-hint` (usados no diálogo de agendados ainda em Index.vue).
    - Index.vue: 1302 → 960 linhas (−342 linhas).
  - 017e: _pendente_ (LiturgyList + cleanup Index.vue < 200 linhas)
- **Surpresas:**
  - `$userdata.set/get` usa Vuex via `$appdata`, tornando `$liturgy.list()` reativo — sem necessidade de `onSuccess` callback em `onFileLoad`.
  - `useLiturgyItems` precisou de acesso a `$platform` via `getCurrentInstance()` para `chooseFolder/chooseFile/openFile` — padrão adotado nos demais composables de módulo.
  - `COLORS` e `DEFAULT_COLOR` exportados de `useLiturgyItems.js` para uso direto no template via `setup()` return.
- **Próximos passos:** 017b extrair `LiturgyTimer.vue`; 017c extrair `LiturgyItem.vue`.
