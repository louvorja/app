---
id: 008
title: Corrigir typo "toogle" → "toggle" em AppData.js (alias deprecated)
slug: fix-toogle-typo
category: refactor
wave: 1
model: sonnet
priority: P1
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: [8]
---

# [008] Corrigir typo `toogle` → `toggle` (com alias deprecated)

## Contexto

[src/helpers/AppData.js:51](../../src/helpers/AppData.js#L51) define o método com typo:

```js
toogle(param) {
  this.set(param, !this.get(param));
}
```

O typo se propagou para todos os consumidores que chamam `$appdata.toogle(...)`. Manter `toogle` é constrangedor e quebra autocomplete sério (procurar por `toggle` não acha nada). Mas renomear sem aviso quebra todos os consumidores em paralelo.

Solução: introduzir `toggle()` como nome principal, marcar `toogle()` como alias `@deprecated` que apenas chama `toggle()`. Migrar consumidores em onda(s) seguinte(s); remover o alias depois.

## Objetivo

- `AppData.js` expõe `toggle()` como método principal.
- `toogle()` continua existindo, marcado `@deprecated`, redirecionando para `toggle()`.
- Console warning único (não em loop) quando `toogle()` é chamado em dev.
- Consumidores podem migrar gradualmente.

## Escopo

### Dentro
- Editar [src/helpers/AppData.js](../../src/helpers/AppData.js).
- Adicionar JSDoc `@deprecated` no `toogle`.
- Migrar consumidores **óbvios** que apareçam em ≤5 minutos de busca.

### Fora (explícito)
- **NÃO** migrar todos os consumidores agora — vira task de cleanup posterior (após 1 release).
- **NÃO** remover `toogle()`. Deletar fica para outra task quando contagem de consumidores for 0.
- **NÃO** mexer em outros typos do projeto — escopo é só este.

## Arquivos afetados

- [src/helpers/AppData.js](../../src/helpers/AppData.js)
- Outros arquivos descobertos pelo grep abaixo (geralmente componentes que chamam `$appdata.toogle`).

## Plano de execução

1. **Branch:** `git checkout -b refactor/008-fix-toogle-typo`

2. **Mapear consumidores:**
   ```bash
   grep -rn "\.toogle(" src/
   ```
   Listar resultados.

3. **Editar `AppData.js`:**

   ```js
   toggle(param) {
     this.set(param, !this.get(param));
   },

   /** @deprecated Use `toggle` (correct spelling). */
   toogle(param) {
     if (import.meta.env.DEV && !this._toogleWarned) {
       console.warn("[AppData] toogle() is deprecated; use toggle() instead.");
       this._toogleWarned = true;
     }
     return this.toggle(param);
   },
   ```

4. **Migrar consumidores óbvios** (substituições mecânicas):
   ```bash
   # Caso queira migrar todos de uma vez:
   grep -rln "\.toogle(" src/ | xargs sed -i '' 's/\.toogle(/\.toggle(/g'
   # Conferir cada arquivo modificado antes de commitar.
   ```

5. **Verificar build/lint:**
   ```bash
   npm run build
   npm run lint
   ```

6. **Smoke:** abrir o app, qualquer componente que use toggle de tema, layout ribbon/apps, etc. continua funcionando.

7. **Atualizar BACKLOG status `done`.**

8. **Commit + PR:**
   ```
   [008] Add toggle() to AppData with deprecated toogle() alias
   ```

## Validação

- [ ] `npm run build` passa.
- [ ] `npm run lint` passa.
- [ ] `AppData.toggle()` existe e funciona.
- [ ] `AppData.toogle()` ainda funciona, gera warning em dev, sem warning em prod.
- [ ] Smoke: tema escuro toggla, layout apps/ribbon toggla.

## Riscos / atenções

- O `_toogleWarned` é guarda contra spam — confirmar que não rompe se chamado em fluxo concorrente.
- Se houver chamadas em loop (ex: dentro de `setInterval`), warning aparece uma vez e some.

## Referências

- Item original do audit: #8.
- [src/helpers/AppData.js:51](../../src/helpers/AppData.js#L51)

---

## Notas pós-execução

- **Branch:** `refactor/008-fix-toogle-typo`
- **PR:** _(pendente push)_
- **Commit principal:** `6fc0f8f`
- **Surpresa:** `Dev.js` também tinha o mesmo typo (`toogle()`), não apenas `AppData.js`. Corrigido no mesmo PR.
- **Consumidores migrados nesta task:** 1 (`App.vue:25` → `this.$dev.toggle()`)
- **Consumidores remanescentes (toogle ainda chamado):** 0
- **Task de remoção do alias agendada para:** Pode ser feita em qualquer task de cleanup futuro (Onda 4). Aliases em `AppData.js` e `Dev.js` são dead code no momento.
