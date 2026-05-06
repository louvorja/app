"use strict";

/**
 * identifyMonitors.js — Overlay "Monitor N" em cada display por X segundos (D4).
 *
 * Cria janelas transparentes sobrepostas em cada monitor com o número do display,
 * resolução e indicação de "Principal". Fecha automaticamente após o tempo definido.
 */

const { BrowserWindow, screen } = require("electron");

const _activeWindows = [];

/**
 * Mostra um overlay "Monitor N" em cada display por durationMs milissegundos.
 *
 * @param {number} durationMs  Duração em ms (padrão: 5000)
 * @returns {number} Quantidade de displays identificados
 */
function show(durationMs = 5000) {
  // Fechar overlays anteriores se houver
  hide();

  const allDisplays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();

  // Card pequeno no canto inferior direito de cada monitor (não ocupa a tela toda).
  const CARD_W = 320;
  const CARD_H = 200;
  const MARGIN = 40;

  allDisplays.forEach((display, i) => {
    const win = new BrowserWindow({
      x: display.bounds.x + display.bounds.width - CARD_W - MARGIN,
      y: display.bounds.y + display.bounds.height - CARD_H - MARGIN,
      width: CARD_W,
      height: CARD_H,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
      resizable: false,
      movable: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });

    win.setIgnoreMouseEvents(true);

    const isPrimary = display.id === primary.id;
    const label = isPrimary ? " — Principal" : "";
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html, body {
    margin: 0; padding: 0;
    width: 100vw; height: 100vh;
    background: transparent;
    color: white;
    font-family: -apple-system, system-ui, sans-serif;
    overflow: hidden;
    user-select: none;
    pointer-events: none;
  }
  .card {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    background: rgba(99, 102, 241, 0.92);
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .num {
    font-size: 7rem;
    font-weight: 100;
    line-height: 1;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
  .label {
    margin-top: 8px;
    font-size: 0.95rem;
    font-weight: 400;
    opacity: 0.85;
    text-align: center;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.75; }
  }
</style></head>
<body>
  <div class="card">
    <div class="num">${i + 1}</div>
    <div class="label">${display.bounds.width} \xD7 ${display.bounds.height}${label}</div>
  </div>
</body></html>`;

    win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
    _activeWindows.push(win);
  });

  setTimeout(hide, durationMs);
  return allDisplays.length;
}

/**
 * Fecha todos os overlays de identificação ativos imediatamente.
 */
function hide() {
  while (_activeWindows.length > 0) {
    const win = _activeWindows.pop();
    if (win && !win.isDestroyed()) {
      win.close();
    }
  }
}

module.exports = { show, hide };
