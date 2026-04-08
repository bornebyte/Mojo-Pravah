const { verifyToken } = require("../utils/token");

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing authentication token" });
    }

    const token = authHeader.slice(7);
    try {
        req.user = verifyToken(token);
        return next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }

    return next();
};

module.exports = {
    requireAuth,
    requireAdmin,
};
