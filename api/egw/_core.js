// Lógica compartilhada de acesso à EGW Writings API, usada tanto pelas
// funções serverless da Vercel (produção) quanto pelo middleware de dev
// do Vite (vite.config.js), para funcionar em "npm run dev" sem precisar
// do Vercel CLI. O client_secret nunca sai daqui — o frontend só chama
// os endpoints /api/egw/* deste próprio domínio.

const TOKEN_URL = "https://cpanel.egwwritings.org/connect/token";
const API_BASE = "https://a.egwwritings.org";

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.EGW_CLIENT_ID;
  const clientSecret = process.env.EGW_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "EGW_CLIENT_ID / EGW_CLIENT_SECRET não configurados no ambiente do servidor.",
    );
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "writings search",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Falha ao autenticar na EGW Writings API (${response.status}): ${text}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Renova um minuto antes de expirar, por segurança.
  cachedTokenExpiry = now + Math.max((data.expires_in || 300) - 60, 30) * 1000;
  return cachedToken;
}

async function egwFetch(path) {
  const token = await getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!response.ok) {
    const message = body?.detail || body?.title || response.statusText;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return body;
}

export async function listBooks({ lang = "pt", limit = 100, page } = {}) {
  const params = new URLSearchParams({ lang, limit: String(limit) });
  if (page) params.set("page", String(page));
  return egwFetch(`/content/books?${params}`);
}

export async function getBookToc(bookId) {
  return egwFetch(`/content/books/${encodeURIComponent(bookId)}/toc`);
}

export async function getChapter(bookId, para) {
  return egwFetch(
    `/content/books/${encodeURIComponent(bookId)}/chapter/${encodeURIComponent(para)}`,
  );
}

export async function search({ query, lang = "pt", limit = 20, offset = 0 } = {}) {
  if (!query) {
    const err = new Error('Parâmetro "query" é obrigatório.');
    err.status = 400;
    throw err;
  }
  const params = new URLSearchParams();
  params.append("query", query);
  params.append("lang", lang);
  params.append("limit", String(Math.min(limit * 2, 100))); // folga p/ filtrar "bible"
  params.append("offset", String(offset));
  params.append("snippet", "long");
  params.append("order", "rel");

  const data = await egwFetch(`/search?${params}`);
  // A API mistura resultados da Bíblia junto com os escritos de Ellen White
  // (campo "group"); aqui já existe um módulo dedicado à Bíblia, então
  // filtramos para manter só os escritos.
  const results = (data.results || [])
    .filter((item) => item.group == "egwwritings")
    .slice(0, limit);
  return { total: data.total, results };
}
