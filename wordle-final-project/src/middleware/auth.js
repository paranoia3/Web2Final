const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authRequired = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        const secret = process.env.JWT_SECRET || "default_secret_change_me";

        const decoded = jwt.verify(token, secret);

        const user = await User.findById(decoded.id || decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "Invalid token owner" });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = { authRequired };