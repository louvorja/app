"use strict";

/**
 * Middleware Express que:
 * - Bypassa auth para localhost (127.0.0.1 / ::1)
 * - Exige ?token=XXX para clients remotos
 */
function setupAuth(token) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || "";
    const isLocalhost =
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "::ffff:127.0.0.1" ||
      ip.endsWith("127.0.0.1");

    if (isLocalhost) return next();

    const provided = req.query.token;
    if (provided !== token) {
      return res.status(401).json({ error: "Token inválido" });
    }
    next();
  };
}

module.exports = { setupAuth };
