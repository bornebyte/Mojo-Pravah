const { verifyToken } = require("../utils/token");
const { findUserByEmail, sanitizeUser } = require("../services/userStore");

const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing authentication token" });
    }

    const token = authHeader.slice(7);
    try {
        const decoded = verifyToken(token);
        const user = await findUserByEmail(decoded.email);

        if (!user) {
            return res.status(401).json({ message: "User does not exist" });
        }

        req.user = sanitizeUser(user);
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
