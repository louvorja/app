"use strict";

/**
 * Splash window — janela frameless 508×117 que aparece durante a inicialização.
 * Replica fmIniciando.dfm (Delphi): fundo #2D2D28, fade-in via AlphaBlend, mensagem
 * "Inicializando programa..." e fecha automaticamente após a janela principal abrir.
 *
 * Uso:
 *   const splash = require("./splash.js");
 *   const win = splash.show();
 *   ...
 *   splash.close();
 */

const { BrowserWindow, screen } = require("electron");
const path = require("path");

let splashWindow = null;

function show() {
  if (splashWindow && !splashWindow.isDestroyed()) return splashWindow;

  // Centralizar na tela primária
  const primary = screen.getPrimaryDisplay();
  const w = 508;
  const h = 117;
  const x = Math.round(primary.bounds.x + (primary.workAreaSize.width - w) / 2);
  const y = Math.round(primary.bounds.y + (primary.workAreaSize.height - h) / 2);

  splashWindow = new BrowserWindow({
    width: w,
    height: h,
    x,
    y,
    frame: false,
    transparent: false,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: "#2D2D28",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  splashWindow.loadFile(path.join(__dirname, "..", "splash.html"));

  splashWindow.once("ready-to-show", () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.show();
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });

  return splashWindow;
}

function close() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    // Fade-out suave: dá um pequeno delay para a animação CSS terminar
    try {
      splashWindow.webContents.executeJavaScript(
        "document.getElementById('splash-root')?.classList.add('splash--leaving');",
      ).catch(() => { /* ignore */ });
    } catch (_) { /* ignore */ }

    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      splashWindow = null;
    }, 280);
  }
}

function isOpen() {
  return !!(splashWindow && !splashWindow.isDestroyed());
}

module.exports = { show, close, isOpen };
