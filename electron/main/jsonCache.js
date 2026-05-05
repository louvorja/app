"use strict";

/**
 * jsonCache.js — Cache local de respostas JSON do servidor remoto.
 *
 * Salva cada arquivo JSON em userData/json_db/<caminho>.json com TTL diário.
 * Quando offline ou server retorna erro, serve o cache stale (melhor que falhar).
 *
 * Faz parte da Fase D2 — Cache de JSON do banco.
 */

const fs = require("fs-extra");
const path = require("path");
const https = require("https");
const http = require("http");
const paths = require("./paths.js");

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

/** Retorna o diretório de cache (avaliado em runtime para ter o userData correto) */
function CACHE_DIR() {
  return path.join(paths.userData(), "json_db");
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Verifica se um arquivo cacheado ainda é válido (dentro do TTL).
 * @param {string} filePath
 * @returns {boolean}
 */
function isCacheValid(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.statSync(filePath);
  return Date.now() - stat.mtimeMs < TTL_MS;
}

/**
 * Faz uma requisição HTTP/HTTPS retornando o body como Buffer.
 * @param {string} url
 * @param {object} headers
 * @returns {Promise<{status: number, body: Buffer, contentType: string}>}
 */
function httpRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks),
          contentType: res.headers["content-type"] || "application/json",
        });
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error("Request timeout"));
    });
  });
}

/**
 * Sanitiza o caminho relativo para evitar path traversal e mapear para o fs.
 * Remove '..' e barras duplas, garante extensão .json.
 *
 * @param {string} relPath  Ex: "/pt_musics" ou "music_123"
 * @returns {string}        Caminho absoluto seguro em CACHE_DIR
 */
function safeLocalPath(relPath) {
  const cleaned = relPath
    .replace(/^\/+/, "")
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "..")
    .join("/");

  // Garantir extensão .json (evitar duplicar se já vier com ela)
  const withJson = cleaned.endsWith(".json") ? cleaned : cleaned + ".json";
  return path.join(CACHE_DIR(), withJson);
}

// ---------------------------------------------------------------------------
// Deduplicação de requests in-flight
// ---------------------------------------------------------------------------

/**
 * Mapa de promises em andamento por path local.
 * Evita race condition quando múltiplas chamadas concorrentes pedem o mesmo arquivo.
 */
const _inflight = new Map();

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Resolve uma requisição de JSON: verifica cache local; se válido retorna do
 * disco; se não (ou stale), baixa do servidor remoto.
 *
 * Em caso de falha de rede/HTTP, serve o cache stale se existir.
 * Múltiplas chamadas concorrentes para o mesmo path compartilham a mesma promise.
 *
 * @param {string} relPath        Ex: "/pt_musics" ou "/music_123"
 * @param {string} remoteBaseUrl  Ex: "https://api.louvorja.com.br/json_db"
 * @param {object} headers        Headers para a requisição (Api-Token, etc.)
 * @returns {Promise<{body: Buffer, contentType: string, fromCache: boolean}>}
 */
async function fetchJson(relPath, remoteBaseUrl, headers = {}) {
  const localPath = safeLocalPath(relPath);

  // Cache válido — retornar do disco (sem deduplicação necessária)
  if (isCacheValid(localPath)) {
    console.log(`[jsonCache] HIT ${relPath}`);
    return {
      body: await fs.readFile(localPath),
      contentType: "application/json",
      fromCache: true,
    };
  }

  // Deduplicação: se já tem request em andamento para este path, reutiliza
  if (_inflight.has(localPath)) {
    return _inflight.get(localPath);
  }

  const promise = (async () => {
    try {
      // Remover barra inicial duplicada entre base e relPath
      const sep = relPath.startsWith("/") ? "" : "/";
      const remoteUrl = remoteBaseUrl + sep + relPath;
      console.log(`[jsonCache] MISS ${relPath} — baixando: ${remoteUrl}`);
      const response = await httpRequest(remoteUrl, headers);

      if (response.status >= 200 && response.status < 300) {
        try {
          JSON.parse(response.body.toString("utf-8"));
        } catch {
          console.warn(`[jsonCache] Resposta não é JSON válido: ${relPath}`);
          return {
            body: response.body,
            contentType: response.contentType,
            fromCache: false,
          };
        }

        // Escrita atômica: .tmp único (timestamp + random) → rename
        await fs.ensureDir(path.dirname(localPath));
        const tmp = `${localPath}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
        try {
          await fs.writeFile(tmp, response.body);
          await fs.move(tmp, localPath, { overwrite: true });
        } catch (writeErr) {
          // Limpar tmp órfão em caso de erro
          try { await fs.remove(tmp); } catch (_) { /* ignore */ }
          throw writeErr;
        }
        console.log(`[jsonCache] Cached ${relPath} → ${localPath}`);

        return {
          body: response.body,
          contentType: "application/json",
          fromCache: false,
        };
      }

      if (fs.existsSync(localPath)) {
        console.warn(
          `[jsonCache] HTTP ${response.status} para ${relPath}, usando cache stale`
        );
        return {
          body: await fs.readFile(localPath),
          contentType: "application/json",
          fromCache: true,
        };
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (e) {
      if (fs.existsSync(localPath)) {
        console.warn(
          `[jsonCache] Erro de rede, usando stale: ${relPath} (${e.message})`
        );
        return {
          body: await fs.readFile(localPath),
          contentType: "application/json",
          fromCache: true,
        };
      }
      throw e;
    } finally {
      _inflight.delete(localPath);
    }
  })();

  _inflight.set(localPath, promise);
  return promise;
}

/**
 * Invalida (remove) todo o cache JSON.
 * Útil para o módulo de update forçar re-download.
 */
function clearCache() {
  const dir = CACHE_DIR();
  if (fs.existsSync(dir)) {
    fs.removeSync(dir);
    fs.ensureDirSync(dir);
    console.log("[jsonCache] Cache limpo:", dir);
  }
}

/**
 * Retorna o caminho do diretório de cache (debug / módulo update).
 * @returns {string}
 */
function dir() {
  return CACHE_DIR();
}

module.exports = { fetchJson, clearCache, dir, safeLocalPath };
