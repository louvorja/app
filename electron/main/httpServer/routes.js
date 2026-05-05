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

  // ---------------------------------------------------------------
  // /musica?transmissao|retorno — redirecionamento para views Vue
  // ---------------------------------------------------------------
  app.get("/musica", (req, res) => {
    if (req.query.transmissao !== undefined) {
      res.send(redirectHTML("/obs"));
    } else if (req.query.retorno !== undefined) {
      res.send(redirectHTML("/projection/return"));
    } else {
      res.status(404).json({ error: "Use ?transmissao ou ?retorno" });
    }
  });

  // ---------------------------------------------------------------
  // /biblia?transmissao — redirecionamento para view OBS Bíblia
  // ---------------------------------------------------------------
  app.get("/biblia", (req, res) => {
    if (req.query.transmissao !== undefined) {
      res.send(redirectHTML("/obs/bible"));
    } else {
      res.status(404).json({ error: "Use ?transmissao" });
    }
  });

  // ---------------------------------------------------------------
  // GET / — index HTML
  // ---------------------------------------------------------------
  app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"><title>LouvorJA Server</title>
<style>body{font-family:sans-serif;max-width:600px;margin:40px auto;padding:0 20px;color:#333}
code{background:#f0f0f0;padding:2px 6px;border-radius:3px}h1{color:#6366f1}</style>
</head><body>
<h1>LouvorJA Server</h1>
<p>Servidor HTTP embarcado rodando.</p>
<p><strong>API endpoints:</strong></p>
<ul>
<li><code>GET /api/ping</code></li>
<li><code>GET /api/clock</code></li>
<li><code>GET /api/keyboard?key=N&amp;token=XXX</code></li>
<li><code>GET /api/song-slides?action=next|previous|close&amp;token=XXX</code></li>
<li><code>GET /api/open-song?id=N&amp;tag=1|2|3&amp;token=XXX</code></li>
<li><code>GET /api/drawing-number?action=draw&amp;min=1&amp;max=100&amp;token=XXX</code></li>
<li><code>GET /api/drawing-name?action=draw&amp;names=A,B,C&amp;token=XXX</code></li>
</ul>
<p>Para clients remotos, inclua <code>?token=XXX</code> em todas as URLs.</p>
</body></html>`);
  });
}

function redirectHTML(route) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{margin:0;padding:0;background:#000;color:#fff;font-family:sans-serif}
.box{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
a{color:#6366f1;font-size:1.2rem;margin-top:1rem;text-decoration:none}
a:hover{text-decoration:underline}</style></head>
<body><div class="box">
<p>Esta rota deve ser aberta no app desktop LouvorJA.</p>
<a href="louvorja://${route.replace(/^\//, "")}">Abrir no LouvorJA</a>
<p style="opacity:0.5;margin-top:2rem;font-size:0.85rem">Para captura no OBS, abra o app desktop e copie a URL local <code>file://${route}</code></p>
</div></body></html>`;
}

module.exports = { setupRoutes };
