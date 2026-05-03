---
id: 081
title: Sanitizar inputs em Path.db() e Path.file()
slug: sanitizar-path-inputs
category: seguranca
wave: seguranca
model: sonnet
priority: P1
estimate_hours: 1
status: done
depends_on: []
blocks: []
audit_items: [81]
---

# [081] Sanitizar Path.db() e Path.file()

## Contexto

`Path.db(key)` e `Path.file(relPath)` constroem URLs concatenando input do caller com `VITE_URL_DATABASE` / `VITE_URL_FILES`. Sem sanitização, um caller malicioso (ou bug) poderia passar `../../../etc/passwd` ou `https://evil.com/x` e o helper retornaria URL inválida ou fora do escopo esperado.

Em PWA web isso tem impacto limitado (CORS protege), mas no Electron com custom protocol `louvorja://` (D2), path traversal pode acessar filesystem real.

## Objetivo

- `Path.db(key)`: aceita apenas `[a-zA-Z0-9_-]+`. Rejeita `..`, `/`, `\`, `:`.
- `Path.file(relPath)`: rejeita `..` e absolute paths.
- Inputs inválidos lançam exceção com mensagem clara.

## Escopo

### Dentro
- Validação por regex em ambas as funções.
- Tests unitários para casos válidos/inválidos (após #088).

### Fora
- **NÃO** mudar a API pública — apenas adicionar validação.

## Arquivos afetados

- [src/helpers/Path.js](../../src/helpers/Path.js)

## Plano de execução

1. Branch `sec/081-sanitizar-path`.
2. Adicionar guards:
   ```js
   db(key) {
     if (!/^[a-zA-Z0-9_-]+$/.test(key)) throw new Error(`Invalid db key: ${key}`);
     return `${VITE_URL_DATABASE}/${key}.json`;
   }
   file(relPath) {
     if (relPath.includes('..') || relPath.startsWith('/') || /^[a-z]+:\/\//i.test(relPath)) {
       throw new Error(`Invalid file path: ${relPath}`);
     }
     return `${VITE_URL_FILES}/${relPath}`;
   }
   ```
3. Smoke: app continua funcionando normalmente.
4. Commit: `[081] Sanitize Path.db() and Path.file() inputs`.

## Validação

- [x] `Path.db('../bad')` throws.
- [x] `Path.file('../etc/passwd')` throws.
- [x] `Path.db('musics_pt')` retorna URL correta.
- [x] `npm run build` passa.

## Riscos / atenções

- **Callers inválidos existentes**: se algum lugar passa `key` com hífen ou outro char, a validação quebra. Audit antes de finalizar.

## Referências

- Item audit: #81.
- [src/helpers/Path.js](../../src/helpers/Path.js)
