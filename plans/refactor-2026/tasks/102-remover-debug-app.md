---
id: 102
title: Remover código de debug em App.vue (Ctrl+Alt+D + console.log)
slug: remover-debug-app
category: dead-code
wave: 1
model: sonnet
priority: P0
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [102]
---

# [102] Remover código de debug em App.vue

## Contexto

[src/App.vue](../../src/App.vue) tem um botão fantasma (display: none) com atalho `Ctrl+Alt+D`:

```vue
<v-btn
  v-show="false"
  @shortkey="handleKeydown()"
  v-shortkey="['ctrl', 'alt', 'd']"
/>
```

E o handler:

```js
methods: {
  handleKeydown() {
    console.log("click ");
    //if (event.shiftKey && event.key === "A") {
    this.$dev.toogle();
    //}
  },
}
```

Problemas:
1. `console.log("click ")` em produção (com espaço estranho).
2. Bloco condicional comentado morto.
3. Botão `v-show="false"` é antipattern (esconde algo do DOM mas continua montando).
4. O atalho Ctrl+Alt+D para toggle do `$dev` deveria estar no sistema unificado de hotkeys (#010), não em `App.vue`.

## Objetivo

- Remover o `<v-btn>` fantasma do template.
- Remover o método `handleKeydown` e o `console.log`.
- Mover o atalho Ctrl+Alt+D para `Hotkeys.register` em [src/main.js](../../src/main.js) (consistente com F1, Ctrl+K, etc).

## Escopo

### Dentro
- Limpar [src/App.vue](../../src/App.vue) — remover botão, método, import desnecessário.
- Re-registrar Ctrl+Alt+D em `Hotkeys` em `main.js`, dentro do bloco existente de atalhos globais.

### Fora
- **NÃO** remover o atalho — o toggle de Dev mode é útil. Apenas mover.
- **NÃO** unificar tudo em #010 — só este atalho específico migra.

## Arquivos afetados

- [src/App.vue](../../src/App.vue)
- [src/main.js](../../src/main.js) — adicionar registro de Ctrl+Alt+D.
- [src/lang/pt.json](../../src/lang/pt.json) e `es.json` — chave de tradução para a descrição (`hotkeys.ctrl_alt_d` ou similar).

## Plano de execução

1. **Branch:** `git checkout -b chore/102-remove-debug-app`

2. **Editar `App.vue`** — deixar mínimo:

   ```vue
   <template>
     <AppLoading />
     <v-app id="app-container">
       <router-view />
     </v-app>
   </template>

   <script>
   import AppLoading from "@/layout/Loading.vue";

   export default {
     name: "App",
     components: { AppLoading },
   };
   </script>

   <style>
   #app-container > div {
     height: 100vh;
   }
   </style>
   ```

3. **Adicionar atalho em `main.js`** dentro do bloco `Hotkeys.register(...)`:

   ```js
   Hotkeys.register("Ctrl+Alt+d", () => {
     Dev.toggle();   // ou Dev.toogle() até #008 mergear
   }, {
     context: "global",
     description: "hotkeys.ctrl_alt_d",
     group: "system",
     label: "Ctrl+Alt+D",
   });
   ```

   Confirmar que `Dev` já está importado em `main.js` (já está em [src/main.js:26](../../src/main.js#L26)).

4. **Adicionar tradução:**
   - `pt.json` → `"hotkeys.ctrl_alt_d": "Alterna o modo desenvolvedor"`
   - `es.json` → `"hotkeys.ctrl_alt_d": "Alterna el modo desarrollador"`

5. **Verificar:**
   ```bash
   npm run build
   npm run lint
   grep -rn "console.log" src/App.vue    # deve retornar 0
   ```

6. **Smoke:** rodar `npm run dev`, pressionar Ctrl+Alt+D, confirmar que módulo `dev` aparece/some.

7. **Commit + PR:**
   ```
   [102] Move Ctrl+Alt+D dev toggle from App.vue to Hotkeys system
   ```

## Validação

- [ ] App.vue não tem `console.log` nem método `handleKeydown`.
- [ ] App.vue não tem `<v-btn v-show="false">`.
- [ ] Ctrl+Alt+D continua alternando dev mode.
- [ ] `npm run build` e `lint` passam.
- [ ] Cheatsheet de Hotkeys (F1) mostra a entrada Ctrl+Alt+D.

## Riscos / atenções

- Confirmar que `Dev.toogle()` (com typo) ainda existe ou se já é `toggle()` após #008.
- Se atalho já estiver registrado em outro lugar, evitar duplicar — `grep -rn "ctrl.*alt.*d\|Ctrl\\+Alt" src/`.

## Referências

- Item original do audit: #102.
- [src/App.vue](../../src/App.vue)
- [src/main.js](../../src/main.js)

---

## Notas pós-execução

- **Branch:** `chore/102-remove-debug-app`
- **PR:** _(pendente push)_
- **Commit principal:** `44ccd55`
- **Surpresas:** Nenhuma. `this.$dev.toogle()` já estava corrigido para `toggle()` (pela task #008). O atalho Ctrl+Alt+D não estava duplicado em nenhum outro lugar. App.vue ficou com 22 linhas — estrutura mínima limpa.
- **Bônus:** Ctrl+Alt+D agora aparece no cheatsheet de atalhos (F1), o que era impossível via `v-shortkey`.
