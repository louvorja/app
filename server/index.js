import http from "node:http";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 8787;

// Sessão em memória: cada "culto" ativo é uma sessão isolada, identificada
// por um código curto (o que vai no QR Code). Sem banco de dados — se o
// processo reiniciar, as sessões acabam e uma nova precisa ser criada.
// Isso é intencional: não há necessidade de persistir histórico aqui.
const sessions = new Map(); // sessionId -> Session

class Session {
  constructor(id) {
    this.id = id;
    this.token = crypto.randomBytes(24).toString("hex"); // só o operador tem
    this.state = { type: "idle", title: "", text: "", reference: "" };
    this.updatedAt = Date.now();
    this.clients = new Set(); // respostas HTTP dos espectadores conectados via SSE
  }

  setState(state) {
    this.state = state;
    this.updatedAt = Date.now();
    const payload = `event: state\ndata: ${JSON.stringify(this.state)}\n\n`;
    for (const res of this.clients) {
      res.write(payload);
    }
  }

  viewerCount() {
    return this.clients.size;
  }
}

function generateSessionId() {
  // 6 caracteres, sem letras/números ambíguos (0/O, 1/I/L) — precisa ser
  // digitável à mão como alternativa a escanear o QR Code.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let id;
  do {
    id = Array.from({ length: 6 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  } while (sessions.has(id));
  return id;
}

function requireSession(req, res, next) {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: "session_not_found" });
  }
  req.session = session;
  next();
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (token !== req.session.token) {
    return res.status(401).json({ error: "invalid_token" });
  }
  next();
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, sessions: sessions.size });
});

// Operador: cria uma sessão nova para o culto de hoje.
app.post("/api/sessions", (req, res) => {
  const id = generateSessionId();
  const session = new Session(id);
  sessions.set(id, session);
  res.status(201).json({ sessionId: id, token: session.token });
});

// Operador: informações da sessão (quantos espectadores conectados agora).
app.get("/api/sessions/:id/info", requireSession, requireAuth, (req, res) => {
  res.json({ sessionId: req.session.id, viewers: req.session.viewerCount(), updatedAt: req.session.updatedAt });
});

// Operador: envia o estado atual (o que está projetado agora).
app.post("/api/sessions/:id/state", requireSession, requireAuth, (req, res) => {
  const { type, title, text, reference } = req.body || {};
  req.session.setState({ type: type || "idle", title: title || "", text: text || "", reference: reference || "" });
  res.json({ ok: true, viewers: req.session.viewerCount() });
});

// Audiência: leitura pontual do estado (fallback de polling, suporta ETag).
app.get("/api/sessions/:id/state", requireSession, (req, res) => {
  const etag = `"${req.session.updatedAt}"`;
  if (req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }
  res.set("ETag", etag);
  res.set("Cache-Control", "no-cache");
  res.json(req.session.state);
});

// Audiência: canal ao vivo (Server-Sent Events).
app.get("/api/sessions/:id/stream", requireSession, (req, res) => {
  const session = req.session;

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // evita buffering em proxies tipo Nginx
  });
  res.flushHeaders?.();

  // Estado inicial imediato, para não esperar a próxima mudança.
  res.write(`event: state\ndata: ${JSON.stringify(session.state)}\n\n`);
  session.clients.add(res);

  // Ping de manutenção — evita que proxies/navegadores derrubem a conexão
  // por "inatividade" quando o slide não muda por um tempo.
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    session.clients.delete(res);
  });
});

// Operador: encerra a sessão explicitamente ao final do culto.
app.delete("/api/sessions/:id", requireSession, requireAuth, (req, res) => {
  for (const res of req.session.clients) res.end();
  sessions.delete(req.params.id);
  res.json({ ok: true });
});

// Faxina: sessões sem nenhuma atualização há mais de 12h são descartadas,
// para não acumular memória em um processo que fica rodando por dias.
setInterval(() => {
  const staleBefore = Date.now() - 12 * 60 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.updatedAt < staleBefore && session.clients.size === 0) {
      sessions.delete(id);
    }
  }
}, 60 * 60 * 1000);

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`[mirror-relay] rodando em http://localhost:${PORT}`);
});
