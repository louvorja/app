"use strict";
const { powerSaveBlocker } = require("electron");

let _id = null;

/**
 * Inicia bloqueio de power save (impede tela dormir, screensaver, suspender).
 * Usa "prevent-display-sleep" (mais conservador que "prevent-app-suspension").
 */
function start() {
  if (_id !== null && powerSaveBlocker.isStarted(_id)) {
    return { ok: true, alreadyStarted: true, id: _id };
  }
  try {
    _id = powerSaveBlocker.start("prevent-display-sleep");
    console.log(`[powerBlocker] Iniciado (id: ${_id})`);
    return { ok: true, id: _id };
  } catch (e) {
    console.error("[powerBlocker] Falha ao iniciar:", e);
    return { ok: false, error: e.message };
  }
}

function stop() {
  if (_id !== null) {
    try {
      powerSaveBlocker.stop(_id);
      console.log(`[powerBlocker] Parado (id: ${_id})`);
    } catch (e) {
      console.warn("[powerBlocker] Falha ao parar:", e.message);
    }
    _id = null;
  }
  return { ok: true };
}

function status() {
  return {
    active: _id !== null && powerSaveBlocker.isStarted(_id),
    id: _id,
  };
}

module.exports = { start, stop, status };
