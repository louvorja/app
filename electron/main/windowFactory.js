"use strict";

/**
 * windowFactory.js — Factory para criar BrowserWindows em monitores específicos (D4).
 *
 * Mantém referência das janelas abertas por feature para evitar duplicatas.
 * Integra com displays.js para persistir preferências de monitor por feature.
 */

const { BrowserWindow, screen } = require("electron");
const displays = require("./displays.js");

/** Mantém referência das janelas abertas por feature, para evitar duplicatas */
const _openWindows = new Map();

/**
 * Cria uma BrowserWindow em um monitor específico, opcionalmente fullscreen.
 *
 * @param {object} options
 * @param {string} options.route           Ex: "/projection", "/operator"
 * @param {string} options.feature         Identificador único (chave em _openWindows e prefs)
 * @param {number} [options.monitorId]     ID do display Electron. Se omitido, usa preferência salva.
 * @param {boolean} [options.fullscreen=true]
 * @param {boolean} [options.frame=false]
 * @param {number} [options.width]         Largura quando não fullscreen
 * @param {number} [options.height]        Altura quando não fullscreen
 * @param {string} options.preloadPath
 * @param {string} [options.devUrl]        Em dev: http://localhost:5002
 * @param {string} [options.prodHtmlPath]  Em prod: dist/index.html
 * @returns {BrowserWindow}
 */
function openOnMonitor({ route, feature, monitorId, fullscreen = true, frame = false, preloadPath, devUrl, prodHtmlPath, width, height, alwaysOnTop = false }) {
  // Se já existe janela para essa feature, foca-a
  const existing = _openWindows.get(feature);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return existing;
  }

  // Decidir display alvo
  let target;
  if (monitorId !== undefined && monitorId !== null) {
    target = screen.getAllDisplays().find((d) => d.id === monitorId);
    if (target) displays.setPreferred(feature, monitorId);
  }
  if (!target) target = displays.getPreferred(feature);

  const bounds = target.bounds;
  const winOpts = {
    x: bounds.x,
    y: bounds.y,
    width: fullscreen ? bounds.width : (width || 800),
    height: fullscreen ? bounds.height : (height || 600),
    fullscreen,
    frame,
    alwaysOnTop,
    title: feature,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  };

  const win = new BrowserWindow(winOpts);

  win.once("ready-to-show", () => win.show());
  win.on("closed", () => _openWindows.delete(feature));

  // Carregar URL com route
  if (devUrl) {
    win.loadURL(`${devUrl}${route}`);
  } else if (prodHtmlPath) {
    // No build, history mode precisa do hash como fallback
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    win.loadFile(prodHtmlPath, { hash: cleanRoute });
  }

  _openWindows.set(feature, win);
  return win;
}

/**
 * Fecha a janela de uma feature, se existir.
 * @param {string} feature
 */
function close(feature) {
  const win = _openWindows.get(feature);
  if (win && !win.isDestroyed()) {
    win.close();
  }
}

/**
 * Lista features com janelas abertas.
 * @returns {string[]}
 */
function listOpen() {
  return Array.from(_openWindows.keys()).filter((k) => {
    const w = _openWindows.get(k);
    return w && !w.isDestroyed();
  });
}

/**
 * Retorna a BrowserWindow associada a uma feature (ou undefined).
 * @param {string} feature
 */
function getWindow(feature) {
  const w = _openWindows.get(feature);
  return w && !w.isDestroyed() ? w : null;
}

module.exports = { openOnMonitor, close, listOpen, getWindow };
