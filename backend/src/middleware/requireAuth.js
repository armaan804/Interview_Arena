const { verifySessionToken } = require("../lib/auth");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({ error: "Session expired or invalid." });
  }

  req.user = session; // { userId, email, name }
  next();
}

module.exports = { requireAuth };
