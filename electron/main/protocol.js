"use strict";

/**
 * protocol.js — Registra o protocolo customizado `louvorja://`.
 *
 * Hosts suportados:
 *   louvorja://json_db/<arquivo>   — proxy com cache para api.louvorja.com.br/json_db
 *   louvorja://files/<caminho>     — arquivos locais em userData/files/ (populado em D3 via FTP)
 *
 * O protocolo é marcado como standard + secure para que fetch() e XHR funcionem
 * normalmente dentro do renderer sem erros de CORS/CSP.
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
      const host = url.host; // "json_db" ou "files"
      const pathname = url.pathname || "/";

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
      // Serve arquivos locais de userData/files/ (populado em D3 via FTP)
      // ------------------------------------------------------------------
      if (host === "files") {
        const filesDir = path.join(paths.userData(), "files");
        const rawRelative = pathname.replace(/^\/+/, "");
        const localPath = path.resolve(filesDir, rawRelative);

        // Proteção path traversal: o caminho resolvido deve iniciar com filesDir
        if (!localPath.startsWith(filesDir + path.sep) && localPath !== filesDir) {
          console.warn("[protocol] Path traversal bloqueado:", pathname);
          return new Response("Forbidden", { status: 403 });
        }

        // Se existe localmente, servir do disco (suporta Range, streaming, mime)
        if (fs.existsSync(localPath)) {
          const fileUrl = pathToFileURL(localPath).toString();
          return electron.net.fetch(fileUrl);
        }

        // Fallback: stream do servidor remoto (necessita internet, modo "online")
        // Permite usar o app antes de baixar tudo via FTP (D3)
        if (_config.filesUrl) {
          const remoteUrl = _config.filesUrl + (pathname.startsWith("/") ? pathname : "/" + pathname);
          try {
            return await electron.net.fetch(remoteUrl, {
              headers: _config.apiToken ? { "Api-Token": _config.apiToken } : {},
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

module.exports = { register, handle, setRemoteConfig };
