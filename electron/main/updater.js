"use strict";

/**
 * updater.js — Auto-update do app via electron-updater (D8).
 *
 * Fluxo:
 *   1. init() é chamado após a janela principal ser criada (apenas em produção).
 *   2. 5s após o boot, verifica se há versão nova no GitHub Releases.
 *   3. Se autoDownload=true, baixa em background e notifica o renderer.
 *   4. Ao reiniciar, instala automaticamente (autoInstallOnAppQuit=true).
 *
 * Estado emitido ao renderer via IPC "updater:state":
 *   { status, version, newVersion, releaseNotes, progress, error }
 *
 * Status possíveis:
 *   idle | checking | available | not-available | downloading | downloaded | error
 */

// IMPORTANTE: NÃO importar electron-updater no top-level — ele tenta acessar
// app.getVersion() durante a importação, antes do app estar pronto.
// Lazy require dentro de init() resolve.
const { app } = require("electron");

let autoUpdater = null;

/** @type {import("electron").BrowserWindow | null} */
let _mainWindow = null;

/** @type {{ status: string, version: string, newVersion: string|null, releaseNotes: string|null, progress: number, error: string|null }} */
let _state = {
  status: "idle",
  version: "0.0.0", // Atualizado em init() quando app está pronto
  newVersion: null,
  releaseNotes: null,
  progress: 0,
  error: null,
};

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function _emit() {
  if (_mainWindow && !_mainWindow.isDestroyed()) {
    _mainWindow.webContents.send("updater:state", { ..._state });
  }
}

function _setState(patch) {
  _state = { ..._state, ...patch };
  _emit();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Registra a janela principal para receber eventos de update via IPC push.
 * Deve ser chamado logo após createWindow().
 *
 * @param {import("electron").BrowserWindow} win
 */
function setMainWindow(win) {
  _mainWindow = win;
}

/**
 * Inicializa o autoUpdater.
 * Deve ser chamado apenas em produção (app.isPackaged === true).
 *
 * @param {{ channel?: string, autoCheck?: boolean, autoDownload?: boolean }} opts
 */
function init({ channel = "latest", autoCheck = true, autoDownload = true } = {}) {
  // Lazy require — só agora que `app` está pronto
  if (!autoUpdater) {
    autoUpdater = require("electron-updater").autoUpdater;
  }
  _state.version = app.getVersion();

  // Logger leve — redireciona para console para aparecer nos logs do Electron
  autoUpdater.logger = {
    info:  (msg) => console.log("[updater]", msg),
    warn:  (msg) => console.warn("[updater]", msg),
    error: (msg) => console.error("[updater]", msg),
    debug: (msg) => console.debug("[updater]", msg),
  };

  autoUpdater.channel = channel;
  autoUpdater.autoDownload = autoDownload;
  autoUpdater.autoInstallOnAppQuit = true;

  // ----- Eventos -----------------------------------------------------------

  autoUpdater.on("checking-for-update", () => {
    _setState({ status: "checking", error: null });
  });

  autoUpdater.on("update-available", (info) => {
    _setState({
      status: "available",
      newVersion: info.version,
      releaseNotes: typeof info.releaseNotes === "string" ? info.releaseNotes : null,
    });
  });

  autoUpdater.on("update-not-available", () => {
    _setState({ status: "not-available" });
  });

  autoUpdater.on("error", (err) => {
    _setState({ status: "error", error: err?.message || String(err) });
  });

  autoUpdater.on("download-progress", (progressInfo) => {
    _setState({
      status: "downloading",
      progress: Math.round(progressInfo.percent),
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    _setState({
      status: "downloaded",
      newVersion: info.version,
      progress: 100,
    });
  });

  // ----- Auto-check após boot ----------------------------------------------

  if (autoCheck) {
    setTimeout(() => {
      try {
        autoUpdater.checkForUpdates();
      } catch (e) {
        _setState({ status: "error", error: e.message });
      }
    }, 5000);
  }

  console.log("[updater] Inicializado. Canal:", channel, "| autoDownload:", autoDownload);
}

/**
 * Verifica manualmente se há atualização disponível.
 * Pode ser chamado mesmo se autoCheck=false.
 *
 * @returns {Promise<{ ok: boolean, state: object, error?: string }>}
 */
async function checkForUpdates() {
  if (!autoUpdater) return { ok: false, error: "Updater não inicializado (apenas em produção)" };
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true, state: { ..._state } };
  } catch (e) {
    _setState({ status: "error", error: e.message });
    return { ok: false, error: e.message };
  }
}

/**
 * Inicia o download da atualização disponível.
 * Relevante quando autoDownload=false.
 *
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function downloadUpdate() {
  if (!autoUpdater) return { ok: false, error: "Updater não inicializado" };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (e) {
    _setState({ status: "error", error: e.message });
    return { ok: false, error: e.message };
  }
}

/**
 * Fecha o app e instala a atualização baixada.
 * Deve ser chamado apenas quando status === "downloaded".
 */
function quitAndInstall() {
  if (!autoUpdater) return;
  autoUpdater.quitAndInstall();
}

/**
 * Retorna o estado atual do updater (snapshot, não reativo).
 *
 * @returns {object}
 */
function status() {
  return { ..._state };
}

module.exports = {
  init,
  setMainWindow,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
  status,
};
