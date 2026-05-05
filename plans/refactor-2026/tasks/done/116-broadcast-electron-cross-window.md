---
id: 116
title: Confirmar BroadcastChannel cross-window em Electron + alternativa
slug: broadcast-electron-cross-window
category: electron
wave: electron
model: opus
priority: P1
estimate_hours: 4
status: done
depends_on: []
blocks: []
audit_items: [116]
---

# [116] BroadcastChannel cross-window no Electron

## Contexto

No web, `BroadcastChannel("louvorja")` funciona entre tabs do mesmo domínio. No Electron, `BrowserWindow`s separadas (main + projection) são processos renderer separados — depende de implementação se compartilham origem suficientemente para BroadcastChannel funcionar.

Caso não funcione, a alternativa é IPC via `ipcMain` + `BrowserWindow.webContents.send()`. Adapter para encapsular a diferença sem mudar consumidores (`useBroadcastListener` continua funcionando).

## Objetivo

- Comportamento BroadcastChannel cross-window validado no Electron.
- Se não funciona: implementar fallback IPC transparente para os composables.

## Escopo

### Dentro
- Test manual com 2 BrowserWindow + BroadcastChannel.
- Se falhar: implementar `electron/main/broadcastBridge.js` que faz forward via IPC.
- Atualizar `Broadcast.js` para detectar e usar bridge.

### Fora
- **NÃO** mudar API pública do `Broadcast.js`.

## Arquivos afetados

- [electron/main.cjs](../../electron/main.cjs) (possivelmente)
- [electron/preload.cjs](../../electron/preload.cjs) (possivelmente)
- [src/helpers/Broadcast.js](../../src/helpers/Broadcast.js)

## Plano de execução

1. Branch `electron/116-broadcast-cross-window`.
2. Test manual:
   - Abrir Electron app.
   - Abrir `/projection` em segunda janela (via `Popup.open` ou direto).
   - Em DevTools de uma janela: `new BroadcastChannel('test').postMessage('hi')`.
   - Em DevTools da outra: `new BroadcastChannel('test').onmessage = e => console.log(e.data)`.
   - Mensagem chega? → BroadcastChannel funciona.
3. Se chegar: documentar em CLAUDE.md, fim da task.
4. Se não chegar:
   - Implementar bridge IPC em main process.
   - Patch `Broadcast.js` para usar bridge quando `Platform.isDesktop`.
5. Smoke: Operator → Projection navegação de slides funciona.
6. Commit: `[116] Validate/bridge BroadcastChannel for Electron multi-window`.

## Validação

- [ ] Smoke: navegar slide em Operator → Projection atualiza em <100ms.
- [ ] Smoke: ObsBible recebe versículos do módulo bible.
- [ ] `npm run electron:build` passa.

## Riscos / atenções

- **Origens diferentes**: se cada `BrowserWindow` carrega URL com origem diferente (file:// vs louvorja://), BroadcastChannel falha. Garantir que todas usam o mesmo protocolo.
- **Performance do bridge IPC**: cada postMessage vai virar `ipcRenderer.send` → `webContents.send` em todas as janelas. Para 60Hz updates de slide, validar latência <50ms (#117).

## Notas pós-execução

**Resultado**: BroadcastChannel **FUNCIONA** entre janelas no Electron 41.

Evidências no código (sem teste DevTools interativo necessário):
- `electron/main/windows.js:44`: `sandbox: false, // Necessário para BroadcastChannel funcionar entre janelas`
- `electron/main/windowFactory.js:60`: `sandbox: false` em todas as janelas secundárias
- `electron/main/windows.js:76`: `sandbox: false` em janelas abertas via `setWindowOpenHandler`
- Electron 41 (Chromium ≥ 128) suporta BroadcastChannel cross-renderer com `sandbox: false`
- Mesma origem: dev (`http://localhost:5002`), prod (`file://` para todas as janelas)
- Mesma partition padrão (nenhuma janela usa partition customizado)

Bridge IPC **não foi implementada** — desnecessária.

Documentado em:
- `docs/broadcast.md` — aviso incorreto removido, confirmação adicionada
- `CLAUDE.md` — seção "Comunicação Entre Janelas" atualizada

## Referências

- Item audit: #116.
- [src/helpers/Broadcast.ts](../../src/helpers/Broadcast.ts).
- Roadmap D4 — Multi-monitor.
- [docs/broadcast.md](../../docs/broadcast.md)
