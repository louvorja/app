"use strict";

/**
 * protocol.js — Registra o protocolo customizado `louvorja://`.
 *
 * Hosts suportados:
 *   louvorja://app/<caminho>       — assets do build Vue em dist/ (substitui file://)
 *   louvorja://json_db/<arquivo>   — proxy com cache para api.louvorja.com.br/json_db
 *   louvorja://files/<caminho>     — arquivos locais em userData/files/ (populado em D3 via FTP)
 *
 * O protocolo é marcado como standard + secure para que fetch() e XHR funcionem
 * normalmente dentro do renderer sem erros de CORS/CSP. O host "app" existe
 * para que a app principal seja servida com origem real (não null como no
 * file://) — secure context, BroadcastChannel, fetch relativo, todos
 * funcionam sem hacks.
 *
 * Faz parte da Fase D2 — Cache de JSON do banco.
 */

// IMPORTANTE: importar `electron` (não desestruturar) — `protocol` e `net`
// só ficam disponíveis após `app.whenReady()`. Acessar via `require("electron")`
// dentro das funções resolve corretamente.
const electron = require("electron");
const { pathToFileURL } = require("url");
const fs = require("fs-extra");
const path = require("path");
const paths = require("./paths.js");
const jsonCache = require("./jsonCache.js");

// ---------------------------------------------------------------------------
// Configuração de URLs remotas
// ---------------------------------------------------------------------------

/**
 * Config padrão aponta para produção; substituída via setRemoteConfig()
 * depois que o renderer lê as variáveis de ambiente do Vite.
 */
let _config = {
  databaseUrl: "https://api.louvorja.com.br/json_db",
  filesUrl: "https://api.louvorja.com.br/file",
  apiToken: "",
};

/**
 * Atualiza a configuração de URLs remotas.
 * Chamado pelo renderer via IPC logo após montar o app (main.js).
 *
 * @param {{ databaseUrl?: string, filesUrl?: string, apiToken?: string }} cfg
 */
function setRemoteConfig(cfg) {
  _config = { ..._config, ...cfg };
  console.log("[protocol] Remote config atualizada:", {
    databaseUrl: _config.databaseUrl,
    filesUrl: _config.filesUrl,
  });
}

/**
 * Liga/desliga o auto-cache de mídia (S1). Quando OFF, stream remoto
 * passa direto para o renderer sem gravar no disco.
 */
let _autoCacheEnabled = true;
function setAutoCacheEnabled(enabled) {
  _autoCacheEnabled = !!enabled;
}

/**
 * Grava um ReadableStream em um arquivo via .tmp + rename atômico.
 * Usado pelo auto-cache do host "files".
 */
async function _writeStreamToFile(readable, finalPath) {
  await fs.ensureDir(path.dirname(finalPath));
  const tmp = `${finalPath}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  const writer = fs.createWriteStream(tmp);
  const reader = readable.getReader();

  try {
    /* eslint-disable no-constant-condition */
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      // value é Uint8Array — converte pra Buffer antes de gravar
      writer.write(Buffer.from(value));
    }
    /* eslint-enable no-constant-condition */
    await new Promise((resolve, reject) => {
      writer.end((err) => (err ? reject(err) : resolve()));
    });
    await fs.move(tmp, finalPath, { overwrite: true });
    console.log("[protocol] Auto-cached:", finalPath);
  } catch (e) {
    try {
      await fs.remove(tmp);
    } catch (_) {
      /* ignore */
    }
    throw e;
  } finally {
    try {
      reader.releaseLock();
    } catch (_) {
      /* ignore */
    }
  }
}

// ---------------------------------------------------------------------------
// Registro do scheme (antes do app.whenReady)
// ---------------------------------------------------------------------------

/**
 * Registra `louvorja://` como scheme privilegiado.
 * DEVE ser chamado antes de `app.whenReady()`.
 */
function register() {
  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: "louvorja",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        bypassCSP: true,
        stream: true,
        corsEnabled: true,
      },
    },
  ]);
}

// ---------------------------------------------------------------------------
// Handler do protocolo (após app.whenReady)
// ---------------------------------------------------------------------------

/**
 * Instala o handler para `louvorja://`.
 * DEVE ser chamado dentro de `app.whenReady()`.
 */
function handle() {
  electron.protocol.handle("louvorja", async (request) => {
    try {
      const url = new URL(request.url);
      const host = url.host; // "app" | "json_db" | "files"
      const pathname = url.pathname || "/";

      // ------------------------------------------------------------------
      // louvorja://app/<caminho>
      // Serve assets do build Vue (dist/). Substitui file:// para que
      // a origem do renderer não seja null.
      // ------------------------------------------------------------------
      if (host === "app") {
        const distDir = path.join(electron.app.getAppPath(), "dist");
        const cleaned = pathname.replace(/^\/+/, "") || "index.html";
        const localPath = path.resolve(distDir, cleaned);

        if (!localPath.startsWith(distDir + path.sep) && localPath !== distDir) {
          console.warn("[protocol] app: path traversal bloqueado:", pathname);
          return new Response("Forbidden", { status: 403 });
        }

        if (!fs.existsSync(localPath)) {
          // SPA fallback: rotas client-side (vue-router) caem em index.html
          const indexPath = path.join(distDir, "index.html");
          if (fs.existsSync(indexPath)) {
            return electron.net.fetch(pathToFileURL(indexPath).toString());
          }
          return new Response("Not found", { status: 404 });
        }

        return electron.net.fetch(pathToFileURL(localPath).toString());
      }

      // ------------------------------------------------------------------
      // louvorja://json_db/<arquivo>
      // Serve JSON com cache em userData/json_db/
      // ------------------------------------------------------------------
      if (host === "json_db") {
        const headers = {
          "Api-Token": _config.apiToken,
        };

        const result = await jsonCache.fetchJson(
          pathname,
          _config.databaseUrl,
          headers
        );

        return new Response(result.body, {
          status: 200,
          headers: {
            "Content-Type": result.contentType,
            "X-Cache": result.fromCache ? "HIT" : "MISS",
          },
        });
      }

      // ------------------------------------------------------------------
      // louvorja://files/<caminho>
      // Serve arquivos locais de userData/files/. Se faltar, busca remoto
      // E grava no disco em paralelo (auto-cache S1) — exceto para Range
      // requests (não cacheamos partials).
      // ------------------------------------------------------------------
      if (host === "files") {
        const filesDir = paths.filesDir();
        const rawRelative = pathname.replace(/^\/+/, "");
        const localPath = path.resolve(filesDir, rawRelative);

        // Proteção path traversal: o caminho resolvido deve iniciar com filesDir
        if (!localPath.startsWith(filesDir + path.sep) && localPath !== filesDir) {
          console.warn("[protocol] Path traversal bloqueado:", pathname);
          return new Response("Forbidden", { status: 403 });
        }

        // Prioriza arquivo local sempre que existe (suporta Range, streaming, mime).
        if (fs.existsSync(localPath)) {
          const fileUrl = pathToFileURL(localPath).toString();
          return electron.net.fetch(fileUrl);
        }

        // Fallback: stream remoto. Cacheia se for request "completo" (sem Range).
        if (_config.filesUrl) {
          const remoteUrl = _config.filesUrl + (pathname.startsWith("/") ? pathname : "/" + pathname);
          const isRangeRequest = !!request.headers.get("range");
          const headers = _config.apiToken ? { "Api-Token": _config.apiToken } : {};

          try {
            const response = await electron.net.fetch(remoteUrl, { headers });

            if (!response.ok || response.status !== 200 || isRangeRequest) {
              return response; // não cacheamos parciais nem erros
            }

            if (!_autoCacheEnabled || !response.body) {
              return response;
            }

            // Tee: uma branch vai pro renderer, outra grava em .tmp e renomeia.
            const [forRenderer, forDisk] = response.body.tee();
            _writeStreamToFile(forDisk, localPath).catch((e) =>
              console.warn("[protocol] Auto-cache falhou:", e.message || e)
            );

            return new Response(forRenderer, {
              status: 200,
              headers: response.headers,
            });
          } catch (fetchErr) {
            console.warn("[protocol] Falha ao buscar remoto:", remoteUrl, fetchErr.message);
            return new Response("File not found locally and remote fetch failed", { status: 404 });
          }
        }

        return new Response("File not found", { status: 404 });
      }

      // Host desconhecido
      return new Response(`louvorja:// host desconhecido: "${host}"`, {
        status: 404,
      });
    } catch (e) {
      console.error("[protocol] Erro interno:", e);
      return new Response(e.message || "Internal error", { status: 500 });
    }
  });

  console.log("[protocol] Handler louvorja:// registrado.");
}

/**
 * Retorna a config atual de URLs remotas. Usado pelo bridge SSE
 * (httpServer/events.js) para traduzir `louvorja://files/...` em URLs HTTPS
 * que clients remotos (OBS, celular) consigam carregar — eles não conhecem
 * o protocolo customizado do Electron.
 */
function getRemoteConfig() {
  return { ..._config };
}

module.exports = { register, handle, setRemoteConfig, getRemoteConfig, setAutoCacheEnabled };
