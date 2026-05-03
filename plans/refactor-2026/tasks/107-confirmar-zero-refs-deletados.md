---
id: 107
title: Confirmar zero refs a TrayArea/Header/Apps/AppsRibbon/Menu/Main
slug: confirmar-zero-refs-deletados
category: dead-code
wave: convencao
model: sonnet
priority: P1
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [107]
---

# [107] Confirmar zero refs a layouts deletados

## Contexto

`git status` mostra arquivos deletados: `src/layout/Apps.vue`, `AppsRibbon.vue`, `Header.vue`, `Menu.vue`, `TrayArea.vue`, e `src/views/Main.vue`. Foram substituídos pelo novo layout (Ribbon nativo). Mas talvez haja imports residuais ou strings de path que ainda os referenciam.

## Objetivo

- Zero ocorrências de imports/strings desses arquivos no projeto.

## Escopo

### Dentro
- Audit de cada nome de arquivo deletado em `src/`.

### Fora
- Nada — task curta de validação.

## Arquivos afetados

- Audit em todo `src/`.

## Plano de execução

1. Branch `chore/107-zero-refs`.
2. Audit:
   ```bash
   for name in TrayArea Header Apps AppsRibbon Menu "views/Main"; do
     echo "=== $name ==="
     grep -rn "$name" src/ --include="*.vue" --include="*.js" | grep -v "//"
   done
   ```
3. Para cada match: avaliar se é ref legítima (ex: nome de variável "Header" descontextualizado) ou restante a remover.
4. Atualizar router/index.js se ainda referenciar `views/Main.vue`.
5. Commit: `[107] Remove residual refs to deleted layout files`.

## Validação

- [x] Audit retorna 0 refs ilegítimos (zero imports de Header/Menu/Apps/AppsRibbon/TrayArea/views/Main).
- [x] Matches encontrados são apenas: comentários CSS/HTML genéricos e componentes não relacionados (MusicMenuTable, showInMainMenu).
- [x] `npm run build` passa (verificado nas tasks anteriores desta sessão).

## Resultado do audit

| Nome buscado | Refs de import | Observação |
|---|---|---|
| `TrayArea` | 0 | Limpo |
| `Header` | 0 | Comentários CSS/HTML genéricos irrelevantes |
| `Apps` | 0 | Limpo |
| `AppsRibbon` | 0 | Limpo |
| `Menu` (import) | 0 | Matches são `MusicMenuTable`, `showInMainMenu`, comentários Delphi |
| `views/Main` | 0 | Limpo |

## Referências

- Item audit: #107.
