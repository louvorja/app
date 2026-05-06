"use strict";

/**
 * Middleware que serve a SPA Vue pelo servidor HTTP embarcado.
 *
 * Em produção: serve `dist/` estaticamente; qualquer rota desconhecida cai
 *   no `index.html` (history fallback) com injeção de um <script> bridge SSE
 *   no <head>.
 * Em dev: faz proxy transparente para o Vite dev server (5002), exceto
 *   para `/api/*` e `/events`. O HTML retornado também recebe a injeção.
 *
 * Hash routing forçado:
 *   O build do desktop usa `base: "./"` (Vite) — funciona em `file://` mas
 *   quebra em rotas profundas servidas via HTTP (ex: `/obs/bible` faria o
 *   browser resolver `./assets/...` como `/obs/assets/...`). Para evitar
 *   reconstruir o bundle, o script injetado seta `window.LJ_HASH_ROUTING=true`
 *   e o router (src/router/index.js) cai em `createWebHashHistory`. Todas as
 *   rotas SPA viram fragments (`/#/obs`, `/#/projection/return`, ...) que
 *   sempre carregam de `/`.
 */

const path = require("path");
const fs = require("fs-extra");
const http = require("http");
const express = require("express");

const DEV_VITE_HOST = "localhost";
const DEV_VITE_PORT = 5002;

// Rotas servidas pela SPA — qualquer coisa fora daqui (/api, /events) é
// tratada por outros middlewares antes deste.
const SPA_ROUTES = new Set([
  "/",
  "/obs",
  "/obs/bible",
  "/projection",
  "/projection/return",
  "/projection/bible",
  "/projection/module",
  "/clock",
  "/operator",
]);

/**
 * O HTML produzido pelo Vite no target desktop traz uma `<meta>` CSP
 * restritiva (script-src 'self' file: louvorja:) — apropriada para a janela
 * Electron carregada via `file://` ou `louvorja://`, mas bloqueia o script
 * inline que injetamos para o bridge SSE quando o mesmo bundle é servido
 * via HTTP. As janelas Electron continuam protegidas pelo CSP via header
 * (vide `main.cjs` → `session.webRequest.onHeadersReceived`); aqui
 * removemos a meta-tag só do HTML que vai pra clients remotos.
 */
function _stripCspMeta(html) {
  return html.replace(
    /<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi,
    ""
  );
}

function _injectBridge(html, token) {
  if (html.includes("window.LJ_SSE_BRIDGE_INJECTED")) return html;
  const cleaned = _stripCspMeta(html);
  const bridge = _bridgeScript(token);
  if (cleaned.includes("</head>")) {
    return cleaned.replace("</head>", bridge + "</head>");
  }
  return bridge + cleaned;
}

/**
 * Script injetado no HTML retornado para clients HTTP. Roda ANTES da app
 * Vue carregar — assim o router já pega `LJ_HASH_ROUTING=true` no boot.
 */
function _bridgeScript(token) {
  const tokenJson = JSON.stringify(token || "");
  // Bridge cliente: abre EventSource, mantém um BUFFER de mensagens recebidas
  // antes do bundle Vue carregar (race condition real — o replay do último
  // estado vem assim que conectamos, e o usuário pode estar com música
  // tocando há horas). O Broadcast.ts drena esse buffer no module-load.
  return `<script>(function(){
  if (window.LJ_SSE_BRIDGE_INJECTED) return;
  window.LJ_SSE_BRIDGE_INJECTED = true;
  window.LJ_HASH_ROUTING = true;
  window.LJ_REMOTE_CLIENT = true;
  window.__ljSseBuffer = window.__ljSseBuffer || [];
  window.__ljSseDrained = false;
  var token = ${tokenJson};
  function tokenFromUrl() {
    try {
      var u = new URL(window.location.href);
      return u.searchParams.get('token') || '';
    } catch (e) { return ''; }
  }
  var url = '/events';
  var t = tokenFromUrl() || token;
  if (t) url += '?token=' + encodeURIComponent(t);
  function deliver(msg) {
    if (!msg || typeof msg.type !== 'string') return;
    if (window.__ljSseDrained) {
      try {
        window.dispatchEvent(new CustomEvent('louvorja-sse', { detail: msg }));
      } catch (_) { /* noop */ }
    } else {
      window.__ljSseBuffer.push(msg);
    }
  }
  function attach() {
    try {
      var es = new EventSource(url);
      es.onmessage = function(e) {
        if (!e || !e.data) return;
        try { deliver(JSON.parse(e.data)); } catch (_) { /* noop */ }
      };
      // EventSource reconecta sozinho; nada a fazer no onerror.
      window.__ljSSE = es;
    } catch (_) { /* noop */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();</script>`;
}

/**
 * Cria o handler que entrega `index.html` a partir do dist/, com a injeção
 * do bridge SSE. Lê o HTML uma vez e cacheia (em prod o build não muda
 * durante runtime).
 */
function _createStaticIndexHandler(distDir, getToken) {
  let _cached = null;
  return (_req, res) => {
    try {
      if (_cached === null) {
        _cached = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
      }
      const html = _injectBridge(_cached, typeof getToken === "function" ? getToken() : null);
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "no-cache");
      res.send(html);
    } catch (e) {
      res.status(500).send("SPA index missing: " + e.message);
    }
  };
}

/**
 * Proxy simples para o Vite dev server. Reescreve a resposta HTML para
 * injetar o bridge — outras respostas (JS/CSS/assets) passam intactas.
 */
function _createDevProxyHandler(getToken) {
  return (req, res) => {
    const opts = {
      hostname: DEV_VITE_HOST,
      port: DEV_VITE_PORT,
      path: req.originalUrl || req.url,
      method: req.method,
      headers: { ...req.headers, host: `${DEV_VITE_HOST}:${DEV_VITE_PORT}` },
    };
    const proxyReq = http.request(opts, (proxyRes) => {
      const ct = proxyRes.headers["content-type"] || "";
      const isHtml = ct.includes("text/html");
      const headers = { ...proxyRes.headers };
      // Reescrita do HTML quebra Content-Length original.
      if (isHtml) delete headers["content-length"];
      res.writeHead(proxyRes.statusCode || 502, headers);

      if (isHtml) {
        const chunks = [];
        proxyRes.on("data", (c) => chunks.push(c));
        proxyRes.on("end", () => {
          const html = Buffer.concat(chunks).toString("utf8");
          res.end(_injectBridge(html, typeof getToken === "function" ? getToken() : null));
        });
      } else {
        proxyRes.pipe(res);
      }
    });
    proxyReq.on("error", (e) => {
      res
        .status(502)
        .send(`Vite dev server indisponível em http://${DEV_VITE_HOST}:${DEV_VITE_PORT}: ${e.message}`);
    });
    if (req.readable) req.pipe(proxyReq);
    else proxyReq.end();
  };
}

/**
 * Aliases compatíveis com o servidor HTTP do Delphi.
 *
 * No Delphi, OBS e celular acessavam:
 *   /musica?transmissao  → página de captura de slide para OBS
 *   /musica?retorno      → stage display (atual + próximo)
 *   /biblia?transmissao  → captura de versículo para OBS
 *
 * Mantemos os mesmos paths para que tutoriais antigos continuem válidos.
 * Cada um redireciona para a rota Vue correspondente em hash form (porque
 * o bundle tem `base: "./"` e rotas profundas quebrariam asset paths).
 */
function _setupAliases(app) {
  app.get("/musica", (req, res) => {
    if (Object.prototype.hasOwnProperty.call(req.query, "transmissao")) {
      return res.redirect(302, "/#/obs" + _carryToken(req));
    }
    if (Object.prototype.hasOwnProperty.call(req.query, "retorno")) {
      return res.redirect(302, "/#/projection/return" + _carryToken(req));
    }
    return res
      .status(404)
      .send("Use /musica?transmissao (OBS) ou /musica?retorno (stage).");
  });

  app.get("/biblia", (req, res) => {
    if (Object.prototype.hasOwnProperty.call(req.query, "transmissao")) {
      return res.redirect(302, "/#/obs/bible" + _carryToken(req));
    }
    return res.status(404).send("Use /biblia?transmissao (OBS).");
  });
}

function _carryToken(req) {
  const t = req.query && req.query.token;
  return t ? "?token=" + encodeURIComponent(String(t)) : "";
}

/**
 * Instala o middleware SPA no app Express.
 *
 * @param {import('express').Application} app
 * @param {{ isDev: boolean, distDir: string, getToken: () => string|null }} opts
 */
function install(app, { isDev, distDir, getToken }) {
  _setupAliases(app);

  if (isDev) {
    const proxy = _createDevProxyHandler(getToken);
    // Tudo que não bater em /api ou /events vai pro proxy. As rotas SPA
    // são entregues como o index.html injetado, e os assets do Vite ficam
    // disponíveis em /src/, /node_modules/, /@vite/, /@id/ etc.
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/") || req.path === "/events") return next();
      return proxy(req, res);
    });
    return;
  }

  // Produção: estáticos do dist + fallback para index.html.
  app.use(
    express.static(distDir, {
      // index.html é entregue pelo handler abaixo (com injeção); evita
      // que express.static responda direto e bypasse a injeção.
      index: false,
      setHeaders(res, file) {
        // Assets com hash são imutáveis — cache agressivo.
        if (/\.[a-f0-9]{8,}\.(js|css|woff2?)$/i.test(file)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );

  const indexHandler = _createStaticIndexHandler(distDir, getToken);

  // Rotas SPA conhecidas (Vue Router), incluindo os redirects emitidos
  // pelos aliases acima quando o cliente segue o 302.
  for (const route of SPA_ROUTES) {
    app.get(route, indexHandler);
  }

  // History fallback para qualquer outro GET sem extensão.
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api/") || req.path === "/events") return next();
    if (req.path.includes(".")) return next(); // arquivo estático ausente → 404 do express.static
    return indexHandler(req, res);
  });
}

module.exports = { install, SPA_ROUTES };
