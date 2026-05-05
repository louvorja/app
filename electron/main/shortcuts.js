"use strict";

/**
 * shortcuts.js — Atalhos globais OS-level via globalShortcut do Electron (D6).
 *
 * Estes atalhos funcionam mesmo quando:
 * - O app está minimizado
 * - A janela de projeção (monitor 2) está em foco
 * - Outra aplicação (OBS, PowerPoint) está em foco
 *
 * Diferença de vue3-shortkey (já usado no renderer):
 * - vue3-shortkey só funciona quando uma janela do app está em foco
 * - globalShortcut funciona system-wide (mesmo com app em background)
 *
 * Por padrão DESATIVADO — o usuário liga manualmente pelo módulo Transmissão.
 * Só teclas de mídia são registradas para evitar conflito com PowerPoint/OBS.
 */

const { globalShortcut, BrowserWindow } = require("electron");

/** @type {BrowserWindow | null} */
let _mainWindow = null;

/** @type {Set<string>} */
let _registered = new Set();

let _enabled = false;

/**
 * Define a janela principal. Chamado imediatamente após createWindow() no main.cjs.
 * @param {BrowserWindow} win
 */
function setMainWindow(win) {
  _mainWindow = win;
}

/**
 * Despacha uma ação para a janela em foco (se for nossa) ou para a main.
 * As janelas escutam via Shortcuts.js no renderer (ipcRenderer.on("shortcut")).
 *
 * @param {string} action  Ex: "slide:next", "audio:toggle"
 * @param {object} [payload]
 */
function dispatch(action, payload = {}) {
  // Prioridade 1: janela do nosso app que está em foco
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) {
    focused.webContents.send("shortcut", { action, payload });
    return;
  }

  // Prioridade 2: janela principal (app pode estar em background)
  if (_mainWindow && !_mainWindow.isDestroyed()) {
    _mainWindow.webContents.send("shortcut", { action, payload });
  }
}

/**
 * Mapa de accelerators do Electron → ação despachada ao renderer.
 *
 * Somente teclas de mídia por padrão — não conflitam com PowerPoint/OBS/F-keys.
 * Accelerators válidos: https://www.electronjs.org/docs/latest/api/accelerator
 *
 * F-keys e PageUp/PageDown NÃO estão aqui propositalmente:
 * elas continuam funcionando via vue3-shortkey (in-window only).
 */
const SHORTCUTS = {
  MediaNextTrack: "slide:next",
  MediaPreviousTrack: "slide:prev",
  MediaPlayPause: "audio:toggle",
};

/**
 * Registra TODOS os atalhos globais.
 * Idempotente: se já habilitado, retorna { ok: true, already: true }.
 *
 * @returns {{ ok: boolean, already?: boolean, registered: string[], failed: string[] }}
 */
function enable() {
  if (_enabled) {
    return { ok: true, already: true, registered: Array.from(_registered), failed: [] };
  }

  const failed = [];

  for (const [accelerator, action] of Object.entries(SHORTCUTS)) {
    try {
      const ok = globalShortcut.register(accelerator, () => dispatch(action));
      if (ok) {
        _registered.add(accelerator);
      } else {
        failed.push(accelerator);
        console.warn(`[shortcuts] Atalho "${accelerator}" não registrado (conflito ou inválido)`);
      }
    } catch (e) {
      failed.push(accelerator);
      console.warn(`[shortcuts] Erro ao registrar "${accelerator}": ${e.message}`);
    }
  }

  _enabled = true;
  console.log(`[shortcuts] ${_registered.size} atalho(s) global(is) ativo(s):`, Array.from(_registered));

  return { ok: true, registered: Array.from(_registered), failed };
}

/**
 * Desregistra todos os atalhos globais.
 * Idempotente: se já desativado, retorna sem fazer nada.
 *
 * @returns {{ ok: boolean }}
 */
function disable() {
  if (!_enabled) return { ok: true };
  globalShortcut.unregisterAll();
  _registered.clear();
  _enabled = false;
  console.log("[shortcuts] Atalhos globais desativados");
  return { ok: true };
}

/**
 * Retorna o estado atual dos atalhos.
 *
 * @returns {{ enabled: boolean, registered: string[] }}
 */
function status() {
  return {
    enabled: _enabled,
    registered: Array.from(_registered),
  };
}

module.exports = { enable, disable, status, setMainWindow, dispatch, SHORTCUTS };
