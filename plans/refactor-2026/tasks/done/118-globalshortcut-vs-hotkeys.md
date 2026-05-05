---
id: 118
title: Resolver conflito globalShortcut vs Hotkeys in-window
slug: globalshortcut-vs-hotkeys
category: electron
wave: electron
model: opus
priority: P1
estimate_hours: 2
status: todo
depends_on: [010]
blocks: []
audit_items: [118]
---

# [118] globalShortcut vs Hotkeys

## Contexto

Roadmap D6 define atalhos globais OS-level via `electron.globalShortcut`. Mas `Hotkeys.js` já registra atalhos in-window. Risco: o mesmo atalho registrado nos dois lugares causa double-fire ou comportamento inconsistente (atalho funciona quando app tem foco vs quando está minimizado).

Decisão: cada atalho é **global** (OS-level, funciona com app minimizado) OU **in-window** (só com foco). Documentar tabela de quais são quais.

## Objetivo

- Tabela de atalhos com classificação global/in-window.
- `Hotkeys.register` valida que não conflita com globalShortcut.
- Conflitos em runtime → log warn.

## Escopo

### Dentro
- Audit dos atalhos atuais.
- Decisão técnica caso a caso.
- Implementar checagem em `Hotkeys.register`.

### Fora
- **NÃO** implementar globalShortcut nesta task (isso é D6) — apenas garantir que coexistirá sem conflito.

## Arquivos afetados

- [src/helpers/Hotkeys.js](../../src/helpers/Hotkeys.js)
- [electron/main/shortcuts.js](../../electron/main/shortcuts.js) (D6 future)
- [src/main.js](../../src/main.js) (registro atual)

## Plano de execução

1. Branch `electron/118-shortcuts-conflict`.
2. Listar todos os Hotkeys.register em main.js:
   - F1, F5, F9, Ctrl+K, Ctrl+F, Esc, Ctrl+W, Ctrl+Shift+F2, Ctrl+Alt+D, Space, etc.
3. Para cada um: classificar:
   - **In-window** (só com foco): F5/F9 refresh, Ctrl+F search, Esc close, Ctrl+W close, Space play/pause.
   - **Global candidate** (OS-level futuro): Ctrl+ArrowLeft/Right (navegação durante apresentação), F1 cheatsheet, Ctrl+K palette.
4. Documentar a tabela em CLAUDE.md ou ARCHITECTURE.md.
5. Adicionar warning em `Hotkeys.register` se receber atalho marcado como "global candidate".
6. Commit: `[118] Document and prevent globalShortcut vs Hotkeys conflicts`.

## Validação

- [ ] Tabela de atalhos documentada.
- [ ] `Hotkeys.register` warna em conflito potencial.
- [ ] `npm run build` passa.

## Riscos / atenções

- **Coexistência**: in-window precisa funcionar quando app tem foco mesmo se há global registrado para mesmo atalho. Electron pode ou não delegar — testar.

## Referências

- Item audit: #118.
- Roadmap D6 — globalShortcut.
- [src/helpers/Hotkeys.js](../../src/helpers/Hotkeys.js) — recente (já implementado).
- Task #010 — unificação Hotkeys.
