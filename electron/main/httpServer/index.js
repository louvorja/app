"use strict";

/**
 * Servidor HTTP embarcado do LouvorJA (D5).
 *
 * Replica os endpoints do fmTransmitir.pas (Delphi) para que:
 * - Clientes celular possam controlar o app via HTTP
 * - OBS/Vmix possa capturar slides via URL
 * - O módulo remote_control continue funcionando como cliente
 *
 * Porta default: 7070 (compatibilidade Delphi)
 * Auth: token de 5 chars gerado no boot; bypass para localhost
 */

const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const paths = require("../paths.js");
const { setupAuth } = require("./auth.js");
const { setupRoutes } = require("./routes.js");

let _server = null;
let _port = 7070;
let _token = null;
let _mainWindow = null;

/**
 * Gera token aleatório de 5 chars em maiúsculas (A-Z0-9).
 * @returns {string}
 */
function generateToken() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/**
 * Inicia o servidor HTTP embarcado.
 * Se já estiver rodando, retorna o status atual sem reiniciar.
 *
 * @param {{ port?: number, mainWindow?: Electron.BrowserWindow }} opts
 * @returns {Promise<{ port: number, token: string }>}
 */
function start({ port = 7070, mainWindow } = {}) {
  if (_server) return Promise.resolve({ port: _port, token: _token });

  _port = port;
  _token = generateToken();
  _mainWindow = mainWindow;

  const app = express();

  // CORS — necessário para que clientes web possam chamar a API
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Api-Token");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // Middleware de autenticação por token (bypass para localhost)
  app.use(setupAuth(_token));

  // Rotas da API
  setupRoutes(app, { mainWindow: _mainWindow });

  // Arquivos estáticos — compatibilidade com index.htm do Delphi
  const staticDir = path.join(paths.userData(), "server");
  fs.ensureDirSync(staticDir);
  app.use(express.static(staticDir));

  return new Promise((resolve, reject) => {
    _server = app.listen(_port, "0.0.0.0", () => {
      console.log(`[httpServer] Servidor rodando em http://0.0.0.0:${_port} (token: ${_token})`);
      resolve({ port: _port, token: _token });
    });
    _server.on("error", reject);
  });
}

/**
 * Para o servidor HTTP. No-op se já parado.
 * @returns {Promise<void>}
 */
function stop() {
  return new Promise((resolve) => {
    if (!_server) return resolve();
    _server.close(() => {
      _server = null;
      _token = null;
      _mainWindow = null;
      console.log("[httpServer] Servidor parado.");
      resolve();
    });
  });
}

/**
 * Retorna o estado atual do servidor.
 * @returns {{ running: boolean, port: number|null, token: string|null }}
 */
function status() {
  return {
    running: !!_server,
    port: _server ? _port : null,
    token: _token,
  };
}

/**
 * Atualiza a referência à janela principal (necessário se a janela for recriada).
 * @param {Electron.BrowserWindow} win
 */
function setMainWindow(win) {
  _mainWindow = win;
}

module.exports = { start, stop, status, generateToken, setMainWindow };
