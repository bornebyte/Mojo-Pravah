const dotenv = require("dotenv");

dotenv.config();

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

module.exports = {
    port: parseNumber(process.env.PORT, 4000),
    clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    jwtSecret: process.env.JWT_SECRET || "replace-this-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
    useRedisAdapter: process.env.USE_REDIS_ADAPTER === "true",
    redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
};
