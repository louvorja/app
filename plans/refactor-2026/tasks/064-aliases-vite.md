---
id: 064
title: Adicionar aliases Vite (@helpers, @modules, @components)
slug: aliases-vite
category: tooling
wave: 2
model: sonnet
priority: P3
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [64]
---

# [064] Adicionar aliases Vite

## Contexto

`vite.config.js` tem apenas o alias `@` → `src/`. Imports como `import $database from "@/helpers/Database"` funcionam mas ainda são prolixos. Com aliases dedicados (`@helpers`, `@modules`, `@components`) os imports ficam mais limpos e explícitos.

Exemplo atual:
```js
import $database from "@/helpers/Database";
import $appdata from "@/helpers/AppData";
```

Com alias:
```js
import $database from "@helpers/Database";
import $appdata from "@helpers/AppData";
```

Impacto: legibilidade e facilidade de mover helpers sem atualizar paths relativos.

## Escopo

### Dentro
- Adicionar aliases em `vite.config.js`.
- Adicionar aliases em `jsconfig.json` (para IntelliSense VSCode funcionar).
- **Não** migrar imports existentes — isso fica para #097 (padronizar imports).

### Fora
- **NÃO** substituir o alias `@` existente — mantê-lo para compatibilidade retroativa.
- **NÃO** atualizar todos os imports agora — essa task é apenas infraestrutura.

## Arquivos afetados

- `vite.config.js`
- `jsconfig.json` (criar se não existir)

## Plano de execução

1. **Branch:** `git checkout -b chore/064-aliases-vite`

2. **Adicionar em `vite.config.js`:**
   ```js
   resolve: {
     alias: {
       "@": path.resolve(__dirname, "src"),
       "@helpers":    path.resolve(__dirname, "src/helpers"),
       "@components": path.resolve(__dirname, "src/components"),
       "@modules":    path.resolve(__dirname, "src/modules"),
       "@layout":     path.resolve(__dirname, "src/layout"),
       "@views":      path.resolve(__dirname, "src/views"),
       "@store":      path.resolve(__dirname, "src/store"),
       "@lang":       path.resolve(__dirname, "src/lang"),
     },
   },
   ```

3. **Criar/atualizar `jsconfig.json`** na raiz:
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*":          ["src/*"],
         "@helpers/*":   ["src/helpers/*"],
         "@components/*":["src/components/*"],
         "@modules/*":   ["src/modules/*"],
         "@layout/*":    ["src/layout/*"],
         "@views/*":     ["src/views/*"],
         "@store/*":     ["src/store/*"],
         "@lang/*":      ["src/lang/*"]
       }
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

4. **Verificar que build passa:**
   ```bash
   npm run build
   ```

5. **Testar um import** para confirmar que o alias funciona:
   ```bash
   # Em src/main.js, temporariamente adicionar um import com o novo alias
   # import test from "@helpers/AppData";
   # npm run dev → confirmar que não há erro de resolução
   # Reverter o import de teste
   ```

6. **Commit + PR:**
   ```
   [064] Add @helpers, @components, @modules and other Vite path aliases
   ```

## Validação

- [ ] `npm run build` passa.
- [ ] VSCode resolve `@helpers/AppData` sem underline vermelho (após reload).
- [ ] `npm run dev` funciona normalmente.

## Riscos / atenções

- **Conflito de alias com packages npm**: aliases como `@helpers` não conflitam com pacotes npm porque pacotes com escopo usam `@scope/package` (barra obrigatória). `@helpers/AppData` é resolvido pelo Vite antes de chegar ao npm.
- **TypeScript futuro**: quando #002 (TypeScript) for executado, o `jsconfig.json` vira `tsconfig.json` — estes aliases precisam ser migrados. A estrutura é idêntica, então é trivial.

## Referências

- Item audit: #64.
- Vite resolve alias: https://vite.dev/config/shared-options.html#resolve-alias

---

## Notas pós-execução

- **Branch:** `chore/064-aliases-vite`
- Aliases adicionados em `vite.config.js` e `jsconfig.json`: `@helpers`, `@components`, `@modules`, `@layout`, `@views`, `@store`, `@lang`.
- `jsconfig.json` já existia com `@/*` — apenas expandido com os novos paths.
- `npm run build` passa sem erros.
- Imports existentes não foram migrados (escopo da task #097).
