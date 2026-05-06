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
  const isMac = process.platform === "darwin";
  // Em macOS Liquid Retina, o sistema aplica máscara de cantos arredondados
  // na NSWindow em kiosk, revelando o wallpaper nas bordas. Aumentamos a
  // janela alguns px para fora do display útil — os cantos arredondados
  // ficam fora da área visível e o conteúdo cobre 100% do que aparece.
  const overscan = fullscreen && isMac ? 24 : 0;
  const winOpts = {
    x: bounds.x - overscan,
    y: bounds.y - overscan,
    width: fullscreen ? bounds.width + overscan * 2 : (width || 800),
    height: fullscreen ? bounds.height + overscan * 2 : (height || 600),
    // No macOS, fullscreen padrão dispara animação de "espaço dedicado".
    // kiosk cobre TUDO (incluindo menu bar e dock) instantaneamente —
    // replica o comportamento Delphi.
    fullscreen: fullscreen && !isMac,
    kiosk: fullscreen && isMac,
    enableLargerThanScreen: fullscreen && isMac,
    frame,
    alwaysOnTop,
    title: feature,
    show: false,
    autoHideMenuBar: true,
    roundedCorners: false, // Windows-only mas inofensivo nos demais
    // Preto evita o flash branco entre criar a janela e o renderer pintar o primeiro frame.
    backgroundColor: "#000000",
    transparent: false,
    hasShadow: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      // Garante que o renderer pinte antes da gente chamar show()
      paintWhenInitiallyHidden: true,
    },
  };

  const win = new BrowserWindow(winOpts);

  if (fullscreen && isMac && overscan > 0) {
    // Reforça bounds expandidos depois do construtor — kiosk pode reescrever.
    win.setBounds({
      x: bounds.x - overscan,
      y: bounds.y - overscan,
      width: bounds.width + overscan * 2,
      height: bounds.height + overscan * 2,
    });
  }

  // setVisibleOnAllWorkspaces transforma o tipo do processo (UIElement),
  // o que ESCONDE o ícone do dock. Não usar.

  // Esperamos o primeiro paint do renderer antes de mostrar a janela —
  // assim ela nunca aparece "branca". `did-finish-load` é mais confiável
  // que `ready-to-show` para evitar flash em rotas com fonts/images grandes.
  let _shown = false;
  const showOnce = () => {
    if (_shown || win.isDestroyed()) return;
    _shown = true;
    win.showInactive();
    if (alwaysOnTop && !(fullscreen && isMac)) {
      // Em macOS+kiosk a janela já fica acima de tudo; setAlwaysOnTop("screen-saver")
      // adicional pode promover o processo a UIElement e sumir do dock.
      // Em outros casos (Windows, ou janelas não-fullscreen), reforça o topo.
      win.setAlwaysOnTop(true, "pop-up-menu");
    }
    win.focus();
  };
  win.webContents.once("did-finish-load", showOnce);
  win.once("ready-to-show", showOnce);

  // Em modo kiosk (macOS) Cmd+Q e atalhos do sistema ficam bloqueados.
  // Esc fecha a janela como saída de emergência.
  if (fullscreen && isMac) {
    win.webContents.on("before-input-event", (_e, input) => {
      if (input.type === "keyDown" && input.key === "Escape") {
        win.close();
      }
    });
  }

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
