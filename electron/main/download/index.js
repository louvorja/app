"use strict";
const apiClient = require("./api.js");
const handshake = require("./handshake.js");
const integrity = require("./integrity.js");
const { FtpQueue } = require("./ftpQueue.js");

let _activeQueue = null;

function setApiConfig(cfg) {
  apiClient.setConfig(cfg);
}

async function getParams(force = false) {
  return await apiClient.getParams({ force });
}

async function checkConnection() {
  try {
    const creds = await handshake.getFtpCredentials({ lang: "PT" });
    return { ok: true, host: creds.host, msg: creds.msg };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Inicia download de uma lista de arquivos. Retorna um id de queue.
 * Eventos via webContents.send("download:progress" | "download:file-done" | etc.)
 *
 * @param {Array<{remote:string, local:string, expectedSize?:number}>} files
 * @param {Electron.WebContents} webContents
 * @returns {Promise<{ queued: number }>}
 */
async function startDownload(files, webContents) {
  if (_activeQueue) throw new Error("Download já em andamento");

  // Filtrar arquivos já OK
  const { missing, damaged } = integrity.diff(files);
  const toDownload = [...missing, ...damaged];

  if (toDownload.length === 0) {
    return { queued: 0, message: "Todos os arquivos já estão atualizados" };
  }

  _activeQueue = new FtpQueue();
  _activeQueue.add(toDownload);

  _activeQueue.on("progress", (data) => webContents.send("download:progress", data));
  _activeQueue.on("file-done", (data) => webContents.send("download:file-done", data));
  _activeQueue.on("file-error", (data) => webContents.send("download:file-error", data));
  _activeQueue.on("queue-done", (data) => {
    webContents.send("download:queue-done", data);
    _activeQueue = null;
  });
  _activeQueue.on("queue-cancelled", () => {
    webContents.send("download:queue-cancelled");
    _activeQueue = null;
  });

  // Não await — queue roda em background, eventos reportam progresso
  _activeQueue.start();

  return { queued: toDownload.length };
}

function cancelDownload() {
  if (_activeQueue) {
    _activeQueue.cancel();
    return true;
  }
  return false;
}

function pauseDownload() {
  if (_activeQueue && !_activeQueue.paused) {
    _activeQueue.pause();
    return true;
  }
  return false;
}

function resumeDownload() {
  if (_activeQueue && _activeQueue.paused) {
    _activeQueue.resume();
    return true;
  }
  return false;
}

function isDownloading() {
  return !!(_activeQueue && _activeQueue.running);
}

function checkFiles(files) {
  return integrity.diff(files);
}

module.exports = {
  setApiConfig,
  getParams,
  checkConnection,
  startDownload,
  cancelDownload,
  pauseDownload,
  resumeDownload,
  isDownloading,
  checkFiles,
};
