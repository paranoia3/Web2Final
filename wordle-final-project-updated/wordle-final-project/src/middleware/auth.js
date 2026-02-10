const { verifyToken } = require("../utils/jwt");
const { User } = require("../models/User");

async function authRequired(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Missing or invalid Authorization header" });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { authRequired };
