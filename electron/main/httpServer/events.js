"use strict";

/**
 * Bridge SSE para clients de transmissão (OBS, celular, navegador remoto).
 *
 * Por que SSE e não BroadcastChannel:
 *  BroadcastChannel("louvorja") cruza BrowserWindows do Electron, mas NÃO
 *  cruza origens HTTP nem máquinas. Quando OBS Browser Source ou um
 *  smartphone abre `http://192.168.x.x:7070/musica?transmissao`, eles
 *  estão num browser totalmente isolado do app desktop. Precisam receber
 *  o estado por outro caminho.
 *
 * Modelo:
 *  1. Renderer principal emite `slide_change` no BroadcastChannel.
 *  2. `Broadcast.ts` (renderer) faz `transmission.broadcast(msg)` via IPC.
 *  3. `main.cjs` chama `events.publish(msg)` aqui.
 *  4. Este módulo:
 *     - guarda o último estado de cada tipo (replay no connect)
 *     - traduz URLs `louvorja://` → HTTPS (clients remotos não conhecem o
 *       protocolo customizado)
 *     - faz fan-out para todos os Response SSE conectados
 *  5. O cliente remoto roda um pequeno script (injetado em `spa.js`) que
 *     abre `EventSource("/events?token=...")` e re-emite cada msg via
 *     CustomEvent("louvorja-sse"). `Broadcast.ts` ouve esse evento e o
 *     entrega aos listeners locais — exatamente como se viesse do BC.
 *
 * Filtro de tipos: só relayamos eventos relevantes para projeção/captura
 * (slide, bíblia, projeção genérica de módulo). Eventos in-app (hotkeys,
 * ribbon actions, command palette) ficam fora.
 */

const REMOTE_RELAY_TYPES = new Set([
  "slide_change",
  "slides_data",
  "media_close",
  "bible_verse",
  "bible_format_changed",
  "module_projection_value",
  "module_format_changed",
  "message_board",
]);

/** @type {Set<{ res: import('http').ServerResponse, id: number }>} */
const _clients = new Set();

/** Último payload conhecido por tipo — replay quando um cliente conecta. */
const _lastByType = new Map();

let _nextId = 1;

let _getRemoteConfig = () => ({ filesUrl: "", databaseUrl: "" });

/**
 * Configura provedor de URLs remotas. Chamado uma vez ao iniciar o servidor.
 * @param {() => { filesUrl?: string, databaseUrl?: string }} fn
 */
function setRemoteConfigProvider(fn) {
  if (typeof fn === "function") _getRemoteConfig = fn;
}

/**
 * Reescreve URLs `louvorja://` em qualquer string para HTTPS público.
 * Mantém o resto do payload intacto.
 */
function _rewriteCustomProtocol(value) {
  if (value == null) return value;

  if (typeof value === "string") {
    if (value.indexOf("louvorja://") === -1) return value;
    const cfg = _getRemoteConfig() || {};
    return value
      .replace(/louvorja:\/\/files(\/?)/g, (cfg.filesUrl || "") + "$1")
      .replace(/louvorja:\/\/json_db(\/?)/g, (cfg.databaseUrl || "") + "$1")
      // Outros hosts customizados — degrade para o filesUrl.
      .replace(/louvorja:\/\/[^/]+/g, cfg.filesUrl || "");
  }

  if (Array.isArray(value)) {
    return value.map(_rewriteCustomProtocol);
  }

  if (typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = _rewriteCustomProtocol(value[k]);
    }
    return out;
  }

  return value;
}

/**
 * Handler do endpoint GET /events. Mantém a conexão aberta e empurra
 * mensagens conforme `publish()` for chamado.
 */
function handler(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  // Comentário inicial força o navegador a entregar os headers + abrir o stream.
  res.write(":ok\n\n");

  const id = _nextId++;
  const client = { res, id };
  _clients.add(client);

  // Replay do último estado conhecido para que clients que conectarem
  // depois do início da música/versículo já apareçam com o conteúdo certo.
  for (const [type, payload] of _lastByType.entries()) {
    _writeEvent(res, { type, payload: _rewriteCustomProtocol(payload) });
  }

  // Keepalive — alguns proxies derrubam conexões inativas em 30-60s.
  const ka = setInterval(() => {
    try { res.write(":keepalive\n\n"); } catch { /* noop */ }
  }, 25000);

  const cleanup = () => {
    clearInterval(ka);
    _clients.delete(client);
    try { res.end(); } catch { /* noop */ }
  };

  req.on("close", cleanup);
  req.on("error", cleanup);
}

function _writeEvent(res, msg) {
  try {
    res.write("data: " + JSON.stringify(msg) + "\n\n");
  } catch {
    /* socket fechado — cleanup acontece via req.on("close") */
  }
}

/**
 * Publica uma mensagem para todos os clients SSE conectados.
 * No-op se o tipo não é relayável ou se não há clients.
 *
 * @param {{ type: string, payload: unknown }} msg
 */
function publish(msg) {
  if (!msg || typeof msg.type !== "string") return;
  if (!REMOTE_RELAY_TYPES.has(msg.type)) return;

  // `media_close` invalida o estado de slide/letra — qualquer client que
  // conectar DEPOIS do close não deve receber replay da música anterior.
  // Limpamos o cache antes de propagar; o evento em si é transitório e
  // por isso não fica em `_lastByType`.
  if (msg.type === "media_close") {
    _lastByType.delete("slide_change");
    _lastByType.delete("slides_data");
  } else {
    _lastByType.set(msg.type, msg.payload);
  }

  if (_clients.size === 0) return;

  const out = { type: msg.type, payload: _rewriteCustomProtocol(msg.payload) };
  for (const c of _clients) _writeEvent(c.res, out);
}

/** Fecha todas as conexões SSE. Chamado quando o servidor para. */
function closeAll() {
  for (const c of _clients) {
    try { c.res.end(); } catch { /* noop */ }
  }
  _clients.clear();
  _lastByType.clear();
}

function status() {
  return { clients: _clients.size, lastTypes: [..._lastByType.keys()] };
}

module.exports = {
  handler,
  publish,
  closeAll,
  status,
  setRemoteConfigProvider,
  REMOTE_RELAY_TYPES,
};
