/**
 * Factory de BrowserWindows para o LouvorJA Electron.
 * Responsável por criar e configurar janelas com opções seguras e consistentes.
 * Fases posteriores (D4) vão adicionar factories para janelas de projeção/retorno.
 */

const { BrowserWindow, shell } = require("electron");
const path = require("path");

/**
 * Cria a janela principal do LouvorJA.
 *
 * @param {string} devUrl    URL do dev server (ex: "http://localhost:5002")
 * @param {string} prodHtmlPath  Caminho absoluto para dist/index.html
 * @param {string} preloadPath   Caminho absoluto para o preload.cjs
 * @returns {BrowserWindow}
 */
function createMainWindow(devUrl, prodHtmlPath, preloadPath) {
  const isDev =
    process.env.ELECTRON_DEV === "1" ||
    !require("electron").app.isPackaged;

  // Caminho do ícone — em dev e prod, usa o PNG do logo do LouvorJA.
  const iconPath = isDev
    ? path.join(__dirname, "..", "..", "public", "ico", "favicon-180x180.png")
    : path.join(process.resourcesPath, "app.asar.unpacked", "public", "ico", "favicon-180x180.png");

  const win = new BrowserWindow({
    width: 1370,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "LouvorJA",
    icon: iconPath,
    show: false, // Mostrar só quando pronto (evita flash branco)
    backgroundColor: "#1b2a41",
    // Title bar custom (replicar Delphi):
    //  - Win/Linux: frameless, SystemBar customizada com botões funcionais
    //  - macOS: titleBarStyle "hiddenInset" mantém os stoplights mas esconde a barra,
    //           permitindo que a SystemBar customizada do app sirva como drag region
    //           sem duplicar o título.
    frame: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: process.platform === "darwin" ? { x: 8, y: 6 } : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Necessário para BroadcastChannel funcionar entre janelas
    },
  });

  // Mostrar janela assim que estiver pronta para renderizar (evita flash branco)
  win.once("ready-to-show", () => {
    win.show();
  });

  // Handler para window.open() — necessário para janelas popup e projeção.
  // Em D4, este handler vai ser expandido para abrir BrowserWindows em monitores específicos.
  win.webContents.setWindowOpenHandler(({ url }) => {
    // URLs externas abre no browser padrão do sistema
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const isLocalhost =
        url.startsWith("http://localhost") ||
        url.startsWith("http://127.0.0.1");

      if (!isLocalhost) {
        shell.openExternal(url);
        return { action: "deny" };
      }
    }

    // URLs internas (localhost ou file://) são abertas como novas BrowserWindows
    // com as mesmas webPreferences seguras.
    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        webPreferences: {
          preload: preloadPath,
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
        },
      },
    };
  });

  if (isDev) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(prodHtmlPath);
  }

  return win;
}

module.exports = { createMainWindow };
