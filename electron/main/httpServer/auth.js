"use strict";

/**
 * Middleware de autenticação por token.
 *
 * Comportamento alinhado com o `fmTransmitir.pas` do Delphi:
 *  - Páginas estáticas (SPA, aliases /musica e /biblia, assets) são livres
 *    — o conteúdo exibido é só o estado já público da projeção.
 *  - APIs de controle (`/api/*`) e o canal SSE de eventos (`/events`)
 *    exigem token quando o cliente é remoto.
 *  - Localhost (127.0.0.1, ::1) bypassa sempre — a segurança nesse caso
 *    vem do firewall do SO (apenas processos da mesma máquina alcançam).
 *
 * IMPORTANTE — o token é resolvido DINAMICAMENTE em cada request via
 * `getToken()`. Antes recebíamos a string e congelávamos na closure: ao
 * clicar em "Gerar novo" no menu Transmissão, `_token` mudava na memória
 * mas o middleware continuava validando o antigo, gerando 401 nos clients
 * que já tinham recarregado a página com o token novo.
 */

function _isLocalhost(ip) {
  // Comparação exata. `endsWith("127.0.0.1")` deixaria escapar IPv4-em-IPv6
  // exóticos via proxy mal configurado.
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip === "localhost"
  );
}

function _isProtectedPath(reqPath) {
  if (typeof reqPath !== "string") return false;
  if (reqPath.startsWith("/api/")) return true;
  if (reqPath === "/events") return true;
  return false;
}

/**
 * @param {() => string | null} getToken  Função que retorna o token atual.
 *   Aceitamos string como atalho (legacy), mas internamente convertemos
 *   numa thunk para preservar a leitura dinâmica.
 */
function setupAuth(getToken) {
  const resolve =
    typeof getToken === "function" ? getToken : () => getToken;

  return (req, res, next) => {
    const ip = req.ip || (req.connection && req.connection.remoteAddress) || "";

    if (_isLocalhost(ip)) return next();
    if (!_isProtectedPath(req.path)) return next();

    const provided = req.query && req.query.token;
    const expected = resolve();
    if (!expected || provided !== expected) {
      return res.status(401).json({
        status: "error",
        message: "Token inválido",
        code: "INVALID_TOKEN",
      });
    }
    next();
  };
}

module.exports = { setupAuth };
