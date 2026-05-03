---
id: 009
title: Unificar Modules.js + ModuleManager.js
slug: unificar-modules-manager
category: arquitetura
wave: 3
model: opus
priority: P1
estimate_hours: 4
status: done
depends_on: []
blocks: []
audit_items: [9, 12]
---

# [009] Unificar Modules.js + ModuleManager.js

## Contexto

Dois helpers com responsabilidades sobrepostas:

**`Modules.js` (101 linhas)** — orquestra abertura/fechamento de módulos:
- `open(id)`, `close(id)`, `minimize(id)`, `maximize(id)` — lógica de visibilidade.
- Garante que só um módulo embedded está aberto por vez.
- Consulta `$appdata` para verificar se módulo está registrado.

**`ModuleManager.js` (117 linhas)** — instala/registra módulos:
- `install(module)` — registra módulo no store, carrega i18n, registra componente.
- `installAll()` — inicia o sistema de módulos.
- Também tem `open()` e parece ter overlap com `Modules.js`.

Resultado: há dois lugares para entender o lifecycle de um módulo — confuso para quem adiciona um módulo novo.

## Objetivo

- Clarificar fronteira: `ModuleManager.js` = lifecycle (install/register), `Modules.js` = runtime (open/close/visibility).
- Eliminar overlap de `open()` / `close()` duplicado.
- Consolidar documentação JSDoc.

## Escopo

### Dentro
- Ler ambos os arquivos completamente.
- Mover funções que estão no lugar errado.
- Garantir que `index.js` de cada módulo ainda funciona (chama `ModuleManager.install`).
- Sem mudança de API pública — callers devem continuar funcionando.

### Fora
- **NÃO** mesclar em um único arquivo se a separação lifecycle/runtime fizer sentido.
- **NÃO** mudar como módulos são registrados ou inicializados.

## Arquivos afetados

- `src/helpers/Modules.js`
- `src/helpers/ModuleManager.js`

## Plano de execução

1. **Branch:** `git checkout -b refactor/009-unificar-modules`

2. **Ler ambos os arquivos:**
   ```bash
   cat src/helpers/Modules.js
   cat src/helpers/ModuleManager.js
   ```

3. **Mapear responsabilidades reais** (não as supostas):
   - O que ModuleManager faz que Modules também faz?
   - O que Modules faz que não tem paralelo em ModuleManager?

4. **Decisão arquitetural:**
   - Se overlap real: mover código para o arquivo correto.
   - Se apenas nomes confusos: renomear e adicionar JSDoc claro.

5. **Verificar callers:**
   ```bash
   grep -rn "ModuleManager\|Modules\." src/ --include="*.js" --include="*.vue" | grep -v node_modules
   ```

6. **Implementar consolidação sem quebrar callers.**

7. **Commit + PR:**
   ```
   [009] Clarify boundary between Modules.js and ModuleManager.js
   ```

## Validação

- [ ] Sem `open()` duplicado entre os dois arquivos.
- [ ] JSDoc claro em ambos os arquivos sobre sua responsabilidade.
- [ ] `npm run dev`: abrir/fechar módulos funciona.
- [ ] `npm run build` e `lint` passam.

## Riscos / atenções

- **Ordem de inicialização**: `ModuleManager.installAll()` é chamado no boot em `main.js`. Qualquer mudança na sequência pode quebrar módulos que dependem de outros.

## Referências

- Item audit: #9, #12.
- Modules.js: [src/helpers/Modules.js](../../src/helpers/Modules.js)
- ModuleManager.js: [src/helpers/ModuleManager.js](../../src/helpers/ModuleManager.js)

---

## Notas pós-execução

### Diagnóstico

A tarefa assumia sobreposição de `open()` entre os dois arquivos — não existe. O `ModuleManager.js` real não tem `open()`. As responsabilidades já eram distintas; faltava apenas clareza e havia dead code.

**Dead code removido de `ModuleManager.js`:**
- `modules: new Map()` — populado exclusivamente pelo `register()` abaixo; nunca lido externamente
- `manifests: new Map()` — declarado, jamais populado  
- `register(moduleName, module)` — nunca chamado em lugar algum (nem de `init()`, nem de callers externos)

**Bug corrigido:**
- `moduleGroups[category].modules` explodia com TypeError se um módulo declarasse uma `category` fora de {musics, bible, utilities}. Adicionado guard com criação dinâmica da categoria.

**JSDoc:**
- Ambos os arquivos receberam cabeçalho explícito de responsabilidade com referência cruzada ("NÃO faz X — isso é Y.js").

### Boundary final
| Arquivo | Quando age | O que faz |
|---|---|---|
| `ModuleManager.js` | Boot (uma vez) | Descobre módulos via glob, valida, escreve estado inicial no $appdata, carrega i18n e customization defaults |
| `Modules.js` | Runtime (sempre) | Lê/escreve `$appdata.modules.<id>.show` para abrir/fechar, consulta estado, ordena lista |
