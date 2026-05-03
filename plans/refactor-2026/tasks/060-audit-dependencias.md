---
id: 060
title: Auditar dependências (webfontloader, core-js, etc)
slug: audit-dependencias
category: tooling
wave: 2
model: sonnet
priority: P3
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: [60]
---

# [060] Auditar dependências

## Contexto

O `package.json` tem dependências suspeitas ou potencialmente desnecessárias:

| Dep | Versão | Suspeita |
|-----|--------|----------|
| `webfontloader` | `^1.0.0` | Desatualizado (última release 2017). Vite serve fontes diretamente. |
| `core-js` | `^3.40.0` | Polyfills para browsers antigos — necessário com Vite targeting modern browsers? |
| `roboto-fontface` | `*` | Range `*` é perigoso. Usada em algum lugar? Vuetify inclui Roboto. |
| `vue-country-flag-next` | `^2.3.2` | Necessária? Onde é usada? |
| `vue-json-pretty` | `^2.4.0` | Necessária? Dev-only? |
| `dotenv` | `^17.3.1` | Vite carrega `.env` automaticamente — para que serve `dotenv` como dependência? |
| `archiver` | `^7.0.1` | Electron-only. Está no `dependencies` não `devDependencies`. |
| `express` | `^4.22.1` | Electron-only. Mesmo problema. |
| `electron-updater` | `^6.8.3` | Electron-only em `dependencies`. |
| `basic-ftp` | `^5.0.5` | Electron-only em `dependencies`. |

## Objetivo

- Para cada dependência listada: confirmar se é necessária, onde é usada, e se está no campo correto (`dependencies` vs `devDependencies`).
- Remover dependências realmente não usadas.
- Mover deps Electron-only para seção adequada (ou manter em `dependencies` se o build Electron precisar, documentar o porquê).
- Corrigir `roboto-fontface: "*"` para versão específica ou remover.

## Escopo

### Dentro
- Inventariar uso de cada dependência suspeita.
- Remover as desnecessárias.
- Corrigir versões com `*`.

### Fora
- **NÃO** atualizar todas as dependências — apenas limpar as suspeitas.
- **NÃO** fazer upgrade de versões estáveis.

## Arquivos afetados

- `package.json`
- `package-lock.json` (gerado pelo npm)

## Plano de execução

1. **Branch:** `git checkout -b chore/060-audit-dependencias`

2. **Para cada dep suspeita, verificar uso:**
   ```bash
   # webfontloader
   grep -rn "webfontloader\|WebFont" src/ --include="*.js" --include="*.vue"
   
   # core-js
   grep -rn "core-js\|require.*core-js" src/ vite.config.js
   
   # roboto-fontface
   grep -rn "roboto-fontface\|Roboto" src/ --include="*.css" --include="*.js" --include="*.vue"
   
   # vue-country-flag-next
   grep -rn "country-flag\|CountryFlag\|vue-country-flag" src/ --include="*.vue" --include="*.js"
   
   # vue-json-pretty
   grep -rn "vue-json-pretty\|JsonPretty\|json-pretty" src/ --include="*.vue" --include="*.js"
   
   # dotenv
   grep -rn "require.*dotenv\|import.*dotenv" src/ electron/
   
   # archiver, express, electron-updater, basic-ftp
   grep -rn "archiver\|express\|electron-updater\|basic-ftp" electron/ src/ --include="*.js" --include="*.cjs"
   ```

3. **Decisões esperadas:**
   - `webfontloader`: provavelmente legado do setup inicial. Se não usado em código → remover.
   - `core-js`: Vite não precisa para modern browsers. Se não há `import "core-js"` → remover.
   - `roboto-fontface: "*"`: Vuetify já inclui Roboto. Verificar se há import explícito. Se não → remover.
   - `vue-country-flag-next`: verificar em módulo de idioma/settings.
   - `vue-json-pretty`: pode estar em módulo dev ou debugger. Se dev-only → mover para `devDependencies`.
   - `dotenv`: Vite carrega `.env` automaticamente em dev. Mas pode ser usado no `electron/main.cjs`. Verificar.
   - `archiver`, `express`, `electron-updater`, `basic-ftp`: Electron-only. Em produção web não precisam. Mas se o `package.json` for o mesmo para web e desktop, precisam ficar em `dependencies`. Documentar esse trade-off.

4. **Para cada dep a remover:**
   ```bash
   npm uninstall <package>
   ```

5. **Para cada dep a mover para devDependencies:**
   ```bash
   npm uninstall <package>
   npm install -D <package>
   ```

6. **Corrigir roboto-fontface:**
   ```bash
   npm info roboto-fontface version   # ver versão atual
   # Se remover: npm uninstall roboto-fontface
   # Se manter: npm install roboto-fontface@<versão-específica>
   ```

7. **Verificar:**
   ```bash
   npm run build    # web/PWA build
   npm run dev      # dev server
   ```

8. **Commit + PR:**
   ```
   [060] Remove unused dependencies and fix package.json cleanup
   ```

## Validação

- [ ] `package.json` não tem `roboto-fontface: "*"`.
- [ ] Dependências removidas não causam erro de import no `npm run build`.
- [ ] `npm run dev` funciona.
- [ ] Cada decisão de remover/manter está comentada no PR description.

## Riscos / atenções

- **`webfontloader`** pode estar sendo carregado via CDN ou referenciado em `index.html` — verificar além de `src/`.
- **Electron deps em `dependencies`**: o electron-builder precisa que deps do main process estejam em `dependencies` (não `devDependencies`) para incluir no `node_modules` do app empacotado. Não mover `basic-ftp`, `express`, etc. para devDeps sem verificar a config do electron-builder.

## Referências

- Item audit: #60.

---

## Notas pós-execução

- **Removidas (4):** `core-js`, `roboto-fontface`, `dotenv`, `archiver`
  - `core-js`: zero imports no projeto; Vite não precisa de polyfills para modern browsers.
  - `roboto-fontface`: Roboto é carregado via Google Fonts CDN pelo `webfontloader`; o pacote npm não era importado em lugar algum.
  - `dotenv`: Vite carrega `.env` automaticamente; nenhum `require("dotenv")` ou `import dotenv` encontrado.
  - `archiver`: zero referências em qualquer arquivo (electron/ ou src/).
- **Mantidas em `dependencies`:**
  - `webfontloader`: usado em `src/plugins/webfontloader.js`.
  - `vue-country-flag-next`: usado em `src/components/LanguageSelector.vue`.
  - `vue-json-pretty`: usado em `src/modules/core/dev/interface/Index.vue`.
  - `express`, `basic-ftp`, `electron-updater`: Electron-only; devem permanecer em `dependencies` para o electron-builder incluir no bundle do app desktop.
- **Build:** passa sem erros após as remoções.
- **`roboto-fontface: "*"`:** removida (vide item acima).
