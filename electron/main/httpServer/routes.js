"use strict";

/**
 * Estado em memória para sorteios (replicado entre requests).
 * Mantém sintonia com o estado interno dos módulos de sorteio.
 */
const _sorteios = {
  number: { last: null, history: [] },
  name: { last: null, history: [] },
};

function setupRoutes(app, { mainWindow }) {

  // ---------------------------------------------------------------
  // /api/ping — health check
  // ---------------------------------------------------------------
  app.get("/api/ping", (req, res) => {
    res.json({ status: "ok", app: "LouvorJA" });
  });

  // ---------------------------------------------------------------
  // /api/clock — hora do servidor
  // ---------------------------------------------------------------
  app.get("/api/clock", (req, res) => {
    const now = new Date();
    res.json({
      time: now.toTimeString().slice(0, 8),
      date: now.toISOString().slice(0, 10),
      timestamp: now.getTime(),
    });
  });

  // ---------------------------------------------------------------
  // /api/keyboard?key=N — simular tecla
  // ---------------------------------------------------------------
  app.get("/api/keyboard", (req, res) => {
    const key = req.query.key;
    if (!key || !mainWindow) {
      return res.status(400).json({ error: "key faltando ou janela indisponível" });
    }
    try {
      mainWindow.webContents.sendInputEvent({
        type: "keyDown",
        keyCode: key,
      });
      mainWindow.webContents.sendInputEvent({
        type: "keyUp",
        keyCode: key,
      });
      res.json({ status: "ok", key });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------------------------------------------------------------
  // /api/song-slides?action=next|previous|playing-check|close
  // Despacha eventos pro renderer via webContents.send
  // ---------------------------------------------------------------
  app.get("/api/song-slides", (req, res) => {
    const action = req.query.action;
    if (!mainWindow) {
      return res.status(503).json({ error: "Janela principal não disponível" });
    }

    const validActions = ["next", "previous", "playing-check", "close"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: "action inválida", valid: validActions });
    }

    mainWindow.webContents.send("http:song-slides", { action });
    res.json({ status: "ok", action });
  });

  // ---------------------------------------------------------------
  // /api/open-song?id=N&tag=1|2|3
  // tag: 1=audio, 2=instrumental, 3=no_audio
  // ---------------------------------------------------------------
  app.get("/api/open-song", (req, res) => {
    const id = parseInt(req.query.id, 10);
    const tag = parseInt(req.query.tag || "3", 10);

    if (isNaN(id) || !mainWindow) {
      return res.status(400).json({ error: "id inválido ou janela indisponível" });
    }

    const modeMap = { 1: "audio", 2: "instrumental", 3: "no_audio" };
    const mode = modeMap[tag] || "no_audio";

    mainWindow.webContents.send("http:open-song", { id_music: id, mode });
    res.json({ status: "ok", id, mode });
  });

  // ---------------------------------------------------------------
  // /api/drawing-number?action=get-last|draw
  // ---------------------------------------------------------------
  app.get("/api/drawing-number", (req, res) => {
    const action = req.query.action;

    if (action === "get-last") {
      return res.json({ status: "ok", last: _sorteios.number.last });
    }

    if (action === "draw") {
      const min = parseInt(req.query.min || "1", 10);
      const max = parseInt(req.query.max || "100", 10);
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      _sorteios.number.last = num;
      _sorteios.number.history.push(num);

      if (mainWindow) {
        mainWindow.webContents.send("http:drawing-number", { number: num });
      }

      return res.json({ status: "ok", number: num, history: _sorteios.number.history });
    }

    res.status(400).json({ error: "action inválida", valid: ["get-last", "draw"] });
  });

  // ---------------------------------------------------------------
  // /api/drawing-name?action=get-last|draw&names=A,B,C
  // ---------------------------------------------------------------
  app.get("/api/drawing-name", (req, res) => {
    const action = req.query.action;

    if (action === "get-last") {
      return res.json({ status: "ok", last: _sorteios.name.last });
    }

    if (action === "draw") {
      const namesStr = req.query.names || "";
      const names = namesStr.split(",").map((n) => n.trim()).filter(Boolean);

      if (names.length === 0) {
        return res.status(400).json({ error: "names ausente ou vazio" });
      }

      const name = names[Math.floor(Math.random() * names.length)];
      _sorteios.name.last = name;
      _sorteios.name.history.push(name);

      if (mainWindow) {
        mainWindow.webContents.send("http:drawing-name", { name });
      }

      return res.json({ status: "ok", name, history: _sorteios.name.history });
    }

    res.status(400).json({ error: "action inválida", valid: ["get-last", "draw"] });
  });

  // Aliases compat-Delphi (`/musica`, `/biblia`) e a rota raiz `/` agora
  // são tratados pelo middleware `spa.js` — ele entrega a SPA Vue (com
  // injeção do bridge SSE) ou redireciona para a hash form correspondente.
}

module.exports = { setupRoutes };
