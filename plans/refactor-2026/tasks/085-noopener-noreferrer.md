---
id: 085
title: Garantir noopener,noreferrer em popups
slug: noopener-noreferrer
category: seguranca
wave: seguranca
model: sonnet
priority: P2
estimate_hours: 0.5
status: done
depends_on: []
blocks: []
audit_items: [85]
---

# [085] noopener,noreferrer em popups

## Contexto

`window.open()` sem `noopener,noreferrer` permite que a janela aberta acesse `window.opener` da janela origem — vetor para tabnabbing. `target="_blank"` em links sem `rel="noopener noreferrer"` tem o mesmo problema.

## Objetivo

- Todos os `window.open()` incluem `'noopener,noreferrer'` no third arg.
- Todos os `target="_blank"` têm `rel="noopener noreferrer"`.

## Escopo

### Dentro
- `Popup.js`, qualquer caller direto de `window.open`.
- Templates `.vue` com `<a target="_blank">`.

### Fora
- **NÃO** mudar comportamento das popups — apenas hardening.

## Arquivos afetados

- [src/helpers/Popup.js](../../src/helpers/Popup.js)
- Audit via grep para `window.open` e `target="_blank"`.

## Plano de execução

1. Branch `sec/085-noopener`.
2. Audit:
   ```bash
   grep -rn "window\.open\|target=\"_blank\"" src/ --include="*.vue" --include="*.js"
   ```
3. Para cada `window.open(url, name)` → `window.open(url, name, 'noopener,noreferrer')`.
4. Para cada `target="_blank"` → adicionar `rel="noopener noreferrer"`.
5. Commit: `[085] Add noopener,noreferrer to popups and external links`.

## Validação

- [x] Todos os `window.open()` externos têm `"noopener,noreferrer"` no 3º arg.
- [x] `Popup.js` preservado sem noopener (Popup.vue precisa de `window.opener`).
- [x] Todos os `target="_blank"` têm `rel="noopener noreferrer"`.
- [x] `npm run build` passa.

## Referências

- Item audit: #85.
- OWASP: https://owasp.org/www-community/attacks/Reverse_Tabnabbing.
