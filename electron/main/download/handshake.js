"use strict";
const https = require("https");
const http = require("http");
const os = require("os");
const paths = require("../paths.js");
const apiClient = require("./api.js");

/**
 * Descobre endereço IP local (primeira interface não-loopback).
 */
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

function httpRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("Handshake timeout")));
  });
}

/**
 * Realiza handshake FTP: chama params → conn_ftp com payload base64 → recebe credenciais.
 *
 * @param {{ lang?: string, version?: string }} options
 * @returns {Promise<{host:string, port:number, username:string, password:string, root:string, msg?:string}>}
 */
async function getFtpCredentials({ lang = "PT", version = "1.27.0" } = {}) {
  const params = await apiClient.getParams();
  const connFtp = params.conn_ftp;
  if (!connFtp) throw new Error("conn_ftp ausente na resposta de params");

  // Formato do Delphi (fmAtualiza.pas:340-350): query-string com `&` (incluindo
  // o `&` inicial). O servidor PHP faz parse_str() no payload decoded —
  // separador `\n` jogava todo o conteúdo no primeiro campo.
  const payload =
    `&lang=${lang.toUpperCase()}` +
    `&version=${version}` +
    `&bin_version=${version}` +
    `&datetime=${new Date().toISOString().replace("T", " ").slice(0, 19)}` +
    `&ip=${getLocalIp()}` +
    `&directory=${paths.userData()}` +
    `&pc_name=${os.hostname()}`;

  const data = Buffer.from(payload, "utf-8").toString("base64");

  // Detectar se a URL já tem query string (ex: novo formato JWT vem com ?token=...)
  // e usar o separador apropriado
  const sep = connFtp.includes("?") ? "&" : "?";
  const url = `${connFtp}${sep}data=${encodeURIComponent(data)}&lang=${lang.toUpperCase()}`;

  console.log(`[handshake] Solicitando credenciais FTP: ${url.slice(0, 120)}...`);
  const response = await httpRequest(url, { "Api-Token": "02@v2nFB2Dc" });

  if (response.status !== 200) {
    const rawBody = response.body.toString("utf-8");
    console.error(`[handshake] HTTP ${response.status} — resposta crua: ${rawBody.slice(0, 500)}`);
    throw new Error(`Handshake FTP falhou: HTTP ${response.status}`);
  }

  const rawResponse = response.body.toString("utf-8").trim();
  console.log(`[handshake] Resposta crua (primeiros 200 chars): ${rawResponse.slice(0, 200)}`);

  let creds = null;

  // Tentar JSON primeiro (formato moderno do servidor)
  try {
    const json = JSON.parse(rawResponse);
    if (json.error) {
      throw new Error(`Servidor rejeitou: ${json.error}${json.details ? " — " + json.details : ""}`);
    }
    if (json.host && json.username && json.password) {
      creds = {
        host: json.host,
        port: parseInt(json.port || "21", 10),
        username: json.username,
        password: json.password,
        root: json.root || "/",
        msg: json.ftp_msg || json.msg || "",
      };
    }
  } catch (e) {
    // Não é JSON ou não tem credenciais — tentar formato Delphi (base64 + INI)
    if (e.message?.startsWith("Servidor rejeitou:")) throw e;
  }

  // Fallback: formato Delphi (base64 → INI)
  if (!creds) {
    try {
      const decoded = Buffer.from(rawResponse, "base64").toString("utf-8");
      console.log(`[handshake] Resposta decodificada (base64): ${decoded.slice(0, 300)}`);
      const ini = apiClient.parseIni(decoded);
      if (ini.host && ini.username && ini.password) {
        creds = {
          host: ini.host,
          port: parseInt(ini.port || "21", 10),
          username: ini.username,
          password: ini.password,
          root: ini.root || "/",
          msg: ini.ftp_msg || "",
        };
      }
    } catch (_) { /* ignore */ }
  }

  if (!creds) {
    throw new Error(
      `Resposta de handshake não reconhecida. Crua: ${rawResponse.slice(0, 200)}`
    );
  }

  return creds;
}

module.exports = { getFtpCredentials, getLocalIp };
