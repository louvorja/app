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

  allDisplays.forEach((display, i) => {
    const win = new BrowserWindow({
      x: display.bounds.x,
      y: display.bounds.y,
      width: display.bounds.width,
      height: display.bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      hasShadow: false,
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
    background: rgba(99, 102, 241, 0.85);
    color: white;
    font-family: -apple-system, system-ui, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    user-select: none;
    pointer-events: none;
  }
  .num {
    font-size: clamp(8rem, 30vw, 24rem);
    font-weight: 100;
    line-height: 1;
    text-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
    animation: pulse 1.5s ease-in-out infinite;
  }
  .label {
    position: fixed;
    bottom: 5vh;
    font-size: clamp(1rem, 3vw, 2rem);
    font-weight: 300;
    opacity: 0.7;
    text-align: center;
    width: 100vw;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
</style></head>
<body>
  <div class="num">${i + 1}</div>
  <div class="label">${display.bounds.width} \xD7 ${display.bounds.height}${label}</div>
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
