"use strict";

/**
 * Middleware Express que:
 * - Bypassa auth para localhost (127.0.0.1 / ::1)
 * - Exige ?token=XXX para clients remotos
 */
function setupAuth(token) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || "";
    // Comparação exata — `ip.endsWith("127.0.0.1")` que tínhamos antes deixava
    // qualquer IP que terminasse com essa substring (ex: notação IPv4-em-IPv6
    // exótica via proxy mal configurado, `2001:db8::127.0.0.1`, ou hostname
    // mascarado em rede corporativa) bypassar o auth.
    const isLocalhost =
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "::ffff:127.0.0.1" ||
      ip === "localhost";

    if (isLocalhost) return next();

    const provided = req.query.token;
    if (provided !== token) {
      return res.status(401).json({ error: "Token inválido" });
    }
    next();
  };
}

module.exports = { setupAuth };
