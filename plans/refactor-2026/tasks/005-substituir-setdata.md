---
id: 005
title: Substituir mutation setData genérico por mutations tipadas
slug: substituir-setdata
category: arquitetura
wave: 3
model: opus
priority: P1
estimate_hours: 8
status: done
depends_on: []
blocks: []
audit_items: [5, 6]
---

# [005] Substituir setData genérico por mutations tipadas

## Contexto

`src/store/mutations.js` expõe `setData(state, data)` — um setter genérico por notação de ponto:
```js
setData(state, data) {
  const value = data.pop();
  const param = data.join(".");
  // caminha pelo state via string e seta qualquer propriedade
}
```

Usado via:
```js
// Em AppData.js
this.$store.commit("setData", [...keys.split("."), value]);
```

Problemas:
1. **Zero type safety**: `$appdata.set("user_data.theem", "dark")` — typo silencioso.
2. **Impossível fazer tree-shaking ou análise estática** — nenhuma IDE consegue rastrear quem seta o quê.
3. **DevTools Vuex**: "setData" com um array opaco não ajuda no debugging.
4. **Bloqueia TypeScript** (task #002): sem mutations nomeadas, não há como tipar o store.
5. Há também `addElementArray` e `removeElementArray` com o mesmo padrão genérico.

A solução é criar mutations nomeadas para cada pedaço do state que é mutado, e migrar os callers.

## Objetivo

- Criar mutations nomeadas (ex: `SET_THEME`, `SET_LANGUAGE`, `ADD_MODULE`, etc).
- Manter `setData` como **fallback deprecated** (não remover ainda) — evita quebrar tudo de uma vez.
- Migrar os callers mais críticos (AppData.js, UserData.js).
- Ao final desta task: `setData` ainda existe mas zero callers de primeiro nível.

## Escopo

### Dentro
- `src/store/mutations.js` — adicionar mutations nomeadas.
- `src/helpers/AppData.js` — migrar `.set()` para usar mutations nomeadas.
- `src/helpers/UserData.js` — idem.
- Inventário completo de todos os `commit("setData", ...)` no projeto.

### Fora
- **NÃO** remover `setData` ainda — deprecated mas mantido.
- **NÃO** migrar módulos individuais neste PR — só os helpers globais.

## Arquivos afetados

- `src/store/mutations.js`
- `src/helpers/AppData.js`
- `src/helpers/UserData.js`
- `src/store/state.js` (verificar estrutura atual)

## Plano de execução

1. **Branch:** `git checkout -b refactor/005-substituir-setdata`

2. **Inventariar todos os callers:**
   ```bash
   grep -rn 'commit("setData"\|commit('\''setData' \
     src/ --include="*.js" --include="*.vue" | sort
   ```
   Agrupar por qual parte do state cada um toca.

3. **Ler state.js** para mapear todas as propriedades mutáveis.

4. **Criar mutations nomeadas** em `mutations.js`:
   ```js
   // Aparência/tema
   SET_THEME(state, theme) { state.user_data.theme = theme; },
   SET_LANGUAGE(state, lang) { state.user_data.language = lang; },
   SET_LAYOUT(state, layout) { state.user_data.layout = layout; },
   
   // Módulos
   SET_MODULE_STATE(state, { id, key, value }) {
     if (!state.modules[id]) state.modules[id] = {};
     state.modules[id][key] = value;
   },
   OPEN_MODULE(state, id) {
     if (state.modules[id]) state.modules[id].show = true;
   },
   CLOSE_MODULE(state, id) {
     if (state.modules[id]) state.modules[id].show = false;
   },
   
   // Remote
   SET_REMOTE(state, remote) { state.user_data.remote = remote; },
   
   // Loading / flags
   SET_LOADING(state, value) { state.loading = value; },
   SET_IS_DARK(state, value) { state.is_dark = value; },
   ```

5. **Atualizar AppData.js e UserData.js** para usar as novas mutations onde possível.

6. **Adicionar deprecation warning em setData:**
   ```js
   setData(state, data) {
     if (import.meta.env.DEV) {
       console.warn("[store] setData() deprecated — use named mutation. Keys:", data.slice(0, -1));
     }
     // ... código atual
   }
   ```

7. **Verificar:**
   ```bash
   npm run dev
   # Abrir módulo, trocar tema, trocar idioma — tudo funcionando
   npm run build
   npm run lint
   ```

8. **Commit + PR:**
   ```
   [005] Add named Vuex mutations + deprecate setData
   ```

## Validação

- [ ] Mutations nomeadas existem para os casos críticos (tema, idioma, módulos, loading).
- [ ] `setData` tem warning de deprecação em DEV.
- [ ] `AppData.js` e `UserData.js` usam mutations nomeadas.
- [ ] `npm run dev` funciona (tema, idioma, módulos).
- [ ] `npm run build` passa.

## Riscos / atenções

- **Risco de regressão alto**: `setData` é usado em muitos lugares. Não remover antes de ter 100% dos callers migrados. O warning de deprecação é o sinal de progresso.
- **Modules state é dinâmico**: cada módulo registra sua configuração no state dinamicamente via `ModuleManager.js`. `SET_MODULE_STATE` precisa ser genérico o suficiente para suportar isso, mas tipado o suficiente para ser auditável.

## Referências

- Item audit: #5, #6.
- mutations.js: [src/store/mutations.js](../../src/store/mutations.js)
- AppData.js: [src/helpers/AppData.js](../../src/helpers/AppData.js)

---

## Notas pós-execução

- **Branch:** `refactor/017c-liturgy-item-component` (continuação).
- **Inventário de callers:** apenas `AppData.js:5` chamava `commit("setData", ...)` diretamente.
  `addElementArray`/`removeElementArray` não têm callers externos.
- **mutations.js — o que foi criado:**
  - `_walkSet(obj, path, value)` — utilitário interno (substitui o algoritmo duplicado
    em setData/addElementArray/removeElementArray).
  - Mutations nomeadas: `SET_LOADING`, `SET_IS_DARK`, `SET_IS_DEV`, `SET_IS_POPUP`,
    `SET_IS_MOBILE`, `SET_IS_DESKTOP`, `SET_IS_ONLINE`, `SET_IMPORT_MODULES`,
    `SET_POPUP`, `SET_POPUP_MODULE`, `SET_MODULE_GROUP`.
  - `PATCH_ALERT({ key, value })` — update de campo individual em `state.alert`.
  - `SET_MODULE_PATH({ id, path, value })` — write tipado para qualquer
    `state.modules[id].<path>` (cobre todos os `$appdata.set("modules.*", ...)` do projeto).
  - `SET_USER_DATA_PATH({ path, value })` — write tipado para qualquer
    `state.user_data.<path>` (cobre todos os `$appdata.set("user_data.*", ...)` via UserData.js).
  - `setData` / `addElementArray` / `removeElementArray`: mantidos como fallback deprecated
    com `console.warn` em DEV mostrando o key path.
- **AppData.js — o que mudou:** `set()` substituiu o único `commit("setData", ...)` por
  uma tabela de roteamento:
  - Flags escalares top-level → mutation nomeada específica.
  - `alert.*` → `PATCH_ALERT`.
  - `modules.*` → `SET_MODULE_PATH`.
  - `user_data.*` → `SET_USER_DATA_PATH`.
  - Caminhos desconhecidos (ex: relay dinâmico do Popup.vue) → fallback `setData` deprecado.
- **UserData.js:** não alterado — continua delegando para `AppData.set()`, que agora roteia.
- **Resultado:** `commit("setData", ...)` tem **zero callers de primeiro nível** fora do
  próprio AppData.js (fallback interno).  DevTools Vuex passa a mostrar nomes significativos.
- Build + eslint passam sem novos erros.
