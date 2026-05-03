---
id: 007
title: Renomear helpers/String.js → Strings.js para evitar shadow do nativo
slug: rename-string-helper
category: refactor
wave: 1
model: sonnet
priority: P0
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: [7]
---

# [007] Renomear helpers/String.js → Strings.js para evitar shadow do nativo

## Contexto

O arquivo [src/helpers/String.js](../../src/helpers/String.js) (30 linhas) exporta utilitários de limpeza/ordenação de strings (`clean`, `sort`, etc.). Mas o nome do módulo é `String`, idêntico à classe nativa do JavaScript.

Em [src/main.js:27](../../src/main.js#L27) o import é:

```js
import String from "@/helpers/String";
```

Dentro do módulo, isso **sombra** a classe nativa `String`. Qualquer chamada como `String.fromCharCode(65)`, `String.prototype`, ou simplesmente declarar `let s = String(123)` vai falhar com erro estranho ("string.fromCharCode is not a function") ou comportamento inesperado, porque o `String` resolvido no escopo é o helper do projeto.

Hoje o problema está latente: o helper só é importado em `main.js` e injetado como `$string` global. Mas qualquer dev novo que importar diretamente o helper em outro arquivo cria bug invisível. Risco real.

Solução simples: renomear o arquivo e o identificador para `Strings` (plural) — convenção comum para módulos utilitários (`Arrays`, `Objects`, `Numbers`).

## Objetivo

- Arquivo `src/helpers/String.js` renomeado para `src/helpers/Strings.js`.
- Todos os imports atualizados (provavelmente apenas `main.js`).
- Identificador local da variável `String` substituído por `Strings` em todos os locais.
- `grep -n "from.*helpers/String\"" src/` retorna 0.
- App continua funcionando idêntico (helper continua acessível como `this.$string` — não muda a API pública).

## Escopo

### Dentro
- Renomear arquivo `src/helpers/String.js` → `src/helpers/Strings.js`.
- Atualizar imports em qualquer arquivo que faça `from "@/helpers/String"`.
- Renomear o identificador local da import (`import String` → `import Strings`).
- Manter o registro em `globalProperties` como `$string` (sem plural) — não quebrar API pública neste momento.

### Fora (explícito)
- **NÃO renomear** o global `this.$string` para `this.$strings`. Isso afetaria todos os componentes — vira task separada.
- **NÃO mudar** a API interna do helper (métodos `clean`, `sort` continuam iguais).
- **NÃO converter** o helper para TypeScript — fica para Onda 4.
- **NÃO migrar** este helper para função pura ou named exports — fica para Onda 4.

## Arquivos afetados

- [src/helpers/String.js](../../src/helpers/String.js) → renomear para `src/helpers/Strings.js`.
- [src/main.js:27](../../src/main.js#L27) — atualizar import e usar `Strings` no `Object.assign`.

Verificar adicionalmente (devem retornar zero ou apenas o `main.js`):

```bash
grep -rn "@/helpers/String\"" src/
grep -rn "from.*helpers/String'" src/
```

## Pré-requisitos

- Branch base `main` atualizada.
- `npm install` rodado.
- App roda local: `npm run dev` abre em `http://localhost:5173` sem erro.

## Plano de execução

1. **Branch:**
   ```bash
   git checkout -b refactor/007-rename-string-helper
   ```

2. **Confirmar consumidores reais:**
   ```bash
   grep -rn "helpers/String" src/
   ```
   Esperado: apenas `src/main.js`.

3. **Renomear arquivo via git** (preserva history):
   ```bash
   git mv src/helpers/String.js src/helpers/Strings.js
   ```

4. **Editar `src/main.js`:**
   - Trocar `import String from "@/helpers/String";` → `import Strings from "@/helpers/Strings";`
   - No bloco `Object.assign(app.config.globalProperties, ...)`, trocar `$string: String,` → `$string: Strings,`.

5. **Confirmar zero referências antigas:**
   ```bash
   grep -rn "helpers/String\"" src/   # deve retornar 0
   grep -rn "import String from" src/  # deve retornar 0
   ```

6. **Rodar build e lint:**
   ```bash
   npm run build
   npm run lint
   ```

7. **Smoke manual:**
   - `npm run dev`
   - Abrir http://localhost:5173
   - Verificar que app carrega.
   - Abrir módulo `musics`, fazer uma busca — `$string.clean()` é usado em sort/filter.
   - Sem erros no DevTools console.

8. **Commit:**
   ```bash
   git add -A
   git commit -m "[007] Rename helpers/String.js to Strings.js to avoid native String shadow

   - Renames src/helpers/String.js -> src/helpers/Strings.js
   - Updates import identifier in src/main.js to avoid shadowing native String class
   - Public API ($string global) unchanged

   Closes plans/refactor-2026/tasks/007-rename-string-helper.md"
   ```

9. **Atualizar status:**
   - Editar [BACKLOG.md](../BACKLOG.md): linha 007 → `done`.
   - Adicionar `## Notas pós-execução` neste arquivo (commit hash, surpresas).

10. **Abrir PR:**
    ```bash
    git push -u origin refactor/007-rename-string-helper
    gh pr create --title "[007] Rename String.js helper to avoid native shadow" \
                 --body "Closes plans/refactor-2026/tasks/007-rename-string-helper.md"
    ```

## Validação

- [ ] `npm run build` passa.
- [ ] `npm run lint` passa sem novos warnings.
- [ ] `grep -rn "helpers/String\"" src/` retorna 0.
- [ ] `grep -rn "import String from" src/` retorna 0.
- [ ] App abre em dev, módulo `musics` faz busca normalmente.
- [ ] BACKLOG.md atualizado com status `done`.

## Riscos / atenções

- **Risco baixo.** Mudança mecânica. Se aparecer mais de um arquivo importando `helpers/String`, registrar e atualizar todos.
- Se algum test/snapshot existir referenciando o caminho antigo, atualizar (provavelmente não há testes hoje).
- Não confundir com `String` (nativo) durante busca: `grep "String"` retorna milhões de matches; usar `helpers/String` para filtrar.

## Referências

- Item original do audit: #7.
- [src/helpers/String.js](../../src/helpers/String.js)
- [src/main.js:27](../../src/main.js#L27)
- Convenção de nome plural para módulos utilitários: comum em libs como Lodash, Underscore (`Strings`, `Arrays`, `Numbers`).

---

## Notas pós-execução

- **Branch:** `refactor/007-rename-string-helper`
- **PR:** _(pendente push)_
- **Commit principal:** `bf3d974`
- **Surpresas durante a execução:** Nenhuma. Único consumidor era `main.js`, exatamente como previsto.
- **Tasks novas geradas:** Nenhuma.
- **O que ficou para depois:**
  - Renomear `$string` → `$strings` (API pública) em task futura, junto com substituição de `globalProperties` por composables (#012).
