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
  const isWin = process.platform === "win32";
  const isLin = process.platform === "linux";
  // Em macOS Liquid Retina, o sistema aplica máscara de cantos arredondados
  // na NSWindow em kiosk, revelando o wallpaper nas bordas. Aumentamos a
  // janela alguns px para fora do display útil — os cantos arredondados
  // ficam fora da área visível e o conteúdo cobre 100% do que aparece.
  const overscan = fullscreen && isMac ? 24 : 0;

  // No Windows/Linux NÃO passar `fullscreen: true` no construtor com bounds
  // de monitor secundário: o Chromium frequentemente posiciona primeiro no
  // monitor primário e DEPOIS migra, deixando a janela "presa" no display
  // errado em alguns drivers de projetor. Estratégia mais determinística:
  // criar como borderless cobrindo os bounds exatos do display alvo, e em
  // ready-to-show aplicar setFullScreen(true). No macOS o `kiosk` no
  // construtor é o caminho correto (replica o Delphi instantaneamente).
  const useDeferredFullscreen = fullscreen && (isWin || isLin);
  const winOpts = {
    x: bounds.x - overscan,
    y: bounds.y - overscan,
    width: fullscreen ? bounds.width + overscan * 2 : (width || 800),
    height: fullscreen ? bounds.height + overscan * 2 : (height || 600),
    // No macOS, fullscreen padrão dispara animação de "espaço dedicado".
    // kiosk cobre TUDO (incluindo menu bar e dock) instantaneamente —
    // replica o comportamento Delphi.
    fullscreen: false,
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
    // Em fullscreen no Windows queremos que a janela viva fora do
    // taskbar (skipTaskbar) — evita acidentalmente trazer foco pra cá
    // e perder z-order no projetor.
    skipTaskbar: fullscreen && (isWin || isLin),
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

  // Em modo dev, abre DevTools automaticamente em janelas de projeção/operador.
  // Em janelas fullscreen/kiosk o atalho Ctrl+Shift+I não funciona (kiosk
  // bloqueia atalhos), então a única forma de inspecionar é abrir aqui.
  // Também abre se LJ_DEVTOOLS=1 estiver setado (debug pontual em prod).
  const _isDevMode =
    process.env.ELECTRON_DEV === "1" ||
    process.env.LJ_DEVTOOLS === "1" ||
    !require("electron").app.isPackaged;
  if (_isDevMode) {
    win.webContents.once("did-finish-load", () => {
      try { win.webContents.openDevTools({ mode: "detach" }); } catch (_) { /* ignore */ }
    });
  }

  // Atalho de emergência: Cmd/Ctrl+Shift+D abre/fecha DevTools mesmo em kiosk.
  // O kiosk bloqueia muitos atalhos do sistema; este é tratado ANTES de chegar
  // na página, via webContents.before-input-event.
  win.webContents.on("before-input-event", (_e, input) => {
    if (input.type !== "keyDown") return;
    const isToggleDevTools =
      (input.control || input.meta) && input.shift && input.key.toLowerCase() === "d";
    if (isToggleDevTools) {
      try {
        if (win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
        else win.webContents.openDevTools({ mode: "detach" });
      } catch (_) { /* ignore */ }
    }
  });

  if (fullscreen && isMac && overscan > 0) {
    // Reforça bounds expandidos depois do construtor — kiosk pode reescrever.
    win.setBounds({
      x: bounds.x - overscan,
      y: bounds.y - overscan,
      width: bounds.width + overscan * 2,
      height: bounds.height + overscan * 2,
    });
  }

  // Bloqueia zoom acidental (Ctrl+Wheel/Ctrl+= ) em janelas de projeção —
  // num projetor mal manuseado um Ctrl+roda pode mexer no fontSize.
  try {
    win.webContents.setVisualZoomLevelLimits(1, 1);
  } catch (_) { /* electron <17 */ }
  win.webContents.on("did-finish-load", () => {
    try { win.webContents.setZoomFactor(1); } catch (_) { /* ignore */ }
  });

  // setVisibleOnAllWorkspaces transforma o tipo do processo (UIElement),
  // o que ESCONDE o ícone do dock. Não usar.

  // Aplica fullscreen "borderless" no Windows/Linux DEPOIS da janela já
  // estar posicionada no monitor correto. Esta sequência é defensiva
  // contra drivers de projetor que demoram a "settle".
  function _applyDeferredFullscreen() {
    if (!useDeferredFullscreen || win.isDestroyed()) return;
    try {
      // Reforça posição/tamanho ANTES do fullscreen — alguns drivers de
      // projetor mexem nos bounds entre a criação e o primeiro paint.
      win.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      });
      win.setMenuBarVisibility(false);
      // setFullScreen(true) no Windows = borderless windowed cobrindo o monitor
      // (incluindo a taskbar). Mais previsível que mudar resolução.
      if (!win.isFullScreen()) win.setFullScreen(true);
    } catch (e) {
      console.warn(`[windowFactory] applyDeferredFullscreen ${feature}:`, e?.message || e);
    }
  }

  // Esperamos o primeiro paint do renderer antes de mostrar a janela —
  // assim ela nunca aparece "branca". `did-finish-load` é mais confiável
  // que `ready-to-show` para evitar flash em rotas com fonts/images grandes.
  let _shown = false;
  const showOnce = () => {
    if (_shown || win.isDestroyed()) return;
    _shown = true;
    win.showInactive();
    _applyDeferredFullscreen();
    if (fullscreen && (isWin || isLin)) {
      // No Windows o "always on top: screen-saver" é o único nível que
      // garante cobertura da taskbar quando o usuário marcou "Manter
      // barra de tarefas sempre visível". Em fullscreen real isso já é
      // o caso, mas alguns drivers de projetor perdem esse z-order ao
      // ressincronizar — força aqui.
      try { win.setAlwaysOnTop(true, "screen-saver"); } catch (_) { /* ignore */ }
    } else if (alwaysOnTop && !(fullscreen && isMac)) {
      // Em macOS+kiosk a janela já fica acima de tudo; setAlwaysOnTop("screen-saver")
      // adicional pode promover o processo a UIElement e sumir do dock.
      win.setAlwaysOnTop(true, "pop-up-menu");
    }
    // Não roubar foco do main window — `showInactive` já fez isso.
    // Mas precisamos garantir que a janela receba teclas (setas, Esc).
    // Em Windows um focus() explícito é necessário pra capturar input.
    if (isWin) {
      try { win.focus(); } catch (_) { /* ignore */ }
    }
  };
  win.webContents.once("did-finish-load", showOnce);
  win.once("ready-to-show", showOnce);

  // Reforço: alguns projetores HDMI "piscam" e o Windows pode tirar a
  // janela de fullscreen. Reaplica fullscreen quando o display volta a
  // estar disponível ou quando a janela ganha foco após perda.
  if (useDeferredFullscreen) {
    const _onDisplayChange = () => {
      if (win.isDestroyed()) return;
      const stillThere = screen.getAllDisplays().some((d) => d.id === target.id);
      if (!stillThere) {
        // Monitor sumiu — move pra qualquer outro disponível e reaplica fullscreen.
        const fallback = screen.getPrimaryDisplay();
        if (fallback && fallback.bounds) {
          try {
            win.setFullScreen(false);
            win.setBounds(fallback.bounds);
            win.setFullScreen(true);
          } catch (_) { /* ignore */ }
        }
      } else if (!win.isFullScreen()) {
        _applyDeferredFullscreen();
      }
    };
    screen.on("display-metrics-changed", _onDisplayChange);
    screen.on("display-removed", _onDisplayChange);
    screen.on("display-added", _onDisplayChange);
    win.on("closed", () => {
      screen.removeListener("display-metrics-changed", _onDisplayChange);
      screen.removeListener("display-removed", _onDisplayChange);
      screen.removeListener("display-added", _onDisplayChange);
    });
  }

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
    // Em produção carrega via custom protocol louvorja://app — origem
    // real (não null), habilita BroadcastChannel inter-window, fetch
    // relativo e secure context. router em hash mode preserva a rota.
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    win.loadURL(`louvorja://app/index.html#${cleanRoute}`);
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
